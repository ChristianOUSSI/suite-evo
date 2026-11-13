from datetime import date, timedelta

from fastapi import APIRouter, Query
from sqlalchemy import select

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..models import Employe, Presence as Ligne
from ..schemas import PresenceCorrection, PresenceEntree
from ..services import presence, present
from ..utils import aujourdhui, periode_de

router = APIRouter(tags=["pointage"])


@router.get("/pointage")
def equipe_du_jour(
    organisation: OrganisationCourante,
    db: DbSession,
    jour: date | None = Query(default=None),
) -> dict:
    """La feuille du jour : chaque employé actif, avec ou sans sa ligne."""
    cible = jour or aujourdhui()
    return {
        "jour": cible.isoformat(),
        "equipe": presence.equipe_du_jour(db, organisation, cible),
    }


@router.post("/pointages")
def pointer(
    entree: PresenceEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    return present.presence_dict(presence.pointer(db, organisation, entree, compte))


@router.patch("/pointages/{presence_id}")
def corriger(
    presence_id: int,
    entree: PresenceCorrection,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    return present.presence_dict(
        presence.corriger_presence(db, organisation, presence_id, entree, compte)
    )


@router.get("/journal")
def journal(
    organisation: OrganisationCourante,
    db: DbSession,
    jours: int = Query(default=30, ge=1, le=365),
) -> dict:
    """Les dernières lignes pointées, la plus récente d'abord."""
    depuis = aujourdhui() - timedelta(days=jours)
    lignes = db.scalars(
        select(Ligne)
        .join(Employe, Ligne.employe_id == Employe.id)
        .where(Employe.organisation_id == organisation.id, Ligne.jour >= depuis)
        .order_by(Ligne.jour.desc(), Ligne.id.desc())
        .limit(500)
    ).all()
    return {
        "jours": jours,
        "lignes": [present.presence_dict(un) for un in lignes],
    }


@router.get("/recap")
def recap_mois(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
    tous: bool = Query(default=False),
) -> dict:
    """Le mois de chacun, recalculé à la demande."""
    return presence.recap(
        db, organisation, periode or periode_de(aujourdhui()), tous=tous
    )


@router.get("/etat")
def etat(organisation: OrganisationCourante, db: DbSession) -> dict:
    """La vitre du bureau : ce qui reste à pointer aujourd'hui."""
    aujourdhui_d = aujourdhui()
    equipe = presence.equipe_du_jour(db, organisation, aujourdhui_d)
    pointes = sum(1 for un in equipe if un["pointe"])
    par_statut = {"present": 0, "retard": 0, "absent": 0}
    for un in equipe:
        if un["pointe"] and un["statut"] in par_statut:
            par_statut[un["statut"]] += 1
    return {
        "jour": aujourdhui_d.isoformat(),
        "periode": periode_de(aujourdhui_d),
        "effectif": len(equipe),
        "pointes": pointes,
        "a_pointer": max(0, len(equipe) - pointes),
        "par_statut": par_statut,
    }
