import csv
from io import StringIO

from fastapi import APIRouter, Query
from fastapi.responses import Response
from sqlalchemy import select

from ..deps import DbSession, OrganisationCourante
from ..models import Client, Envoi
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


@router.get("/exports/envois.csv")
def envois(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> Response:
    lignes = db.scalars(
        select(Envoi)
        .where(Envoi.organisation_id == organisation.id)
        .order_by(Envoi.date_envoi.desc())
        .limit(20000)
    ).all()
    if periode:
        lignes = [un for un in lignes if periode_de(un.date_envoi) == periode]
    return feuille(
        "import-envois.csv",
        ["numero_suivi", "description", "mode", "expediteur_pays", "destinataire", "ville", "poids_kg", "valeur_declaree", "frais", "statut", "client", "date_envoi", "date_livraison", "note"],
        [
            [
                un.numero_suivi, un.description, un.mode, un.expéditeur_pays,
                un.destinataire_nom, un.destinataire_ville, un.poids_kg,
                un.valeur_declaree, un.frais, un.statut,
                un.client.nom if un.client else "",
                un.date_envoi.isoformat(),
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
        "import-clients.csv",
        ["id", "nom", "telephone", "type", "note"],
        [
            [un.id, un.nom, un.telephone, un.type, un.note]
            for un in lignes
        ],
    )
