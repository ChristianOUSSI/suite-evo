from fastapi import APIRouter

from ..database import SessionLocal
from sqlalchemy import select

from ..messages import refus
from ..models import Organisation
from ..schemas import RendezVousEntree
from ..services import clinic, present

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/recu/{code}")
def recu(code: str) -> dict:
    """Le reçu vérifiable : un code, un paiement, rien d'autre.

    Aucun compte n'est demandé : le patient qui doute tape le code du reçu
    et lit le montant, le nom, le jour - jamais le reste de la clinique.
    """
    with SessionLocal() as db:
        paiement = clinic.recu_par_code(db, code)
        if paiement is None:
            return {"valide": False, "code": code.strip().upper()}
        return present.recu_dict(paiement)



@router.post("/rendez-vous", status_code=201)
def rendez_vous(entree: RendezVousEntree) -> dict:
    """La demande du patient : elle arrive « demande », la clinique tranche."""
    with SessionLocal() as db:
        org = db.scalar(select(Organisation).order_by(Organisation.id).limit(1))
        if org is None:
            raise refus("organisation_inconnue", 404)
        rdv = clinic.ajouter_rdv(db, org, entree)
        return {
            "ok": True,
            "id": rdv.id,
            "statut": rdv.statut,
            "message": "La demande est bien arrivée. La clinique vous rappellera au numéro donné.",
        }
