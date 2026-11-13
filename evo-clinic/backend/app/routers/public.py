from fastapi import APIRouter

from ..database import SessionLocal
from ..services import clinic, present

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/recu/{code}")
def recu(code: str) -> dict:
    """Le reçu vérifiable : un code, un paiement, rien d'autre.

    Aucun compte n'est demandé : le patient qui doute tape le code du reçu
    et lit le montant, le nom, le jour — jamais le reste de la clinique.
    """
    with SessionLocal() as db:
        paiement = clinic.recu_par_code(db, code)
        if paiement is None:
            return {"valide": False, "code": code.strip().upper()}
        return present.recu_dict(paiement)
