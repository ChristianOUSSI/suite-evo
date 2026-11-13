import csv
from io import StringIO

from fastapi import APIRouter, Query
from fastapi.responses import Response
from sqlalchemy import select

from ..deps import DbSession, OrganisationCourante
from ..models import Annonce, Commande
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


@router.get("/exports/annonces.csv")
def annonces(organisation: OrganisationCourante, db: DbSession) -> Response:
    lignes = db.scalars(
        select(Annonce).where(Annonce.organisation_id == organisation.id).order_by(Annonce.prix)
    ).all()
    return feuille(
        "market-annonces.csv",
        ["id", "titre", "categorie", "prix", "stock", "statut", "ville", "quartier", "vendeur", "telephone", "commandes"],
        [
            [
                un.id, un.titre, un.categorie, un.prix, un.stock, un.statut,
                un.ville, un.quartier, un.vendeur_nom, un.vendeur_telephone,
                len([c for c in un.commandes_liste if c.statut != "annulee"]),
            ]
            for un in lignes
        ],
    )


@router.get("/exports/commandes.csv")
def commandes(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> Response:
    lignes = db.scalars(
        select(Commande)
        .where(Commande.organisation_id == organisation.id)
        .order_by(Commande.date.desc())
        .limit(20000)
    ).all()
    if periode:
        lignes = [un for un in lignes if periode_de(un.date) == periode]
    return feuille(
        "market-commandes.csv",
        ["id", "date", "annonce", "categorie", "quantite", "montant", "acheteur", "telephone", "moyen", "statut", "cree_par"],
        [
            [
                un.id, un.date.isoformat(), un.annonce.titre if un.annonce else "",
                un.annonce.categorie if un.annonce else "",
                un.quantite, un.montant, un.acheteur_nom, un.acheteur_telephone,
                un.moyen, un.statut, un.auteur.nom if un.auteur else "",
            ]
            for un in lignes
        ],
    )
