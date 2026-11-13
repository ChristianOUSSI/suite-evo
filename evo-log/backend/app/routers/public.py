from fastapi import APIRouter
from sqlalchemy import select

from ..database import SessionLocal
from ..messages import refus
from ..models import Colis, Organisation
from ..services import present

router = APIRouter(prefix="/public", tags=["public"])


def _premiere_agence(db) -> Organisation | None:
    return db.scalar(select(Organisation).limit(1))


@router.get("/suivi/{numero}")
def suivi(numero: str) -> dict:
    """Le suivi public : le destinataire tape son numéro, rien d'autre.

    Aucun compte n'est demandé. La réponse ne porte ni expéditeur ni
    téléphone : le colis, son trajet, son statut, ses dates.
    """
    code = numero.strip().upper()
    with SessionLocal() as db:
        organisation = _premiere_agence(db)
        if organisation is None:
            raise refus("colis_inconnu", 404)
        colis = db.scalar(
            select(Colis).where(
                Colis.organisation_id == organisation.id,
                Colis.numero == code,
            )
        )
        if colis is None:
            raise refus("colis_inconnu", 404)
        return {"colis": present.suivi_dict(colis)}
