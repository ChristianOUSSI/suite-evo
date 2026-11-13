import csv
from datetime import date, timedelta
from io import StringIO

from fastapi import APIRouter, Query
from fastapi.responses import Response
from sqlalchemy import select

from ..deps import CurrentBoutique, DbSession
from ..models import Depense, Produit, Vente
from ..services import tendance
from ..utils import maintenant

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


@router.get("/exports/ventes.csv")
def ventes(
    boutique: CurrentBoutique,
    db: DbSession,
    jours: int = Query(default=30, ge=1, le=3650),
) -> Response:
    borne = maintenant().date().toordinal() - jours
    lignes = db.scalars(
        select(Vente).where(Vente.boutique_id == boutique.id).order_by(Vente.moment.desc())
    ).all()
    rangees = [
        [
            f"V-{vente.id}",
            vente.jour.isoformat(),
            vente.moment.strftime("%H:%M"),
            vente.produit.nom,
            vente.produit.categorie,
            vente.quantite,
            vente.produit.unite,
            vente.prix_cede,
            vente.prix_cede * vente.quantite,
            vente.cout_unitaire,
            (vente.prix_cede - vente.cout_unitaire) * vente.quantite,
            vente.mode,
            "rayée" if vente.annule else "tenue",
            vente.tenu_par.nom if vente.tenu_par else "",
            "dictee" if vente.dictee else "comptoir",
            vente.brut,
        ]
        for vente in lignes
        if vente.jour.toordinal() >= borne
    ]
    return feuille(
        "kolo-ventes.csv",
        [
            "Repère",
            "Jour",
            "Heure",
            "Article",
            "Catégorie",
            "Quantité",
            "Unité",
            "Prix cédé FCFA",
            "Chiffre FCFA",
            "Coût unitaire FCFA",
            "Bénéfice FCFA",
            "Rail",
            "État",
            "Noté par",
            "Origine",
            "Phrase dictee",
        ],
        rangees,
    )


@router.get("/exports/stock.csv")
def stock(boutique: CurrentBoutique, db: DbSession) -> Response:
    lignes = db.scalars(
        select(Produit)
        .where(Produit.boutique_id == boutique.id, Produit.actif.is_(True))
        .order_by(Produit.categorie, Produit.nom)
    ).all()
    rangees = [
        [
            produit.nom,
            produit.categorie,
            produit.unite,
            produit.prix_achat,
            produit.prix_vente,
            produit.prix_vente - produit.prix_achat,
            produit.stock,
            produit.alerte_stock,
            "à racheter" if produit.stock <= produit.alerte_stock else "ok",
            produit.stock * produit.prix_achat,
            produit.mots_cles,
        ]
        for produit in lignes
    ]
    return feuille(
        "kolo-stock.csv",
        [
            "Article",
            "Catégorie",
            "Unité",
            "Coût moyen FCFA",
            "Prix vente FCFA",
            "Marge unitaire FCFA",
            "Stock",
            "Seuil alerte",
            "État",
            "Valeur réserve FCFA",
            "Mots dictés",
        ],
        rangees,
    )


@router.get("/exports/journees.csv")
def journees(
    boutique: CurrentBoutique,
    db: DbSession,
    jours: int = Query(default=30, ge=1, le=365),
) -> Response:
    rangees = []
    today = date.today()
    for decalage in range(jours):
        jour = today - timedelta(days=decalage)
        etat = tendance.journee(db, boutique.id, jour)
        rangees.append(
            [
                jour.isoformat(),
                etat["ventes"],
                etat["chiffre"],
                etat["cout"],
                etat["benefice"],
                etat["depenses"],
                etat["benefice_net"],
                etat["marge"],
                etat["ticket_moyen"],
                etat["especes_jour"],
            ]
        )
    return feuille(
        "kolo-journees.csv",
        [
            "Jour",
            "Ventes",
            "Chiffre FCFA",
            "Coût FCFA",
            "Bénéfice brut FCFA",
            "Dépenses FCFA",
            "Bénéfice net FCFA",
            "Marge %",
            "Ticket moyen FCFA",
            "Espèces du jour FCFA",
        ],
        rangees,
    )


@router.get("/exports/depenses.csv")
def depenses(
    boutique: CurrentBoutique,
    db: DbSession,
    jours: int = Query(default=30, ge=1, le=3650),
) -> Response:
    borne = maintenant().date().toordinal() - jours
    lignes = db.scalars(
        select(Depense)
        .where(Depense.boutique_id == boutique.id)
        .order_by(Depense.jour.desc(), Depense.id.desc())
    ).all()
    rangees = [
        [
            ligne.jour.isoformat(),
            ligne.categorie,
            ligne.libelle,
            ligne.montant,
            ligne.note,
        ]
        for ligne in lignes
        if ligne.jour.toordinal() >= borne
    ]
    return feuille(
        "kolo-depenses.csv",
        ["Jour", "Catégorie", "Libellé", "Montant FCFA", "Note"],
        rangees,
    )
