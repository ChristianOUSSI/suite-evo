from fastapi import APIRouter, Query

from ..deps import DbSession, OrganisationCourante
from ..services import calls
from ..utils import aujourdhui, periode_de

router = APIRouter(tags=["registre"])


@router.get("/etat")
def etat(organisation: OrganisationCourante, db: DbSession) -> dict:
    """La vitre du standard."""
    return calls.etat(db, organisation)


@router.get("/recap")
def recap_mois(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> dict:
    """Le mois du standard : appels, durées, par agent et par motif."""
    return calls.recap(db, organisation, periode or periode_de(aujourdhui()))
