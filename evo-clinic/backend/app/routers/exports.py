import csv
from io import StringIO

from fastapi import APIRouter, Query
from fastapi.responses import Response
from sqlalchemy import select

from ..deps import DbSession, OrganisationCourante
from ..models import Acte, Paiement, Patient
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


@router.get("/exports/patients.csv")
def patients(organisation: OrganisationCourante, db: DbSession) -> Response:
    lignes = db.scalars(
        select(Patient).where(Patient.organisation_id == organisation.id).order_by(Patient.nom)
    ).all()
    return feuille(
        "clinique-patients.csv",
        ["id", "nom", "telephone", "naissance", "sexe", "groupe", "allergies", "actif"],
        [
            [
                un.id, un.nom, un.telephone, un.naissance, un.sexe,
                un.groupe, un.allergies, 1 if un.actif else 0,
            ]
            for un in lignes
        ],
    )


@router.get("/exports/actes.csv")
def actes(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> Response:
    lignes = db.scalars(
        select(Acte)
        .where(Acte.organisation_id == organisation.id)
        .order_by(Acte.date.desc())
        .limit(20000)
    ).all()
    if periode:
        lignes = [un for un in lignes if periode_de(un.date) == periode]
    return feuille(
        "clinique-actes.csv",
        ["id", "date", "patient", "motif", "diagnostic", "traitement", "montant", "annule", "cree_par"],
        [
            [
                un.id, un.date.isoformat(), un.patient.nom, un.motif,
                un.diagnostic, un.traitement, un.montant,
                1 if un.annule else 0, un.auteur.nom if un.auteur else "",
            ]
            for un in lignes
        ],
    )


@router.get("/exports/paiements.csv")
def paiements(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> Response:
    lignes = db.scalars(
        select(Paiement)
        .where(Paiement.organisation_id == organisation.id)
        .order_by(Paiement.date.desc())
        .limit(20000)
    ).all()
    if periode:
        lignes = [un for un in lignes if periode_de(un.date) == periode]
    return feuille(
        "clinique-paiements.csv",
        ["recu", "date", "patient", "acte", "montant", "moyen", "annule", "note", "cree_par"],
        [
            [
                un.recu, un.date.isoformat(), un.patient.nom,
                un.acte.motif if un.acte else "",
                un.montant, un.moyen,
                1 if un.annule else 0, un.note,
                un.auteur.nom if un.auteur else "",
            ]
            for un in lignes
        ],
    )
