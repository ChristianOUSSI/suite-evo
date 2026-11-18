import csv
from io import StringIO

from fastapi import APIRouter, Query
from fastapi.responses import Response
from sqlalchemy import select

from ..deps import DbSession, OrganisationCourante
from ..models import CommandeVocale
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


@router.get("/exports/commandes.csv")
def commandes(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> Response:
    lignes = db.scalars(
        select(CommandeVocale)
        .where(CommandeVocale.organisation_id == organisation.id)
        .order_by(CommandeVocale.maj_le.desc())
        .limit(20000)
    ).all()
    if periode:
        lignes = [
            un for un in lignes
            if un.cree_le and periode_de(un.cree_le.date()) == periode
        ]
    return feuille(
        "voix-commandes.csv",
        ["id", "transcription", "intention", "statut", "resultat", "auteur", "cree_le", "maj_le"],
        [
            [
                un.id,
                un.transcription,
                un.intention,
                un.statut,
                un.resultat,
                un.auteur,
                un.cree_le.isoformat(timespec="seconds") if un.cree_le else "",
                un.maj_le.isoformat(timespec="seconds") if un.maj_le else "",
            ]
            for un in lignes
        ],
    )
