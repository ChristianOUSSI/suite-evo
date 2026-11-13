import csv
from io import StringIO

from fastapi import APIRouter, Query
from fastapi.responses import Response
from sqlalchemy import select

from ..deps import GroupeCourant, DbSession
from ..models import Cotisation, Remise, Tour
from ..utils import affiche_telephone, maintenant

router = APIRouter(tags=["feuilles"])


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


@router.get("/exports/tours.csv")
def tours(
    groupe: GroupeCourant,
    db: DbSession,
    tours_max: int = Query(default=36, ge=1, le=400),
) -> Response:
    lignes = db.scalars(
        select(Tour)
        .where(Tour.groupe_id == groupe.id)
        .order_by(Tour.numero.desc())
        .limit(tours_max)
    ).all()
    rangees = []
    for tour in lignes:
        rentre = sum(un.montant_paye for un in tour.cotisations)
        du = sum(un.montant_attendu for un in tour.cotisations)
        rangees.append(
            [
                tour.numero,
                tour.date_prevue.isoformat(),
                tour.statut,
                du,
                rentre,
                max(0, du - rentre),
                tour.gagnant.nom if tour.gagnant else "",
                tour.remise.montant if tour.remise else 0,
                tour.remise.temoin if tour.remise else "",
                tour.graine,
            ]
        )
    return feuille(
        "evo-tontine-tours.csv",
        [
            "Tour",
            "Date prevue",
            "Statut",
            "Du FCFA",
            "Rentre FCFA",
            "Restant FCFA",
            "Gagnant",
            "Pot remis FCFA",
            "Temoin",
            "Graine du tirage",
        ],
        rangees,
    )


@router.get("/exports/cotisations.csv")
def cotisations(
    groupe: GroupeCourant,
    db: DbSession,
    jours: int = Query(default=180, ge=1, le=3650),
) -> Response:
    borne = maintenant().date().toordinal() - jours
    lignes = db.scalars(
        select(Cotisation)
        .join(Tour)
        .where(Tour.groupe_id == groupe.id)
        .order_by(Tour.numero.desc())
    ).all()
    rangees = []
    for cotisation in lignes:
        if cotisation.tour.date_prevue.toordinal() < borne:
            continue
        membre = cotisation.membre
        rangees.append(
            [
                cotisation.tour.numero,
                cotisation.tour.date_prevue.isoformat(),
                membre.nom,
                affiche_telephone(membre.telephone),
                membre.part,
                cotisation.montant_attendu,
                cotisation.montant_paye,
                max(0, cotisation.montant_attendu - cotisation.montant_paye),
                cotisation.payee_le.isoformat() if cotisation.payee_le else "",
                (
                    max(0, (cotisation.payee_le - cotisation.tour.date_prevue).days)
                    if cotisation.payee_le
                    else ""
                ),
                cotisation.penalite,
                cotisation.mode,
                cotisation.reference,
            ]
        )
    return feuille(
        "evo-tontine-cotisations.csv",
        [
            "Tour",
            "Date prevue",
            "Membre",
            "Telephone",
            "Parts",
            "Du FCFA",
            "Paye FCFA",
            "Reste FCFA",
            "Paye le",
            "Retard jours",
            "Penalite FCFA",
            "Rail",
            "Reference",
        ],
        rangees,
    )


@router.get("/exports/remises.csv")
def remises(groupe: GroupeCourant, db: DbSession) -> Response:
    lignes = db.scalars(
        select(Remise)
        .where(Remise.groupe_id == groupe.id)
        .order_by(Remise.id.desc())
    ).all()
    rangees = [
        [
            remise.tour.numero,
            remise.tour.date_prevue.isoformat(),
            remise.membre.nom,
            remise.montant,
            remise.mode,
            remise.temoin,
            remise.jeton,
            remise.moment.isoformat(),
        ]
        for remise in lignes
    ]
    return feuille(
        "evo-tontine-remises.csv",
        [
            "Tour",
            "Date",
            "Recipiendaire",
            "Montant FCFA",
            "Rail",
            "Temoin",
            "Jeton de verification",
            "Moment",
        ],
        rangees,
    )
