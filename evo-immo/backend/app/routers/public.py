from fastapi import APIRouter

from ..database import SessionLocal
from ..services import immo, present

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/annonces")
def annonces() -> dict:
    """La page publique : les biens disponibles de chaque agence.

    Aucun compte n'est demandé : le client qui a reçu le lien lit les
    annonces — jamais les propriétaires, jamais les demandes.
    """
    with SessionLocal() as db:
        from sqlalchemy import select

        from ..models import Organisation

        # Démo : une seule agence. En multi-agence, l'URL portera l'id.
        organisation = db.scalar(select(Organisation).limit(1))
        if organisation is None:
            return {"annonces": []}
        return {
            "agence": present.organisation_dict(organisation),
            "annonces": immo.annonces_publiques(db, organisation),
        }
