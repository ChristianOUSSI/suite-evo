import csv
from io import StringIO

from fastapi import APIRouter, Query
from fastapi.responses import Response
from sqlalchemy import select

from ..deps import DbSession, OrganisationCourante
from ..models import Bien, Demande, Visite
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


@router.get("/exports/biens.csv")
def biens(organisation: OrganisationCourante, db: DbSession) -> Response:
    lignes = db.scalars(
        select(Bien).where(Bien.organisation_id == organisation.id).order_by(Bien.prix)
    ).all()
    return feuille(
        "immo-biens.csv",
        ["id", "type", "titre", "ville", "quartier", "prix", "surface_m2", "chambres", "statut", "proprietaire", "telephone", "agent"],
        [
            [
                un.id, un.type, un.titre, un.ville, un.quartier, un.prix,
                un.surface_m2, un.chambres, un.statut, un.proprietaire_nom,
                un.proprietaire_telephone,
                un.agent.nom if un.agent else "",
            ]
            for un in lignes
        ],
    )


@router.get("/exports/demandes.csv")
def demandes(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> Response:
    lignes = db.scalars(
        select(Demande)
        .where(Demande.organisation_id == organisation.id)
        .order_by(Demande.date.desc())
        .limit(20000)
    ).all()
    if periode:
        lignes = [un for un in lignes if periode_de(un.date) == periode]
    return feuille(
        "immo-demandes.csv",
        ["id", "date", "client", "telephone", "canal", "bien", "statut", "message", "cree_par"],
        [
            [
                un.id, un.date.isoformat(), un.client_nom, un.client_telephone,
                un.canal,
                un.bien.titre or un.bien.type if un.bien else "",
                un.statut, un.message, un.auteur.nom if un.auteur else "",
            ]
            for un in lignes
        ],
    )


@router.get("/exports/visites.csv")
def visites(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> Response:
    lignes = db.scalars(
        select(Visite)
        .where(Visite.organisation_id == organisation.id)
        .order_by(Visite.date, Visite.heure)
        .limit(20000)
    ).all()
    if periode:
        lignes = [un for un in lignes if periode_de(un.date) == periode]
    return feuille(
        "immo-visites.csv",
        ["id", "date", "heure", "bien", "type", "quartier", "client", "telephone", "issue", "note", "cree_par"],
        [
            [
                un.id, un.date.isoformat(), un.heure,
                un.bien.titre or un.bien.type, un.bien.type, un.bien.quartier,
                un.client_nom, un.client_telephone, un.issue, un.note,
                un.auteur.nom if un.auteur else "",
            ]
            for un in lignes
        ],
    )
