from fastapi import APIRouter
from sqlalchemy import func, select

from ..database import SessionLocal
from ..models import Appel, Organisation
from ..services import present

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/file")
def file_attente() -> dict:
    """La file publique : combien de personnes attendent, rien d'autre.

    L'appelant qui compose le numéro du centre lit la file sans compte —
    jamais les noms, jamais les numéros.
    """
    with SessionLocal() as db:
        organisation = db.scalar(select(Organisation).limit(1))
        if organisation is None:
            return {"centre": None, "en_file": 0, "en_cours": 0}
        en_file = db.scalar(
            select(func.count(Appel.id)).where(
                Appel.organisation_id == organisation.id,
                Appel.statut == "en_file",
            )
        ) or 0
        en_cours = db.scalar(
            select(func.count(Appel.id)).where(
                Appel.organisation_id == organisation.id,
                Appel.statut == "en_cours",
            )
        ) or 0
        return {
            "centre": present.organisation_dict(organisation),
            "en_file": en_file,
            "en_cours": en_cours,
        }
