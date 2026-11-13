import csv
from io import StringIO

from fastapi import APIRouter
from fastapi.responses import Response
from sqlalchemy import select

from ..deps import DbSession, OrganisationCourante
from ..models import Document

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


@router.get("/exports/documents.csv")
def documents(organisation: OrganisationCourante, db: DbSession) -> Response:
    lignes = db.scalars(
        select(Document)
        .where(Document.organisation_id == organisation.id)
        .order_by(Document.date_document.desc())
        .limit(20000)
    ).all()
    return feuille(
        "docs-documents.csv",
        ["reference", "titre", "categorie", "emetteur", "destinataire", "date_document", "echeance", "statut", "note", "cree_par"],
        [
            [
                un.reference, un.titre, un.categorie, un.emetteur, un.destinataire,
                un.date_document.isoformat(),
                un.echeance.isoformat() if un.echeance else "",
                un.statut, un.note, un.auteur.nom if un.auteur else "",
            ]
            for un in lignes
        ],
    )
