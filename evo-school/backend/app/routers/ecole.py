from datetime import date

from fastapi import APIRouter, Query

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..messages import refus
from ..schemas import DemandeCorrection, VersementCorrection, VersementEntree
from ..services import ecole, present
from ..utils import aujourdhui, periode_de

router = APIRouter(tags=["caisse"])


@router.get("/etat")
def etat(organisation: OrganisationCourante, db: DbSession) -> dict:
    """La vitre de la caisse de l'école."""
    return ecole.etat(db, organisation)


@router.get("/eleves")
def eleves(
    organisation: OrganisationCourante,
    db: DbSession,
    classe_id: int | None = Query(default=None),
    restants: bool = Query(default=False),
) -> dict:
    lignes = ecole.liste_eleves(
        db, organisation, classe_id=classe_id, seulement_restants=restants
    )
    return {"eleves": lignes}


@router.get("/versements")
def versements(
    organisation: OrganisationCourante,
    db: DbSession,
    eleve_id: int | None = Query(default=None),
    periode: str | None = Query(default=None),
    limite: int = Query(default=500, ge=1, le=2000),
) -> dict:
    return {
        "versements": ecole.liste_versements(
            db, organisation, eleve_id=eleve_id, periode=periode, limite=limite
        )
    }


@router.post("/versements")
def encaisser(
    entree: VersementEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    """Un versement : son montant, son moyen, son reçu qui prouve."""
    return present.versement_dict(ecole.encaisser(db, organisation, entree, compte))


@router.patch("/versements/{versement_id}")
def corriger(
    versement_id: int,
    entree: VersementCorrection,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    """Le seul geste permis : annuler. Le reste remonte, la trace reste."""
    if entree.annule is not True:
        raise refus("saisie")
    return present.versement_dict(
        ecole.annuler_versement(db, organisation, versement_id, entree.note or "")
    )


@router.get("/recap")
def recap_mois(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> dict:
    """Le mois des frais : encaissé par classe, reste à payer par élève."""
    return ecole.recap(db, organisation, periode or periode_de(aujourdhui()))


@router.get("/inscriptions")
def inscriptions(organisation: OrganisationCourante, db: DbSession) -> dict:
    """Les demandes d'inscription venues de la page publique."""
    lignes = ecole.liste_demandes(db, organisation)
    return {
        "total": len(lignes),
        "demandees": sum(1 for un in lignes if un.statut == "demandee"),
        "demandes": [ecole.demande_dict(un) for un in lignes],
    }


@router.patch("/inscriptions/{demande_id}")
def corriger_demande(
    demande_id: int,
    entree: DemandeCorrection,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    if compte.role != "responsable" and entree.statut not in ("inscrit", "refuse"):
        raise refus("droits", 403)
    demande = ecole.traiter_demande(db, organisation, demande_id, entree.statut or "")
    return ecole.demande_dict(demande)
