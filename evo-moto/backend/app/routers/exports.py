import csv
from io import StringIO

from fastapi import APIRouter, Query
from fastapi.responses import Response
from sqlalchemy import select

from ..deps import DbSession, OrganisationCourante
from ..models import Client, Moto, Reparation
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


@router.get("/exports/motos.csv")
def motos(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> Response:
    lignes = db.scalars(
        select(Moto)
        .where(Moto.organisation_id == organisation.id)
        .order_by(Moto.marque, Moto.modele)
        .limit(20000)
    ).all()
    if periode:
        lignes = [
            un for un in lignes
            if un.date_vente and periode_de(un.date_vente) == periode
        ]
    return feuille(
        "moto-motos.csv",
        ["id", "marque", "modele", "annee", "kilometrage", "couleur", "prix", "statut", "client", "date_vente", "note"],
        [
            [
                un.id, un.marque, un.modele, un.annee, un.kilometrage,
                un.couleur, un.prix, un.statut,
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
        "moto-clients.csv",
        ["id", "nom", "telephone", "type", "note"],
        [
            [un.id, un.nom, un.telephone, un.type, un.note]
            for un in lignes
        ],
    )


@router.get("/exports/reparations.csv")
def reparations(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> Response:
    lignes = db.scalars(
        select(Reparation)
        .where(Reparation.organisation_id == organisation.id)
        .order_by(Reparation.date_reception.desc())
        .limit(20000)
    ).all()
    if periode:
        lignes = [
            un for un in lignes
            if un.date_livraison and periode_de(un.date_livraison) == periode
        ]
    return feuille(
        "moto-reparations.csv",
        ["id", "client", "moto", "immatriculation", "panne", "travaux", "main_oeuvre", "pieces", "total", "statut", "date_reception", "date_livraison", "note"],
        [
            [
                un.id,
                un.client.nom if un.client else "",
                f"{un.moto.marque} {un.moto.modele}" if un.moto else "",
                un.immatriculation, un.panne, un.travaux,
                un.cout_main_oeuvre, un.cout_pieces,
                un.cout_main_oeuvre + un.cout_pieces,
                un.statut,
                un.date_reception.isoformat() if un.date_reception else "",
                un.date_livraison.isoformat() if un.date_livraison else "",
                un.note,
            ]
            for un in lignes
        ],
    )
