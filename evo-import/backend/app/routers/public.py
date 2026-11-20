from fastapi import APIRouter

from ..config import settings

from ..database import SessionLocal
from ..messages import refus
from sqlalchemy import select

from ..models import Organisation
from ..schemas import DemandeEntree
from ..services import fret, present

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/suivi/{numero}")
def suivi(numero: str) -> dict:
    """Le suivi public : le numéro de dix signes, rien d'autre.

    Le destinataire lit le parcours de son envoi sans compte - ni le
    client interne, ni les frais de marge.
    """
    with SessionLocal() as db:
        envoi = fret.par_numero(db, numero)
        if envoi is None:
            raise refus("suivi_inconnu", 404)
        corps = present.envoi_dict(envoi, public=True)
        corps["transitaire"] = present.organisation_dict(envoi.organisation)
        corps["lien"] = f"{settings.public_base_url}/suivi/{envoi.numero_suivi}"
        return corps



@router.post("/devis", status_code=201)
def devis(entree: DemandeEntree) -> dict:
    """La demande de devis : elle arrive « demande », le transitaire répond."""
    with SessionLocal() as db:
        organisation = db.scalar(select(Organisation).order_by(Organisation.id).limit(1))
        if organisation is None:
            raise refus("organisation_inconnue", 404)
        demande = fret.ajouter_demande(db, organisation, entree)
        return {
            "ok": True,
            "id": demande.id,
            "statut": demande.statut,
            "message": "Votre demande est bien arrivée. Le transitaire vous rappellera au numéro donné.",
        }
