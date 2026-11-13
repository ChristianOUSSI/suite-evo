from fastapi import APIRouter

from ..database import SessionLocal
from ..messages import refus
from ..services import fret, present

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/suivi/{numero}")
def suivi(numero: str) -> dict:
    """Le suivi public : le numéro de dix signes, rien d'autre.

    Le destinataire lit le parcours de son envoi sans compte — ni le
    client interne, ni les frais de marge.
    """
    with SessionLocal() as db:
        envoi = fret.par_numero(db, numero)
        if envoi is None:
            raise refus("suivi_inconnu", 404)
        corps = present.envoi_dict(envoi, public=True)
        corps["transitaire"] = present.organisation_dict(envoi.organisation)
        return corps
