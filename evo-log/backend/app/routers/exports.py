import csv
from io import StringIO

from fastapi import APIRouter, Query
from fastapi.responses import Response
from sqlalchemy import select

from ..deps import DbSession, OrganisationCourante
from ..models import Colis
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


@router.get("/exports/colis.csv")
def colis(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> Response:
    lignes = db.scalars(
        select(Colis)
        .where(Colis.organisation_id == organisation.id)
        .order_by(Colis.date_depot.desc())
        .limit(20000)
    ).all()
    if periode:
        lignes = [un for un in lignes if periode_de(un.date_depot) == periode]
    return feuille(
        "log-colis.csv",
        ["numero", "date_depot", "genre", "description", "poids_kg", "expediteur", "expediteur_tel", "destinataire", "destinataire_tel", "depart", "arrivee", "frais", "moyen", "statut", "date_livraison", "agent"],
        [
            [
                un.numero, un.date_depot.isoformat(), un.genre, un.description,
                un.poids_kg, un.expediteur_nom, un.expediteur_telephone,
                un.destinataire_nom, un.destinataire_telephone,
                un.depart, un.arrivee, un.frais, un.moyen, un.statut,
                un.date_livraison.isoformat() if un.date_livraison else "",
                un.agent.nom if un.agent else "",
            ]
            for un in lignes
        ],
    )


@router.get("/exports/suivis.csv")
def suivis(organisation: OrganisationCourante, db: DbSession) -> Response:
    lignes = db.scalars(
        select(Colis)
        .where(Colis.organisation_id == organisation.id)
        .order_by(Colis.numero)
        .limit(20000)
    ).all()
    return feuille(
        "log-suivis.csv",
        ["numero", "statut", "depart", "arrivee", "destinataire", "date_depot", "date_livraison"],
        [
            [
                un.numero, un.statut, un.depart, un.arrivee,
                un.destinataire_nom, un.date_depot.isoformat(),
                un.date_livraison.isoformat() if un.date_livraison else "",
            ]
            for un in lignes
        ],
    )
