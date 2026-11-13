import csv
from io import StringIO

from fastapi import APIRouter, Query
from fastapi.responses import Response
from sqlalchemy import select

from ..deps import DbSession, OrganisationCourante
from ..models import LigneVente, Produit, Vente
from ..services import present, shop
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


@router.get("/exports/produits.csv")
def produits(organisation: OrganisationCourante, db: DbSession) -> Response:
    lignes = db.scalars(
        select(Produit).where(Produit.organisation_id == organisation.id).order_by(Produit.nom)
    ).all()
    return feuille(
        "shop-produits.csv",
        ["id", "nom", "unite", "prix_achat", "prix_vente", "stock", "seuil_alerte", "actif", "note"],
        [
            [
                un.id, un.nom, un.unite, un.prix_achat, un.prix_vente,
                un.stock, un.seuil_alerte, 1 if un.actif else 0, un.note,
            ]
            for un in lignes
        ],
    )


@router.get("/exports/ventes.csv")
def ventes(
    organisation: OrganisationCourante,
    db: DbSession,
    limite: int = Query(default=5000, ge=1, le=20000),
) -> Response:
    lignes = db.scalars(
        select(Vente)
        .where(Vente.organisation_id == organisation.id)
        .order_by(Vente.cree_le.desc())
        .limit(limite)
    ).all()
    rangees = []
    for vente in lignes:
        for ligne in vente.lignes:
            rangees.append([
                vente.id,
                vente.cree_le.isoformat(timespec="seconds"),
                ligne.produit.nom,
                ligne.quantite,
                ligne.prix_unitaire,
                ligne.quantite * ligne.prix_unitaire,
                vente.client_nom,
                vente.statut,
                vente.note,
            ])
    return feuille(
        "shop-ventes.csv",
        ["ticket", "date", "article", "quantite", "prix_unitaire", "montant", "client", "statut", "note"],
        rangees,
    )
