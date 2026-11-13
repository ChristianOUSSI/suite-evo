from datetime import datetime, time, timedelta

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select

from ..deps import CurrentUser, DbSession
from ..models import Appointment, Service
from ..schemas import AppointmentIn, AppointmentPatch
from ..services import contacts as annuaire
from ..services import dispatch as envois
from ..services import scheduling, switching
from ..services.present import appointment_dict, dispatch_dict
from ..utils import normalize_phone, utcnow

router = APIRouter(tags=["agenda"])

HORIZONS = ("futur", "passe", "jour", "tous")


def _service(db, org_id: int, service_id: int) -> Service:
    service = db.get(Service, service_id)
    if not service or service.organization_id != org_id:
        raise HTTPException(status_code=404, detail="Ce guichet n'existe pas ici.")
    return service


@router.get("/appointments")
def agenda(
    user: CurrentUser,
    db: DbSession,
    horizon: str = Query(default="futur"),
    service_id: int | None = Query(default=None),
) -> dict:
    org = user.organization
    maintenant = utcnow()
    clauses = [Appointment.organization_id == org.id]
    if service_id:
        clauses.append(Appointment.service_id == service_id)
    if horizon == "futur":
        clauses.append(Appointment.starts_at >= maintenant)
    elif horizon == "passe":
        clauses.append(Appointment.starts_at < maintenant)
    elif horizon == "jour":
        debut = datetime.combine(maintenant.date(), time.min)
        clauses.append(Appointment.starts_at >= debut)
        clauses.append(Appointment.starts_at < debut + timedelta(days=1))
    ordre = Appointment.starts_at.asc()
    if horizon == "passe":
        ordre = Appointment.starts_at.desc()
    lignes = db.scalars(
        select(Appointment).where(*clauses).order_by(ordre).limit(80)
    ).all()
    return {
        "appointments": [appointment_dict(a) for a in lignes],
        "cancelled": sum(1 for a in lignes if a.status == "annule"),
    }


@router.get("/appointments/slots")
def creneaux(
    user: CurrentUser,
    db: DbSession,
    service_id: int = Query(ge=1),
    limit: int = Query(default=12, ge=1, le=40),
) -> dict:
    org = user.organization
    service = _service(db, org.id, service_id)
    places = scheduling.disponibilites(db, service, limit=limit)
    return {
        "service": service.name,
        "slots": [p.isoformat() for p in places],
        "calendar": scheduling.semaines(db, service),
        "lead_days": service.lead_days,
        "horizon_days": service.horizon_days,
        "duration_min": service.duration_min,
    }


@router.post("/appointments")
def poser(payload: AppointmentIn, user: CurrentUser, db: DbSession) -> dict:
    """Le rendez-vous pris au comptoir ou dans la console, pas par la voix."""
    org = user.organization
    service = _service(db, org.id, payload.service_id)
    start = payload.starts_at
    if start.tzinfo:
        start = start.replace(tzinfo=None)
    try:
        appointment = scheduling.reserver(
            db,
            org.id,
            service,
            payload.caller_name,
            normalize_phone(payload.caller_phone) or payload.caller_phone,
            start,
            origin=payload.origin,
            note=payload.note,
        )
    except ValueError as erreur:
        raise HTTPException(status_code=422, detail=str(erreur)) from erreur
    appointment.language = switching.code_langue(org)
    annuaire.enregistre(
        db, org, appointment.caller_phone, appointment.caller_name, moment=start
    )
    envois.confirmer_rdv(db, org, appointment, code=appointment.language)
    db.commit()
    return appointment_dict(appointment)


@router.patch("/appointments/{appointment_id}")
def modifier(
    appointment_id: int, payload: AppointmentPatch, user: CurrentUser, db: DbSession
) -> dict:
    org = user.organization
    appointment = db.get(Appointment, appointment_id)
    if not appointment or appointment.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Ce rendez-vous n'existe pas ici.")
    if payload.status:
        appointment.status = payload.status
        if payload.status == "annule":
            appointment.reminded_at = None
    if payload.note is not None:
        appointment.note = payload.note
    db.commit()
    return appointment_dict(appointment)


@router.post("/appointments/{appointment_id}/rappel")
def rappel(appointment_id: int, user: CurrentUser, db: DbSession) -> dict:
    """Le rappel de la veille, déclenché à la main depuis la console."""
    org = user.organization
    appointment = db.get(Appointment, appointment_id)
    if not appointment or appointment.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Ce rendez-vous n'existe pas ici.")
    if appointment.status != "confirme":
        raise HTTPException(
            status_code=422, detail="On ne rappelle pas un rendez-vous annulé ou passé."
        )
    envoi = envois.rappeler_rdv(db, org, appointment)
    appointment.reminded_at = utcnow()
    db.commit()
    return {
        "appointment": appointment_dict(appointment),
        "dispatch": dispatch_dict(envoi),
    }
