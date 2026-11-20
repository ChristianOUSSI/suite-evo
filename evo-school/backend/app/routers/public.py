from fastapi import APIRouter
from sqlalchemy import select

from ..messages import refus

from ..database import SessionLocal
from ..schemas import DemandeEntree
from ..services import ecole

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/recu/{code}")
def recu(code: str) -> dict:
    """Le reçu vérifiable : un code, un versement, rien d'autre.

    Aucun compte n'est demandé : le parent qui doute tape le code du reçu
    et lit le montant, l'élève, le jour - jamais le reste de l'école.
    """
    with SessionLocal() as db:
        versement = ecole.recu_par_code(db, code)
        if versement is None:
            return {"valide": False, "code": code.strip().upper()}
        return {
            "valide": True,
            "recu": versement.recu,
            "ecole": versement.organisation.nom,
            "ville": versement.organisation.ville,
            "quartier": versement.organisation.quartier,
            "eleve": versement.eleve.nom,
            "classe": versement.eleve.classe.nom,
            "parent": versement.eleve.parent_nom,
            "montant": versement.montant,
            "moyen": versement.moyen,
            "date": versement.date.isoformat(),
            "periode": versement.periode,
            "note": versement.note,
        }



@router.get("/classes")
def classes_inscription() -> dict:
    """Les classes ouvertes à l'inscription, pour le formulaire."""
    from ..models import Organisation

    with SessionLocal() as db:
        org = db.scalar(select(Organisation).order_by(Organisation.id).limit(1))
        if org is None:
            return {"classes": []}
        return {"classes": ecole.classes_publiques(db, org)}


@router.post("/inscriptions", status_code=201)
def inscription(entree: DemandeEntree) -> dict:
    """La demande du parent : elle arrive « demandée », l'école tranche."""
    from ..models import Organisation

    with SessionLocal() as db:
        org = db.scalar(select(Organisation).order_by(Organisation.id).limit(1))
        if org is None:
            raise refus("organisation_inconnue", 404)
        demande = ecole.ajouter_demande(db, org, entree)
        return {
            "ok": True,
            "id": demande.id,
            "statut": demande.statut,
            "message": "La demande est bien arrivée. L'école vous rappellera au numéro donné.",
        }
