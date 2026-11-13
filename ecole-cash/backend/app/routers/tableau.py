from datetime import date, timedelta

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select

from ..deps import CurrentEcole, CurrentUser, DbSession
from ..schemas import JourneeIn
from ..services import caisse, present
from ..utils import jour_fr

router = APIRouter(tags=["caisse"])


@router.get("/dashboard")
def tableau(ecole: CurrentEcole, db: DbSession) -> dict:
    """Le matin de la directrice : la caisse, les retards, ce qui reste à faire."""
    return present.tableau_bord(db, ecole)


@router.get("/cash/jour")
def jour_du_cash(
    ecole: CurrentEcole,
    db: DbSession,
    jour: date | None = Query(default=None),
) -> dict:
    return caisse.etat(db, ecole, jour or date.today())


@router.get("/cash/serie")
def serie_cash(
    ecole: CurrentEcole,
    db: DbSession,
    jours: int = Query(default=7, ge=2, le=60),
) -> dict:
    return {"days": caisse.serie(db, ecole, jours)}


@router.get("/cash/journal")
def journal_cash(
    ecole: CurrentEcole,
    db: DbSession,
    jours: int = Query(default=14, ge=1, le=120),
) -> dict:
    """Les déclarations de caisse, jour par jour, avec leur écart."""
    today = date.today()
    feuilles = []
    for decalage in range(jours):
        jour = today - timedelta(days=decalage)
        ouverte = caisse.journee(db, ecole, jour)
        if ouverte:
            feuilles.append(present.journee_dict(ouverte, ecole, db))
    return {"jours": jours, "journees": feuilles}


@router.post("/cash/declarer")
def declarer_journee(
    entree: JourneeIn, ecole: CurrentEcole, db: DbSession, membre: CurrentUser
) -> dict:
    """Le comptage du soir. S'il manque quelque chose, l'écart s'affiche."""
    if entree.jour > date.today():
        raise HTTPException(
            status_code=422, detail="On ne compte pas une journée à venir."
        )
    ouverte = caisse.declarer(
        db,
        ecole,
        entree.jour,
        entree.fond,
        entree.comptage,
        entree.tenu_par or membre.nom,
        entree.note,
    )
    fiche = present.journee_dict(ouverte, ecole, db)
    fiche["message"] = (
        (
            f"Écart de {fiche['ecart']} le {jour_fr(ouverte.jour)}. "
            "La journée reste ouverte jusqu'à ce que ce soit expliqué."
        )
        if fiche["ecart"] not in (None, 0)
        else f"Caisse comptée le {jour_fr(ouverte.jour)}, rien à redire."
    )
    return fiche
