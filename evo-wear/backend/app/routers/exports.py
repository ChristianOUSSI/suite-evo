import csv
from io import StringIO

from fastapi import APIRouter, Query
from fastapi.responses import Response
from sqlalchemy import select

from ..deps import DbSession, OrganisationCourante
from ..models import Article, Client
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


@router.get("/exports/articles.csv")
def articles(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> Response:
    lignes = db.scalars(
        select(Article)
        .where(Article.organisation_id == organisation.id)
        .order_by(Article.categorie, Article.nom)
        .limit(20000)
    ).all()
    if periode:
        lignes = [
            un for un in lignes
            if un.date_vente and periode_de(un.date_vente) == periode
        ]
    return feuille(
        "wear-articles.csv",
        ["id", "reference", "nom", "categorie", "taille", "couleur", "stock", "prix_achat", "prix_vente", "statut", "quantite_vendue", "cliente", "date_vente", "note"],
        [
            [
                un.id, un.reference, un.nom, un.categorie, un.taille, un.couleur,
                un.stock, un.prix_achat, un.prix_vente, un.statut,
                un.quantite_vendue,
                un.client.nom if un.client else "",
                un.date_vente.isoformat() if un.date_vente else "",
                un.note,
            ]
            for un in lignes
        ],
    )


@router.get("/exports/clients.csv")
def clients(
    organisation: OrganisationCourante,
    db: DbSession,
) -> Response:
    lignes = db.scalars(
        select(Client)
        .where(Client.organisation_id == organisation.id)
        .order_by(Client.nom)
        .limit(20000)
    ).all()
    return feuille(
        "wear-clients.csv",
        ["id", "nom", "telephone", "type", "note"],
        [
            [un.id, un.nom, un.telephone, un.type, un.note]
            for un in lignes
        ],
    )
