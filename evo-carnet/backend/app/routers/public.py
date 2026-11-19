from fastapi import APIRouter
from sqlalchemy import select
from fastapi import HTTPException

from ..config import settings
from ..database import SessionLocal
from ..models import Note, Organisation
from ..services import carnet as domaine
from ..services import present

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/carnet")
def carnet() -> dict:
    """La page publique : le carnet et son numéro, rien d'autre."""
    with SessionLocal() as db:
        organisation = db.scalar(select(Organisation).limit(1))
        if organisation is None:
            return {"carnet": None}
        return {"carnet": present.organisation_dict(organisation)}


@router.get("/notes/{code}")
def note_partagee(code: str) -> dict:
    """La note partagée : titre et contenu en lecture seule, sans compte."""
    with SessionLocal() as db:
        note = domaine.note_partagee(db, code)
        if note is None:
            raise HTTPException(
                status_code=404,
                detail={
                    "code": "partage_inconnu",
                    "fr": "Ce lien ne mène à aucune note.",
                    "en": "That link leads to no note.",
                },
            )
        return {
            "note": present.note_dict(note, public=True),
            "carnet": present.organisation_dict(note.organisation),
            "lien": f"{settings.public_base_url}/partage/{code}",
        }
