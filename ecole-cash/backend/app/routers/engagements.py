from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..deps import CurrentEcole, DbSession
from ..models import Eleve, Engagement
from ..schemas import EngagementIn
from ..services import facturation, present

router = APIRouter(tags=["engagements"])


@router.get("/engagements")
def liste(
    ecole: CurrentEcole,
    db: DbSession,
    annee: str | None = Query(default=None),
) -> dict:
    """Toutes les ardoises de l'année, famille par famille."""
    cible = annee or present.annee_courante(ecole)
    lignes = db.scalars(
        select(Engagement)
        .where(Engagement.ecole_id == ecole.id, Engagement.annee == cible)
        .order_by(Engagement.eleve_id)
    ).all()
    fiches = [present.eleve_dict(db, ligne.eleve, cible) for ligne in lignes]
    return {
        "annee": cible,
        "total": len(fiches),
        "attendu": sum(fiche["du"] for fiche in fiches),
        "rentre": sum(fiche["rentre"] for fiche in fiches),
        "reste": sum(fiche["reste"] for fiche in fiches),
        "eleves": fiches,
    }


def _engagement(db: Session, ecole_id: int, identifiant: int) -> Engagement:
    engagement = db.get(Engagement, identifiant)
    if not engagement or engagement.ecole_id != ecole_id:
        raise HTTPException(status_code=404, detail="Cette ardoise n'est pas ici.")
    return engagement


@router.post("/engagements")
def ouvrir(entree: EngagementIn, ecole: CurrentEcole, db: DbSession) -> dict:
    """Une ardoise posée à la main, pour une famille hors classe ou un doublon."""
    eleve = db.get(Eleve, entree.eleve_id)
    if not eleve or eleve.ecole_id != ecole.id:
        raise HTTPException(status_code=422, detail="Cet élève n'est pas ici.")
    if facturation.engagement_de(db, eleve, entree.annee):
        raise HTTPException(
            status_code=422,
            detail=f"Une ardoise court déjà pour {entree.annee}.",
        )
    engagement = Engagement(
        ecole_id=ecole.id,
        eleve_id=eleve.id,
        annee=entree.annee,
        scolarite=entree.scolarite,
        cantine=entree.cantine,
        transport=entree.transport,
        autres=entree.autres,
        remise=entree.remise,
        motif_remise=entree.motif_remise.strip(),
        tranches=entree.tranches,
    )
    db.add(engagement)
    db.flush()
    facturation.poser_echeances(
        db, engagement, ecole.date_rentree, premiere=entree.premiere_echeance
    )
    db.commit()
    return present.eleve_dict(db, eleve, entree.annee)


@router.patch("/engagements/{engagement_id}")
def regler(
    engagement_id: int, entree: EngagementIn, ecole: CurrentEcole, db: DbSession
) -> dict:
    """Remise ou tranches : le calendrier se repose sans perdre les paiements."""
    engagement = _engagement(db, ecole.id, engagement_id)
    engagement.scolarite = entree.scolarite
    engagement.cantine = entree.cantine
    engagement.transport = entree.transport
    engagement.autres = entree.autres
    engagement.remise = entree.remise
    engagement.motif_remise = entree.motif_remise.strip()
    engagement.tranches = entree.tranches
    db.flush()
    engagement.solde_compte = sum(ligne.impute for ligne in engagement.echeances)
    facturation.poser_echeances(
        db, engagement, ecole.date_rentree, premiere=entree.premiere_echeance
    )
    db.commit()
    return present.eleve_dict(db, engagement.eleve, engagement.annee)


@router.get("/engagements/{engagement_id}")
def une_fiche(engagement_id: int, ecole: CurrentEcole, db: DbSession) -> dict:
    engagement = _engagement(db, ecole.id, engagement_id)
    return present.eleve_dict(db, engagement.eleve, engagement.annee)
