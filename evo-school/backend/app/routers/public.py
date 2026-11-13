from fastapi import APIRouter

from ..database import SessionLocal
from ..services import ecole, present

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/recu/{code}")
def recu(code: str) -> dict:
    """Le reçu vérifiable : un code, un versement, rien d'autre.

    Aucun compte n'est demandé : le parent qui doute tape le code du reçu
    et lit le montant, l'élève, le jour — jamais le reste de l'école.
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
