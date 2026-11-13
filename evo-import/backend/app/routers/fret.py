from fastapi import APIRouter, Query

from ..deps import DbSession, OrganisationCourante
from ..services import fret
from ..utils import aujourdhui, periode_de

router = APIRouter(tags=["quai"])


@router.get("/etat")
def etat(organisation: OrganisationCourante, db: DbSession) -> dict:
    """La vitre du quai."""
    return fret.etat(db, organisation)


@router.get("/recap")
def recap_mois(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> dict:
    """Le mois du quai : envois, frais, par mode et par ville."""
    return fret.recap(db, organisation, periode or periode_de(aujourdhui()))
