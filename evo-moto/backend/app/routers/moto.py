from fastapi import APIRouter, Query

from ..deps import DbSession, OrganisationCourante
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
