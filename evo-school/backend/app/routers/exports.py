import csv
from io import StringIO

from fastapi import APIRouter, Query
from fastapi.responses import Response
from sqlalchemy import select

from ..deps import DbSession, OrganisationCourante
from ..models import Classe, Eleve, Versement
from ..services import ecole
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


@router.get("/exports/classes.csv")
def classes(organisation: OrganisationCourante, db: DbSession) -> Response:
    lignes = db.scalars(
        select(Classe).where(Classe.organisation_id == organisation.id).order_by(Classe.nom)
    ).all()
    return feuille(
        "ecole-classes.csv",
        ["id", "nom", "titulaire", "frais_annuels", "actif", "note", "eleves"],
        [
            [
                un.id, un.nom, un.titulaire, un.frais_annuels,
                1 if un.actif else 0, un.note, len(un.eleves),
            ]
            for un in lignes
        ],
    )


@router.get("/exports/eleves.csv")
def eleves(organisation: OrganisationCourante, db: DbSession) -> Response:
    lignes = ecole.liste_eleves(db, organisation)
    return feuille(
        "ecole-eleves.csv",
        ["id", "classe", "nom", "matricule", "parent", "telephone", "frais_attendu", "paye", "reste", "actif"],
        [
            [
                un["id"], un["classe"], un["nom"], un["matricule"],
                un["parent_nom"], un["parent_telephone"], un["frais_attendu"],
                un["paye"], un["reste"], 1 if un["actif"] else 0,
            ]
            for un in lignes
        ],
    )


@router.get("/exports/versements.csv")
def versements(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> Response:
    lignes = db.scalars(
        select(Versement)
        .where(Versement.organisation_id == organisation.id)
        .order_by(Versement.date.desc())
        .limit(20000)
    ).all()
    if periode:
        lignes = [un for un in lignes if un.periode == periode]
    return feuille(
        "ecole-versements.csv",
        ["recu", "date", "periode", "eleve", "classe", "montant", "moyen", "annule", "note", "cree_par"],
        [
            [
                un.recu, un.date.isoformat(), un.periode, un.eleve.nom,
                un.eleve.classe.nom, un.montant, un.moyen,
                1 if un.annule else 0, un.note,
                un.auteur.nom if un.auteur else "",
            ]
            for un in lignes
        ],
    )
