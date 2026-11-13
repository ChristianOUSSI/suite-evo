from fastapi import APIRouter, Query

from ..deps import DbSession, OrganisationCourante
from ..services import docs
from ..utils import aujourdhui, periode_de

router = APIRouter(tags=["registre"])


@router.get("/etat")
def etat(organisation: OrganisationCourante, db: DbSession) -> dict:
    """La vitre du classeur."""
    return docs.etat(db, organisation)


@router.get("/recap")
def recap_mois(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> dict:
    """Le mois du classeur : documents, échéances, par catégorie."""
    return docs.recap(db, organisation, periode or periode_de(aujourdhui()))
