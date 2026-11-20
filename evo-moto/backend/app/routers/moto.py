from fastapi import APIRouter, Query

from ..deps import DbSession, OrganisationCourante
from ..schemas import DemandeCorrection
from ..services import moto
from ..utils import aujourdhui, periode_de

router = APIRouter(tags=["atelier"])


@router.get("/etat")
def etat(organisation: OrganisationCourante, db: DbSession) -> dict:
    """La vitre de l'atelier."""
    return moto.etat(db, organisation)


@router.get("/recap")
def recap_mois(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> dict:
    """Le mois de l'atelier : ventes et réparations."""
    return moto.recap(db, organisation, periode or periode_de(aujourdhui()))


@router.get("/demandes")
def demandes(
    organisation: OrganisationCourante,
    db: DbSession,
    statut: str | None = Query(default=None),
) -> dict:
    lignes = moto.liste_demandes(db, organisation, statut=statut)
    return {
        "total": len(lignes),
        "en_attente": sum(1 for un in lignes if un.statut == "demande"),
        "demandes": [moto.demande_dict(un) for un in lignes],
    }


@router.patch("/demandes/{demande_id}")
def corriger_demande(
    demande_id: int,
    entree: DemandeCorrection,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    demande = moto.corriger_demande(db, organisation, demande_id, entree.statut or "")
    return moto.demande_dict(demande)
