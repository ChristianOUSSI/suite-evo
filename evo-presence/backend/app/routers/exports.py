import csv
from datetime import timedelta
from io import StringIO

from fastapi import APIRouter, Query
from fastapi.responses import Response
from sqlalchemy import select

from ..deps import DbSession, OrganisationCourante
from ..models import Employe, Presence
from ..services import presence
from ..utils import affiche_telephone, aujourdhui, periode_de

router = APIRouter(tags=["feuilles"])

# Les entêtes reprennent les clés du contrat d'API, pas une phrase : un
# comptable de Douala comme un cabinet anglophone ouvrent la même feuille.


def proteger(cellule) -> str:
    """Un champ qui commence par =, +, - ou @ devient du texte pour le tableur."""
    texte = "" if cellule is None else str(cellule)
    if texte[:1] in ("=", "+", "-", "@", "\t", "\r"):
        return f"'{texte}"
    return texte


def feuille(nom: str, entete: list[str], lignes: list[list]) -> Response:
    tampon = StringIO()
    scribe = csv.writer(tampon, delimiter=";", lineterminator="\r\n")
    scribe.writerow(entete)
    for rangee in lignes:
        scribe.writerow([proteger(cellule) for cellule in rangee])
    return Response(
        content="﻿" + tampon.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={
            "content-disposition": f'attachment; filename="{nom}"',
            "cache-control": "no-store",
        },
    )


@router.get("/exports/employes.csv")
def employes(organisation: OrganisationCourante, db: DbSession) -> Response:
    lignes = db.scalars(
        select(Employe).where(Employe.organisation_id == organisation.id).order_by(Employe.nom)
    ).all()
    return feuille(
        "presence-employes.csv",
        ["id", "nom", "telephone", "service", "actif", "entree_le", "note", "pointages"],
        [
            [
                un.id,
                un.nom,
                un.telephone,
                un.service,
                1 if un.actif else 0,
                un.entree_le.isoformat(),
                un.note,
                len(un.pointages),
            ]
            for un in lignes
        ],
    )


@router.get("/exports/pointages.csv")
def pointages(
    organisation: OrganisationCourante,
    db: DbSession,
    jours: int = Query(default=60, ge=1, le=730),
) -> Response:
    depuis = aujourdhui() - timedelta(days=jours)
    lignes = db.scalars(
        select(Presence)
        .join(Employe, Presence.employe_id == Employe.id)
        .where(Employe.organisation_id == organisation.id, Presence.jour >= depuis)
        .order_by(Presence.jour.desc())
        .limit(20000)
    ).all()
    return feuille(
        "presence-pointages.csv",
        ["employe", "service", "jour", "statut", "arrivee", "depart", "note", "pointe_le", "par"],
        [
            [
                un.employe.nom,
                un.employe.service,
                un.jour.isoformat(),
                un.statut,
                un.arrivee,
                un.depart,
                un.note,
                un.pointe_le.isoformat(timespec="seconds"),
                un.pointeur.nom if un.pointeur else "",
            ]
            for un in lignes
        ],
    )


@router.get("/exports/recap.csv")
def recap_csv(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> Response:
    resume = presence.recap(db, organisation, periode or periode_de(aujourdhui()))
    return feuille(
        f"presence-recap-{resume['periode']}.csv",
        [
            "nom",
            "service",
            "telephone",
            "presents",
            "retards",
            "absents",
            "jours",
            "heures",
            "code_controle",
        ],
        [
            [
                un["nom"],
                un["service"],
                affiche_telephone(un["telephone"]),
                un["presents"],
                un["retards"],
                un["absents"],
                un["jours"],
                un["heures"],
                un["code"],
            ]
            for un in resume["lignes"]
        ],
    )
