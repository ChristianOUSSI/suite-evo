"""La surface publique : le parent ou l'étudiant pose un rendez-vous
sans compte, depuis son téléphone, comme au guichet."""

from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select

from ..deps import DbSession
from ..models import Organization, Service
from ..services import scheduling
from ..utils import normalize_phone

router = APIRouter(prefix="/public", tags=["public"])


class RendezVousPublic(BaseModel):
    service_id: int
    caller_name: str = Field(min_length=2, max_length=140)
    caller_phone: str = Field(max_length=24)
    starts_at: datetime
    note: str = Field(default="", max_length=240)


def _organisation(db) -> Organization:
    """La démo tient une seule organisation ; en multi-tenant ce sera un code."""
    org = db.scalars(select(Organization).order_by(Organization.id)).first()
    if not org:
        raise HTTPException(status_code=503, detail="Le standard n'est pas ouvert.")
    return org


def _service(db, org_id: int, service_id: int) -> Service:
    service = db.get(Service, service_id)
    if not service or service.organization_id != org_id:
        raise HTTPException(status_code=404, detail="Ce guichet n'existe pas.")
    return service


@router.get("/services")
def guichets(db: DbSession) -> dict:
    org = _organisation(db)
    lignes = db.scalars(
        select(Service).where(Service.organization_id == org.id).order_by(Service.id)
    ).all()
    return {
        "organisation": {"nom": org.name, "ville": org.city},
        "guichets": [
            {
                "id": s.id,
                "nom": s.name,
                "salle": s.room,
                "duree_min": s.duration_min,
                "note": s.note,
                "creneaux": [c.isoformat() for c in scheduling.disponibilites(db, s, limit=6)],
            }
            for s in lignes
        ],
    }


@router.post("/appointments", status_code=201)
def reserver_en_ligne(payload: RendezVousPublic, db: DbSession) -> dict:
    org = _organisation(db)
    service = _service(db, org.id, payload.service_id)
    start = payload.starts_at
    if start.tzinfo:
        start = start.replace(tzinfo=None)
    try:
        rendez_vous = scheduling.reserver(
            db,
            org.id,
            service,
            payload.caller_name,
            normalize_phone(payload.caller_phone) or payload.caller_phone,
            start,
            origin="public",
            note=payload.note,
        )
    except ValueError as erreur:
        raise HTTPException(status_code=422, detail=str(erreur)) from erreur
    db.commit()
    return {
        "reference": rendez_vous.reference,
        "guichet": service.name,
        "debut": rendez_vous.starts_at.isoformat(),
        "duree_min": rendez_vous.duration_min,
        "statut": rendez_vous.status,
    }
