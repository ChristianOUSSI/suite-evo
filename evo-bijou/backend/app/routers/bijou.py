from fastapi import APIRouter, Query

from ..deps import DbSession, OrganisationCourante
from ..schemas import DemandeCorrection
from ..services import bijou
from ..utils import aujourdhui, periode_de

router = APIRouter(tags=["vitrine"])


@router.get("/etat")
def etat(organisation: OrganisationCourante, db: DbSession) -> dict:
    """La vitre de la vitrine."""
    return bijou.etat(db, organisation)


@router.get("/recap")
def recap_mois(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> dict:
    """Le mois de la vitrine : ventes, marge, par matière et par statut."""
    return bijou.recap(db, organisation, periode or periode_de(aujourdhui()))


@router.get("/demandes")
def demandes(
    organisation: OrganisationCourante,
    db: DbSession,
    statut: str | None = Query(default=None),
) -> dict:
    lignes = bijou.liste_demandes(db, organisation, statut=statut)
    return {
        "total": len(lignes),
        "en_attente": sum(1 for un in lignes if un.statut == "demande"),
        "demandes": [bijou.demande_dict(un) for un in lignes],
    }


@router.patch("/demandes/{demande_id}")
def corriger_demande(
    demande_id: int,
    entree: DemandeCorrection,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    demande = bijou.corriger_demande(db, organisation, demande_id, entree.statut or "")
    return bijou.demande_dict(demande)
