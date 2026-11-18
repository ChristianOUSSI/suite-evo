from fastapi import APIRouter
from sqlalchemy import select

from ..database import SessionLocal
from ..models import Organisation
from ..services import present

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/agent")
def agent() -> dict:
    """La page publique : l'organisation et son numéro, rien d'autre."""
    with SessionLocal() as db:
        organisation = db.scalar(select(Organisation).limit(1))
        if organisation is None:
            return {"agent": None}
        return {"agent": present.organisation_dict(organisation)}
