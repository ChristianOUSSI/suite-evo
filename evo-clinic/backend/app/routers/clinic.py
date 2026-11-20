from fastapi import APIRouter, Query

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..messages import refus
from ..schemas import RendezVousCorrection, ActeCorrection, ActeEntree, PaiementCorrection, PaiementEntree
from ..services import clinic, present
from ..utils import aujourdhui, periode_de

router = APIRouter(tags=["registre"])


@router.get("/etat")
def etat(organisation: OrganisationCourante, db: DbSession) -> dict:
    """La vitre de l'accueil de la clinique."""
    return clinic.etat(db, organisation)


@router.get("/actes")
def actes(
    organisation: OrganisationCourante,
    db: DbSession,
    patient_id: int | None = Query(default=None),
    periode: str | None = Query(default=None),
    limite: int = Query(default=500, ge=1, le=2000),
) -> dict:
    return {
        "actes": clinic.liste_actes(
            db, organisation, patient_id=patient_id, periode=periode, limite=limite
        )
    }


@router.post("/actes")
def consulter(
    entree: ActeEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    """Un acte : le motif, le diagnostic, le traitement, le prix figé."""
    return present.acte_dict(clinic.consulter(db, organisation, entree, compte))


@router.patch("/actes/{acte_id}")
def corriger_acte(
    acte_id: int,
    entree: ActeCorrection,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    """Le seul geste permis : annuler. Le reste remonte, la trace reste."""
    if compte.role != "responsable":
        raise refus("droits", 403)
    if entree.annule is not True:
        if entree.motif is None and entree.diagnostic is None and entree.traitement is None and entree.montant is None:
            raise refus("saisie")
        acte = clinic.acte_de(db, organisation, acte_id)
        if acte.annule:
            raise refus("acte_annule", 409)
        if entree.motif is not None:
            acte.motif = entree.motif.strip()
        if entree.diagnostic is not None:
            acte.diagnostic = entree.diagnostic.strip()
        if entree.traitement is not None:
            acte.traitement = entree.traitement.strip()
        if entree.montant is not None:
            acte.montant = entree.montant
        db.commit()
        db.refresh(acte)
        return present.acte_dict(acte)
    return present.acte_dict(clinic.annuler_acte(db, organisation, acte_id))


@router.get("/paiements")
def paiements(
    organisation: OrganisationCourante,
    db: DbSession,
    patient_id: int | None = Query(default=None),
    periode: str | None = Query(default=None),
    limite: int = Query(default=500, ge=1, le=2000),
) -> dict:
    return {
        "paiements": clinic.liste_paiements(
            db, organisation, patient_id=patient_id, periode=periode, limite=limite
        )
    }


@router.post("/paiements")
def encaisser(
    entree: PaiementEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    """Un paiement : son montant, son moyen, son reçu qui prouve."""
    return present.paiement_dict(clinic.encaisser(db, organisation, entree, compte))


@router.patch("/paiements/{paiement_id}")
def corriger_paiement(
    paiement_id: int,
    entree: PaiementCorrection,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    """Le seul geste permis : annuler. Le reste remonte, la trace reste."""
    if compte.role != "responsable":
        raise refus("droits", 403)
    if entree.annule is not True:
        raise refus("saisie")
    return present.paiement_dict(
        clinic.annuler_paiement(db, organisation, paiement_id, entree.note or "")
    )


@router.get("/recap")
def recap_mois(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> dict:
    """Le mois de la clinique : actes, encaissé, ce qui reste dû."""
    return clinic.recap(db, organisation, periode or periode_de(aujourdhui()))


@router.get("/rendez-vous")
def rendez_vous(
    organisation: OrganisationCourante,
    db: DbSession,
    statut: str | None = Query(default=None),
) -> dict:
    lignes = clinic.liste_rdv(db, organisation, statut=statut)
    return {
        "total": len(lignes),
        "demandes": sum(1 for un in lignes if un.statut == "demande"),
        "rendez_vous": [clinic.rdv_dict(un) for un in lignes],
    }


@router.patch("/rendez-vous/{rdv_id}")
def corriger_rdv(
    rdv_id: int,
    entree: RendezVousCorrection,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    rdv = clinic.corriger_rdv(db, organisation, rdv_id, entree.statut or "")
    return clinic.rdv_dict(rdv)
