from fastapi import APIRouter

from datetime import date

from ..utils import aujourdhui

from ..deps import CompteCourant, DbSession, EntrepriseCourante
from ..schemas import RelanceDeplacement
from ..services import carnet, present

router = APIRouter(tags=["relances"])


@router.get("/relances")
def liste(entreprise: EntrepriseCourante, db: DbSession) -> dict:
    """Ce qui est dû aujourd'hui, ce qui est en retard, ce qui vient."""
    dues = carnet.relances_du_jour(db, entreprise)
    a_venir = carnet.relances_avenir(db, entreprise)
    return {
        "du_jour": [present.relance_dict(un) for un in dues],
        "en_retard": [
            present.relance_dict(un) for un in dues if un.due_le < aujourdhui()
        ],
        "a_venir": [present.relance_dict(un) for un in a_venir],
    }


@router.get("/silencie")
def silence(entreprise: EntrepriseCourante, db: DbSession) -> dict:
    """Les clients sans nouvelles, au sens où le gérant le dit lui-même."""
    lignes = carnet.silencie(db, entreprise)
    return {
        "seuil": entreprise.silence_jours,
        "total": len(lignes),
        "clients": [present.client_dict(un) for un in lignes],
    }


@router.post("/relances/{relance_id}/terminer")
def terminer(
    relance_id: int,
    entreprise: EntrepriseCourante,
    compte: CompteCourant,
    db: DbSession,
    note: str = "",
) -> dict:
    return present.relance_dict(carnet.terminer(db, entreprise, relance_id, compte, note))


@router.put("/relances/{relance_id}")
def replacer(
    relance_id: int,
    entree: RelanceDeplacement,
    entreprise: EntrepriseCourante,
    db: DbSession,
) -> dict:
    return present.relance_dict(carnet.replacer(db, entreprise, relance_id, entree))
