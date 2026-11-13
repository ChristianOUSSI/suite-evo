from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from ..database import SessionLocal
from ..models import Document, Organisation
from ..services import docs, present

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/verifier/{reference}")
def verifier(reference: str) -> dict:
    """La vérification publique : le titre et le statut, rien de plus.

    Le contrôleur ou le client qui a la référence à dix signes vérifie
    que le document existe — sans compte, sans voir le contenu.
    """
    with SessionLocal() as db:
        document = docs.document_par_reference(db, reference)
        if document is None:
            raise HTTPException(
                status_code=404,
                detail={
                    "code": "reference_inconnue",
                    "fr": "Cette référence ne correspond à aucun document.",
                    "en": "That reference matches no document.",
                },
            )
        return {"document": present.document_public_dict(document)}


@router.get("/maison")
def maison() -> dict:
    """La carte de visite publique : nom, ville, quartier, téléphone."""
    with SessionLocal() as db:
        organisation = db.scalar(select(Organisation).limit(1))
        if organisation is None:
            return {"maison": None}
        return {"maison": present.organisation_dict(organisation)}
