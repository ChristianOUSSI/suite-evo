from fastapi import APIRouter, Query

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..messages import refus
from ..schemas import CommandeCorrection, CommandeEntree
from ..services import market, present
from ..utils import aujourdhui, periode_de

router = APIRouter(tags=["registre"])


@router.get("/etat")
def etat(organisation: OrganisationCourante, db: DbSession) -> dict:
    """La vitre de la boutique."""
    return market.etat(db, organisation)


@router.get("/commandes")
def commandes(
    organisation: OrganisationCourante,
    db: DbSession,
    annonce_id: int | None = Query(default=None),
    statut: str | None = Query(default=None),
    periode: str | None = Query(default=None),
    limite: int = Query(default=500, ge=1, le=2000),
) -> dict:
    return {
        "commandes": market.liste_commandes(
            db,
            organisation,
            annonce_id=annonce_id,
            statut=statut,
            periode=periode,
            limite=limite,
        )
    }


@router.post("/commandes")
def commander(
    entree: CommandeEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    """Une commande : l'annonce, la quantité, l'acheteur, le moyen."""
    return present.commande_dict(
        market.enregistrer_commande(db, organisation, entree, compte)
    )


@router.patch("/commandes/{commande_id}")
def corriger(
    commande_id: int,
    entree: CommandeCorrection,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    patch = entree.model_dump(exclude_unset=True)
    if not patch:
        raise refus("saisie")
    return present.commande_dict(
        market.corriger_commande(db, organisation, commande_id, patch)
    )


@router.get("/recap")
def recap_mois(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> dict:
    """Le mois de la boutique : ventes, commandes, par catégorie."""
    return market.recap(db, organisation, periode or periode_de(aujourdhui()))
