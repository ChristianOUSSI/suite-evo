from fastapi import APIRouter, Query

from ..deps import DbSession, OrganisationCourante
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
