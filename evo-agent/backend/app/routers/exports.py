import csv
from io import StringIO

from fastapi import APIRouter, Query
from fastapi.responses import Response
from sqlalchemy import select

from ..deps import DbSession, OrganisationCourante
from ..models import Execution, Tache
from ..utils import periode_de

router = APIRouter(tags=["feuilles"])


def proteger(cellule) -> str:
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


@router.get("/exports/taches.csv")
def taches(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> Response:
    lignes = db.scalars(
        select(Tache)
        .where(Tache.organisation_id == organisation.id)
        .order_by(Tache.maj_le.desc())
        .limit(20000)
    ).all()
    if periode:
        lignes = [
            un for un in lignes
            if un.cree_le and periode_de(un.cree_le.date()) == periode
        ]
    return feuille(
        "agent-taches.csv",
        ["id", "titre", "consigne", "type", "priorite", "statut", "resultat", "erreur", "cree_par", "cree_le", "maj_le"],
        [
            [
                un.id,
                un.titre,
                un.consigne,
                un.type,
                un.priorite,
                un.statut,
                un.resultat,
                un.erreur,
                un.cree_par,
                un.cree_le.isoformat(timespec="seconds") if un.cree_le else "",
                un.maj_le.isoformat(timespec="seconds") if un.maj_le else "",
            ]
            for un in lignes
        ],
    )


@router.get("/exports/executions.csv")
def executions(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> Response:
    lignes = db.scalars(
        select(Execution)
        .where(Execution.organisation_id == organisation.id)
        .order_by(Execution.fin_le.desc())
        .limit(20000)
    ).all()
    if periode:
        lignes = [
            un for un in lignes
            if un.fin_le and periode_de(un.fin_le.date()) == periode
        ]
    return feuille(
        "agent-executions.csv",
        ["id", "tache", "statut", "debut", "fin", "duree_secondes", "resultat", "details"],
        [
            [
                un.id,
                un.tache.titre if un.tache else "",
                un.statut,
                un.debut_le.isoformat(timespec="seconds") if un.debut_le else "",
                un.fin_le.isoformat(timespec="seconds") if un.fin_le else "",
                un.duree_secondes,
                un.resultat,
                un.details,
            ]
            for un in lignes
        ],
    )
