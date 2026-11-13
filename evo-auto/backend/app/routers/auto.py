from fastapi import APIRouter, Query

from ..deps import DbSession, OrganisationCourante
from ..services import auto
from ..utils import aujourdhui, periode_de

router = APIRouter(tags=["parc"])


@router.get("/etat")
def etat(organisation: OrganisationCourante, db: DbSession) -> dict:
    """La vitre du parc."""
    return auto.etat(db, organisation)


@router.get("/recap")
def recap_mois(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> dict:
    """Le mois du parc : stock, ventes, par marque et par carburant."""
    return auto.recap(db, organisation, periode or periode_de(aujourdhui()))
