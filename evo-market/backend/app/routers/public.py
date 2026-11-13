from fastapi import APIRouter
from sqlalchemy import select

from ..database import SessionLocal
from ..models import Annonce, Organisation
from ..services import market, present

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/annonces")
def annonces() -> dict:
    """La page publique : les annonces en ligne de la boutique.

    Aucun compte n'est demandé : le client qui a reçu le lien lit les
    articles — jamais les vendeurs, jamais les commandes.
    """
    with SessionLocal() as db:
        organisation = db.scalar(select(Organisation).limit(1))
        if organisation is None:
            return {"boutique": None, "annonces": []}
        return {
            "boutique": present.organisation_dict(organisation),
            "annonces": market.annonces_publiques(db, organisation),
        }
