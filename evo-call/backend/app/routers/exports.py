import csv
from io import StringIO

from fastapi import APIRouter, Query
from fastapi.responses import Response
from sqlalchemy import select

from ..deps import DbSession, OrganisationCourante
from ..models import Appel
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


@router.get("/exports/appels.csv")
def appels(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> Response:
    lignes = db.scalars(
        select(Appel)
        .where(Appel.organisation_id == organisation.id)
        .order_by(Appel.date.desc())
        .limit(20000)
    ).all()
    if periode:
        lignes = [un for un in lignes if periode_de(un.date) == periode]
    return feuille(
        "call-appels.csv",
        ["id", "date", "client", "telephone", "sens", "motif", "statut", "agent", "duree_secondes", "date_rappel", "note", "cree_par"],
        [
            [
                un.id, un.date.isoformat(), un.client_nom, un.client_telephone,
                un.sens, un.motif, un.statut, un.agent.nom if un.agent else "",
                un.duree_secondes,
                un.date_rappel.isoformat() if un.date_rappel else "",
                un.note, un.auteur.nom if un.auteur else "",
            ]
            for un in lignes
        ],
    )
