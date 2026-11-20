from fastapi import APIRouter, Query

from ..deps import DbSession, OrganisationCourante
from ..schemas import DemandeCorrection
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


@router.get("/demandes")
def demandes(
    organisation: OrganisationCourante,
    db: DbSession,
    statut: str | None = Query(default=None),
) -> dict:
    """Les demandes de devis venues de la page publique."""
    lignes = fret.liste_demandes(db, organisation, statut=statut)
    return {
        "total": len(lignes),
        "en_attente": sum(1 for un in lignes if un.statut == "demande"),
        "demandes": [fret.demande_dict(un) for un in lignes],
    }


@router.patch("/demandes/{demande_id}")
def corriger_demande(
    demande_id: int,
    entree: DemandeCorrection,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    demande = fret.corriger_demande(
        db, organisation, demande_id, entree.statut or "", entree.note
    )
    return fret.demande_dict(demande)
