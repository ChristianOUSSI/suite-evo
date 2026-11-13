import csv
from io import StringIO

from fastapi import APIRouter
from fastapi.responses import Response
from sqlalchemy import select

from ..deps import DbSession, OrganisationCourante
from ..models import Note

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


@router.get("/exports/notes.csv")
def notes(
    organisation: OrganisationCourante,
    db: DbSession,
) -> Response:
    lignes = db.scalars(
        select(Note)
        .where(Note.organisation_id == organisation.id)
        .order_by(Note.epinglee.desc(), Note.maj_le.desc())
        .limit(20000)
    ).all()
    return feuille(
        "carnet-notes.csv",
        ["id", "titre", "contenu", "categorie", "epinglee", "archivee", "code_partage", "cree_le", "maj_le"],
        [
            [
                un.id,
                un.titre,
                un.contenu,
                un.categorie,
                "oui" if un.epinglee else "non",
                "oui" if un.archivee else "non",
                un.code_partage,
                un.cree_le.isoformat(timespec="seconds") if un.cree_le else "",
                un.maj_le.isoformat(timespec="seconds") if un.maj_le else "",
            ]
            for un in lignes
        ],
    )
