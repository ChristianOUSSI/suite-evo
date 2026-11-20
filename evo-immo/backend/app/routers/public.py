from fastapi import APIRouter

from ..database import SessionLocal
from sqlalchemy import select

from ..messages import refus
from ..models import Organisation
from ..schemas import DemandePubliqueEntree
from ..services import immo, present

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/annonces")
def annonces() -> dict:
    """La page publique : les biens disponibles de chaque agence.

    Aucun compte n'est demandé : le client qui a reçu le lien lit les
    annonces - jamais les propriétaires, jamais les demandes.
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



@router.post("/demandes", status_code=201)
def demandes(entree: DemandePubliqueEntree) -> dict:
    """La demande du prospect : elle arrive « nouvelle », l'agent rappelle."""
    with SessionLocal() as db:
        organisation = db.scalar(select(Organisation).limit(1))
        if organisation is None:
            raise refus("organisation_inconnue", 404)
        demande = immo.ajouter_demande_publique(db, organisation, entree)
        return {
            "ok": True,
            "id": demande.id,
            "statut": demande.statut,
            "message": "Votre demande est bien arrivée. L'agence vous rappellera au numéro donné.",
        }
