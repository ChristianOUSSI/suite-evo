from datetime import date

from fastapi import APIRouter, Query

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..messages import refus
from ..schemas import DemandeCorrection, DemandeEntree, VisiteCorrection, VisiteEntree
from ..services import immo, present
from ..utils import aujourdhui, periode_de

router = APIRouter(tags=["registre"])


@router.get("/etat")
def etat(organisation: OrganisationCourante, db: DbSession) -> dict:
    """La vitre de l'agence."""
    return immo.etat(db, organisation)


@router.get("/demandes")
def demandes(
    organisation: OrganisationCourante,
    db: DbSession,
    bien_id: int | None = Query(default=None),
    statut: str | None = Query(default=None),
    periode: str | None = Query(default=None),
    limite: int = Query(default=500, ge=1, le=2000),
) -> dict:
    return {
        "demandes": immo.liste_demandes(
            db, organisation, bien_id=bien_id, statut=statut, periode=periode, limite=limite
        )
    }


@router.post("/demandes")
def enregistrer(
    entree: DemandeEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    """Une demande : le client, son canal, le bien s'il est nommé."""
    return present.demande_dict(immo.enregistrer_demande(db, organisation, entree, compte))


@router.patch("/demandes/{demande_id}")
def corriger_demande(
    demande_id: int,
    entree: DemandeCorrection,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    patch = entree.model_dump(exclude_unset=True)
    if not patch:
        raise refus("saisie")
    return present.demande_dict(
        immo.corriger_demande(db, organisation, demande_id, patch)
    )


@router.get("/visites")
def visites(
    organisation: OrganisationCourante,
    db: DbSession,
    bien_id: int | None = Query(default=None),
    periode: str | None = Query(default=None),
    jour: str | None = Query(default=None),
    limite: int = Query(default=500, ge=1, le=2000),
) -> dict:
    jour_date = None
    if jour:
        try:
            jour_date = date.fromisoformat(jour)
        except ValueError:
            raise refus("saisie", date="le jour")
    return {
        "visites": immo.liste_visites(
            db, organisation, bien_id=bien_id, periode=periode, jour=jour_date, limite=limite
        )
    }


@router.post("/visites")
def planifier(
    entree: VisiteEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    """Une visite : le bien, le jour, l'heure, le client."""
    return present.visite_dict(immo.planifier_visite(db, organisation, entree, compte))


@router.patch("/visites/{visite_id}")
def corriger_visite(
    visite_id: int,
    entree: VisiteCorrection,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    patch = entree.model_dump(exclude_unset=True)
    if not patch:
        raise refus("saisie")
    return present.visite_dict(
        immo.corriger_visite(db, organisation, visite_id, patch)
    )


@router.get("/recap")
def recap_mois(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> dict:
    """Le mois de l'agence : visites, demandes, ce qui s'est vendu."""
    return immo.recap(db, organisation, periode or periode_de(aujourdhui()))
