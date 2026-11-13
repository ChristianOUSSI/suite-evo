from fastapi import APIRouter, Query

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..messages import refus
from ..schemas import ColisCorrection, ColisEntree
from ..services import log, present
from ..utils import aujourdhui, periode_de

router = APIRouter(tags=["registre"])


@router.get("/etat")
def etat(organisation: OrganisationCourante, db: DbSession) -> dict:
    """La vitre du transporteur."""
    return log.etat(db, organisation)


@router.get("/colis/{colis_id}/suivi")
def suivi(
    colis_id: int,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    """Le suivi interne : la fiche complète du colis."""
    return present.colis_dict(log.colis_de(db, organisation, colis_id))


@router.get("/recap")
def recap_mois(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> dict:
    """Le mois du transporteur : dépôts, distributions, encaissé, par trajet."""
    return log.recap(db, organisation, periode or periode_de(aujourdhui()))
