from fastapi import APIRouter
from sqlalchemy import select

from ..config import settings
from ..database import SessionLocal
from ..messages import refus
from ..models import Colis, Organisation
from ..schemas import DemandeEnvoiEntree
from ..services import log, present

router = APIRouter(prefix="/public", tags=["public"])


def _premiere_agence(db) -> Organisation | None:
    return db.scalar(select(Organisation).limit(1))


@router.get("/suivi/{numero}")
def suivi(numero: str) -> dict:
    """Le suivi public : le destinataire tape son numéro, rien d'autre.

    Aucun compte n'est demandé. La réponse ne porte ni expéditeur ni
    téléphone : le colis, son trajet, son statut, ses dates.
    """
    code = numero.strip().upper()
    with SessionLocal() as db:
        organisation = _premiere_agence(db)
        if organisation is None:
            raise refus("colis_inconnu", 404)
        colis = db.scalar(
            select(Colis).where(
                Colis.organisation_id == organisation.id,
                Colis.numero == code,
            )
        )
        if colis is None:
            raise refus("colis_inconnu", 404)
        return {"colis": present.suivi_dict(colis), "lien": f"{settings.public_base_url}/suivi/{colis.numero}"}



@router.post("/envois", status_code=201)
def envois(entree: DemandeEnvoiEntree) -> dict:
    """La demande d'envoi : elle arrive « demande », l'agence tranche."""
    with SessionLocal() as db:
        organisation = _premiere_agence(db)
        if organisation is None:
            raise refus("organisation_inconnue", 404)
        demande = log.ajouter_demande(db, organisation, entree)
        return {
            "ok": True,
            "id": demande.id,
            "statut": demande.statut,
            "message": "Votre demande est bien arrivée. L'agence vous rappellera au numéro donné.",
        }
