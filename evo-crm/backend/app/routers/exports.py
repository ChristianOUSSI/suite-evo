import csv
from datetime import timedelta
from io import StringIO

from fastapi import APIRouter, Query
from fastapi.responses import Response
from sqlalchemy import select

from ..deps import DbSession, EntrepriseCourante
from ..models import Client, Echange, Relance
from ..utils import affiche_telephone, maintenant

router = APIRouter(tags=["feuilles"])

# Les entêtes reprennent les clés du contrat d'API, pas une phrase : un
# comptable de Douala comme un cabinet anglophone ouvrent la même feuille.


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


@router.get("/exports/clients.csv")
def clients(
    entreprise: EntrepriseCourante,
    db: DbSession,
    actifs_seuls: bool = Query(default=False),
) -> Response:
    lignes = db.scalars(
        select(Client)
        .where(Client.entreprise_id == entreprise.id)
        .order_by(Client.nom)
    ).all()
    rangees = [
        [
            un.id,
            un.nom,
            un.telephone,
            affiche_telephone(un.telephone),
            un.quartier,
            un.segment,
            1 if un.actif else 0,
            un.cree_le.isoformat(),
            len(un.echanges),
            max((e.moment.date().isoformat() for e in un.echanges), default=""),
        ]
        for un in lignes
        if not actifs_seuls or un.actif
    ]
    return feuille(
        "carnet-clients.csv",
        [
            "id",
            "nom",
            "telephone",
            "telephone_affiche",
            "quartier",
            "segment",
            "actif",
            "cree_le",
            "echanges",
            "dernier_jour",
        ],
        rangees,
    )


@router.get("/exports/echanges.csv")
def echanges(
    entreprise: EntrepriseCourante,
    db: DbSession,
    jours: int = Query(default=90, ge=1, le=730),
) -> Response:
    lignes = db.scalars(
        select(Echange)
        .join(Client, Echange.client_id == Client.id)
        .where(
            Client.entreprise_id == entreprise.id,
            Echange.moment >= maintenant() - timedelta(days=jours),
        )
        .order_by(Echange.moment.desc())
        .limit(5000)
    ).all()
    rangees = [
        [
            un.client.nom,
            un.client.telephone,
            un.type,
            un.moment.date().isoformat(),
            un.moment.strftime("%H:%M"),
            un.montant,
            un.user.nom if un.user else "",
            un.note,
        ]
        for un in lignes
    ]
    return feuille(
        "carnet-journal.csv",
        [
            "client",
            "telephone",
            "type",
            "jour",
            "heure",
            "montant",
            "par",
            "note",
        ],
        rangees,
    )


@router.get("/exports/relances.csv")
def relances(
    entreprise: EntrepriseCourante,
    db: DbSession,
    faites: bool = Query(default=True),
) -> Response:
    lignes = db.scalars(
        select(Relance)
        .join(Client, Relance.client_id == Client.id)
        .where(Client.entreprise_id == entreprise.id)
        .order_by(Relance.due_le)
    ).all()
    rangees = [
        [
            un.client.nom,
            un.client.telephone,
            un.motif,
            un.origine,
            un.due_le.isoformat(),
            un.statut,
            un.faite_le.isoformat() if un.faite_le else "",
            un.note,
        ]
        for un in lignes
        if faites or un.statut == "a_faire"
    ]
    return feuille(
        "carnet-relances.csv",
        [
            "client",
            "telephone",
            "motif",
            "origine",
            "due_le",
            "statut",
            "faite_le",
            "note",
        ],
        rangees,
    )
