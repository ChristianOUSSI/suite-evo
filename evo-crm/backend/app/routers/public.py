from fastapi import APIRouter
from sqlalchemy import select

from ..config import settings
from ..database import SessionLocal
from ..models import Entreprise
from ..schemas import ContactEntree
from ..services import carnet

router = APIRouter(prefix="/public", tags=["public"])


def _entreprise(db) -> Entreprise | None:
    return db.scalar(select(Entreprise).limit(1))


@router.get("/entreprise")
def entreprise() -> dict:
    """La page publique : la maison et son numéro, rien d'autre."""
    with SessionLocal() as db:
        maison = _entreprise(db)
        if maison is None:
            return {"entreprise": None, "lien": ""}
        return {
            "entreprise": carnet.entreprise_dict_publique(maison),
            "lien": f"{settings.public_base_url}/contact",
        }


@router.post("/contact", status_code=201)
def contact(entree: ContactEntree) -> dict:
    """Le prospect écrit sans compte : fiche créée ou reprise, contact
    journalisé, relance programmée pour que l'équipe rappelle."""
    with SessionLocal() as db:
        maison = _entreprise(db)
        if maison is None:
            from fastapi import HTTPException

            raise HTTPException(
                status_code=503,
                detail={
                    "code": "entreprise_absente",
                    "fr": "Cette entreprise n'est pas ouverte.",
                    "en": "This company is not open.",
                },
            )
        return carnet.contact_publique(db, maison, entree)
