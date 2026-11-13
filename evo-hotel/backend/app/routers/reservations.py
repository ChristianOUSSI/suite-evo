from datetime import date

from fastapi import APIRouter, Query

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..schemas import SejourCorrection, SejourEntree
from ..services import hotel, present
from ..utils import aujourdhui, periode_de

router = APIRouter(tags=["sejours"])


@router.get("/etat")
def etat(organisation: OrganisationCourante, db: DbSession) -> dict:
    """La vitre de la réception : ce qui dort, ce qui arrive, ce qui part."""
    return hotel.etat(db, organisation)


@router.get("/disponibilite")
def disponibilite(
    organisation: OrganisationCourante,
    db: DbSession,
    arrivee: date,
    depart: date,
) -> dict:
    """Les chambres libres sur une période : ce que la réception propose."""
    return {
        "arrivee": arrivee.isoformat(),
        "depart": depart.isoformat(),
        "chambres": hotel.disponibilite(db, organisation, arrivee, depart),
    }


@router.get("/sejours")
def sejours(
    organisation: OrganisationCourante,
    db: DbSession,
    du: date | None = Query(default=None),
    au: date | None = Query(default=None),
    statut: str | None = Query(default=None),
) -> dict:
    """Les séjours de l'hôtel, du plus proche au plus lointain."""
    return {
        "sejours": hotel.liste_sejours(db, organisation, du=du, au=au, statut=statut)
    }


@router.post("/sejours")
def reserver(
    entree: SejourEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    return present.sejour_dict(hotel.reserver(db, organisation, entree, compte))


@router.patch("/sejours/{sejour_id}")
def corriger(
    sejour_id: int,
    entree: SejourCorrection,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    return present.sejour_dict(
        hotel.corriger_sejour(db, organisation, sejour_id, entree, compte)
    )


@router.get("/recap")
def recap_mois(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> dict:
    """Le mois de l'hôtel : nuits vendues, recette estimée, taux d'occupation."""
    return hotel.recap(db, organisation, periode or periode_de(aujourdhui()))
