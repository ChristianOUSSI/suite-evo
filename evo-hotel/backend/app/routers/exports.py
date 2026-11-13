import csv
from io import StringIO

from fastapi import APIRouter, Query
from fastapi.responses import Response
from sqlalchemy import select

from ..deps import DbSession, OrganisationCourante
from ..models import Chambre, Client, Sejour
from ..services import hotel, present
from ..utils import affiche_telephone, aujourdhui, periode_de

router = APIRouter(tags=["feuilles"])

# Les entêtes reprennent les clés du contrat d'API, pas une phrase : un
# comptable de Douala comme une réception anglophone ouvrent la même feuille.


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


@router.get("/exports/chambres.csv")
def chambres(organisation: OrganisationCourante, db: DbSession) -> Response:
    lignes = db.scalars(
        select(Chambre)
        .where(Chambre.organisation_id == organisation.id)
        .order_by(Chambre.numero)
    ).all()
    return feuille(
        "hotel-chambres.csv",
        ["id", "numero", "type", "prix_par_nuit", "capacite", "actif", "note", "sejours"],
        [
            [
                un.id,
                un.numero,
                un.type,
                un.prix_par_nuit,
                un.capacite,
                1 if un.actif else 0,
                un.note,
                len(un.sejours),
            ]
            for un in lignes
        ],
    )


@router.get("/exports/clients.csv")
def clients(organisation: OrganisationCourante, db: DbSession) -> Response:
    lignes = db.scalars(
        select(Client)
        .where(Client.organisation_id == organisation.id)
        .order_by(Client.nom)
    ).all()
    return feuille(
        "hotel-clients.csv",
        ["id", "nom", "telephone", "piece", "actif", "note", "sejours"],
        [
            [
                un.id,
                un.nom,
                un.telephone,
                un.piece,
                1 if un.actif else 0,
                un.note,
                len(un.sejours),
            ]
            for un in lignes
        ],
    )


@router.get("/exports/sejours.csv")
def sejours(
    organisation: OrganisationCourante,
    db: DbSession,
) -> Response:
    lignes = db.scalars(
        select(Sejour)
        .where(Sejour.organisation_id == organisation.id)
        .order_by(Sejour.arrivee.desc())
        .limit(20000)
    ).all()
    return feuille(
        "hotel-sejours.csv",
        ["chambre", "type", "client", "telephone", "arrivee", "depart", "nuits", "montant", "statut", "note", "cree_par"],
        [
            [
                un.chambre.numero,
                un.chambre.type,
                un.client.nom,
                un.client.telephone,
                un.arrivee.isoformat(),
                un.depart.isoformat(),
                (un.depart - un.arrivee).days,
                (un.depart - un.arrivee).days * un.chambre.prix_par_nuit,
                un.statut,
                un.note,
                un.auteur.nom if un.auteur else "",
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
    resume = hotel.recap(db, organisation, periode or periode_de(aujourdhui()))
    return feuille(
        f"hotel-recap-{resume['periode']}.csv",
        ["chambre", "type", "nuits", "montant"],
        [
            [
                un["numero"],
                un["type"],
                un["nuits"],
                un["montant"],
            ]
            for un in resume["par_chambre"]
        ]
        + [["TOTAL", "", resume["nuits_vendues"], resume["montant"]]],
    )
