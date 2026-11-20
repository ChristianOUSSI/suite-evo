from datetime import date

from fastapi import APIRouter, Query

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..schemas import StockEntree, VenteCorrection, VenteEntree
from ..services import present, shop
from ..utils import aujourdhui, periode_de

router = APIRouter(tags=["caisse"])


@router.get("/etat")
def etat(organisation: OrganisationCourante, db: DbSession) -> dict:
    """La vitre de la caisse : ce qui manque, ce que la journée a fait."""
    return shop.etat(db, organisation)


@router.get("/ventes")
def ventes(
    organisation: OrganisationCourante,
    db: DbSession,
    limite: int = Query(default=200, ge=1, le=1000),
) -> dict:
    return {"ventes": shop.liste_ventes(db, organisation, limite)}


@router.post("/ventes")
def vendre(
    entree: VenteEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    """Un ticket : ses lignes, son total, son stock qui descend."""
    return present.vente_dict(shop.vendre(db, organisation, entree, compte))


@router.patch("/ventes/{vente_id}")
def corriger(
    vente_id: int,
    entree: VenteCorrection,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    """Les gestes permis : valider une commande, annuler un ticket.

    Valider descend le stock une fois ; annuler le remonte si le ticket
    était validé, et garde la trace dans les deux cas.
    """
    if entree.statut == "validee":
        return present.vente_dict(
            shop.confirmer_commande(db, organisation, vente_id, compte)
        )
    if entree.statut != "annulee":
        from ..messages import refus

        raise refus("saisie")
    return present.vente_dict(
        shop.annuler_vente(db, organisation, vente_id, entree.note or "", compte)
    )


@router.get("/recap")
def recap_mois(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> dict:
    """Le mois de la boutique : CA, quantités, marge estimée."""
    return shop.recap(db, organisation, periode or periode_de(aujourdhui()))
