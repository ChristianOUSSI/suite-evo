from fastapi import APIRouter
from sqlalchemy import select

from ..database import SessionLocal
from ..models import Organisation
from ..schemas import CommandePublique
from ..services import gaz as domaine
from ..services import present

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/depot")
def depot() -> dict:
    """La page publique : le dépôt et son numéro, rien d'autre."""
    with SessionLocal() as db:
        organisation = db.scalar(select(Organisation).limit(1))
        if organisation is None:
            return {"depot": None}
        return {"depot": present.organisation_dict(organisation)}


@router.post("/commandes", status_code=201)
def commander(entree: CommandePublique) -> dict:
    """La commande publique : le client naît de son numéro.

    Le visiteur tape son nom, son numéro, son quartier et la quantité
    de bonbonnes. Le dépôt voit la commande sans compte - le client
    est retrouvé par son numéro ou créé.
    """
    with SessionLocal() as db:
        organisation = db.scalar(select(Organisation).limit(1))
        if organisation is None:
            from fastapi import HTTPException

            raise HTTPException(status_code=503, detail={"code": "depot_absent", "fr": "Le dépôt n'est pas ouvert.", "en": "The depot is not open."})
        livraison = domaine.commande_publique(db, organisation, entree)
        return {
            "ok": True,
            "numero": livraison.id,
            "depot": present.organisation_dict(organisation),
        }
