from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select

from ..deps import CurrentUser, DbSession
from ..models import Dispatch
from ..schemas import DispatchIn
from ..services import dispatch as envois
from ..services.present import dispatch_dict
from ..utils import normalize_phone, utcnow

router = APIRouter(tags=["envois"])

MAX_LIGNES = 80


@router.get("/dispatches")
def main(
    user: CurrentUser,
    db: DbSession,
    statut: str | None = Query(default=None, max_length=12),
    canal: str | None = Query(default=None, max_length=16),
) -> dict:
    """Tout ce que la console a poussé vers un téléphone, avec sa référence DEM."""
    org = user.organization
    clauses = []
    if statut in ("programme", "envoye", "echoue"):
        clauses.append(Dispatch.status == statut)
    if canal in envois.CHANNEL_LABELS:
        clauses.append(Dispatch.channel == canal)
    lignes = db.scalars(
        select(Dispatch)
        .where(Dispatch.organization_id == org.id, *clauses)
        .order_by(Dispatch.planned_at.desc())
        .limit(MAX_LIGNES)
    ).all()
    traces = [dispatch_dict(e) for e in lignes]
    return {
        "dispatches": traces,
        "sent": sum(1 for e in traces if e["status"] == "envoye"),
        "queued": sum(1 for e in traces if e["status"] == "programme"),
        "failed": sum(1 for e in traces if e["status"] == "echoue"),
        "demo": True,
    }


@router.post("/dispatches")
def envoyer(payload: DispatchIn, user: CurrentUser, db: DbSession) -> dict:
    """Un envoi décidé à la main depuis la console. En démo, rien ne sort."""
    org = user.organization
    to = normalize_phone(payload.to_phone)
    if not to:
        raise HTTPException(status_code=422, detail="Numéro camerounais attendu.")
    if not envois.actif(org, payload.channel):
        raise HTTPException(
            status_code=422,
            detail=f"Le canal {envois.CHANNEL_LABELS[payload.channel]} est coupé "
            "dans les réglages.",
        )
    envoi = envois.envoyer(
        db,
        org,
        channel=payload.channel,
        to_phone=to,
        body=payload.body,
        subject=payload.subject,
    )
    db.commit()
    return dispatch_dict(envoi)


@router.post("/dispatches/relances")
def relancer(user: CurrentUser, db: DbSession) -> dict:
    """La tournée des rappels de la veille, passée quand on veut."""
    org = user.organization
    now = utcnow()
    poses = envois.relances_a_faire(db, org)
    partis = envois.balayage(db)
    db.commit()
    return {
        "reminders": poses,
        "released": partis,
        "at": now.isoformat(),
        "auto": org.auto_reminders,
    }
