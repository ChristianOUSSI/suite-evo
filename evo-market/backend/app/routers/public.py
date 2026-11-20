from fastapi import APIRouter

from ..config import settings
from sqlalchemy import select

from ..database import SessionLocal
from ..messages import refus
from ..models import Annonce, Organisation
from ..schemas import DemandeEntree
from ..services import market, present

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/annonces")
def annonces() -> dict:
    """La page publique : les annonces en ligne de la boutique.

    Aucun compte n'est demandé : le client qui a reçu le lien lit les
    articles - jamais les vendeurs, jamais les commandes.
    """
    with SessionLocal() as db:
        organisation = db.scalar(select(Organisation).limit(1))
        if organisation is None:
            return {"boutique": None, "annonces": []}
        return {
            "boutique": present.organisation_dict(organisation),
            "annonces": market.annonces_publiques(db, organisation),
            "lien": f"{settings.public_base_url}/annonces",
        }



@router.post("/commandes", status_code=201)
def commandes(entree: DemandeEntree) -> dict:
    """La commande de l'acheteur : elle arrive « demande », la boutique tranche."""
    with SessionLocal() as db:
        organisation = db.scalar(select(Organisation).limit(1))
        if organisation is None:
            raise refus("organisation_inconnue", 404)
        demande = market.ajouter_demande(db, organisation, entree)
        return {
            "ok": True,
            "id": demande.id,
            "statut": demande.statut,
            "message": "Votre commande est bien arrivée. La boutique vous rappellera au numéro donné.",
        }
