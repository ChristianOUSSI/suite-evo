import csv
from io import StringIO

from fastapi import APIRouter, Query
from fastapi.responses import Response
from sqlalchemy import select

from ..deps import DbSession, OrganisationCourante
from ..models import Client, Livraison
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


@router.get("/exports/livraisons.csv")
def livraisons(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> Response:
    lignes = db.scalars(
        select(Livraison)
        .where(Livraison.organisation_id == organisation.id)
        .order_by(Livraison.date_commande.desc(), Livraison.id.desc())
        .limit(20000)
    ).all()
    if periode:
        lignes = [
            un for un in lignes
            if un.date_livraison and periode_de(un.date_livraison) == periode
        ]
    return feuille(
        "gaz-livraisons.csv",
        ["id", "client", "telephone", "quartier", "adresse", "quantite", "prix_unitaire", "montant", "statut", "date_commande", "date_livraison", "note"],
        [
            [
                un.id,
                un.client.nom if un.client else "",
                un.client.telephone if un.client else "",
                un.client.quartier if un.client else "",
                un.adresse,
                un.quantite,
                un.prix_unitaire,
                un.quantite * un.prix_unitaire,
                un.statut,
                un.date_commande.isoformat() if un.date_commande else "",
                un.date_livraison.isoformat() if un.date_livraison else "",
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
        "gaz-clients.csv",
        ["id", "nom", "telephone", "quartier", "type", "note"],
        [
            [un.id, un.nom, un.telephone, un.quartier, un.type, un.note]
            for un in lignes
        ],
    )
