from __future__ import annotations

"""La caisse : le stock qui descend, le ticket qui se fige.

Trois règles :

1. Le prix unitaire se fige à la vente, pas à l'article. Changer le prix de
   vente demain ne réécrit pas le ticket d'aujourd'hui.
2. Le stock baisse à la vente validée et remonte à l'annulation - jamais à
   l'édition d'un prix ou d'un nom.
3. Une vente ne peut pas vendre ce qu'il n'y a pas : le contrôle se fait à
   l'écriture, pas à l'affichage.
"""

from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..messages import refus
from ..models import LigneVente, Organisation, Produit, User, Vente
from ..messages import refus
from ..utils import aujourdhui


def produit_de(db: Session, organisation: Organisation, produit_id: int) -> Produit:
    produit = db.get(Produit, produit_id)
    if produit is None or produit.organisation_id != organisation.id:
        raise refus("produit_inconnu", 404)
    return produit


def vente_de(db: Session, organisation: Organisation, vente_id: int) -> Vente:
    vente = db.get(Vente, vente_id)
    if vente is None or vente.organisation_id != organisation.id:
        raise refus("vente_inconnue", 404)
    return vente


def vendre(db: Session, organisation: Organisation, entree, compte: User) -> Vente:
    """Un ticket : ses lignes, son total, son stock qui descend."""
    if not entree.lignes:
        raise refus("saisie")

    produits = {}
    for ligne in entree.lignes:
        produit = produit_de(db, organisation, ligne.produit_id)
        if not produit.actif:
            raise refus("produit_inconnu", 404)
        if produit.stock < ligne.quantite:
            if produit.stock == 0:
                raise refus("produit_epuise")
            raise refus("stock_insuffisant")
        produits[produit.id] = (produit, ligne.quantite)

    vente = Vente(
        organisation_id=organisation.id,
        client_nom=entree.client_nom.strip(),
        note=entree.note.strip(),
        cree_par=compte.id,
    )
    db.add(vente)
    db.flush()

    total = 0
    for produit_id, (produit, quantite) in produits.items():
        db.add(
            LigneVente(
                vente_id=vente.id,
                produit_id=produit_id,
                quantite=quantite,
                prix_unitaire=produit.prix_vente,
            )
        )
        produit.stock -= quantite
        total += quantite * produit.prix_vente

    vente.total = total
    db.commit()
    db.refresh(vente)
    return vente


def annuler_vente(
    db: Session, organisation: Organisation, vente_id: int, note: str, compte: User
) -> Vente:
    """Annuler rend le stock et garde la trace : le ticket ne s'efface pas."""
    vente = vente_de(db, organisation, vente_id)
    if vente.statut == "annulee":
        raise refus("vente_deja_annulee", 409)
    for ligne in vente.lignes:
        ligne.produit.stock += ligne.quantite
    vente.statut = "annulee"
    if note.strip():
        vente.note = (vente.note + " · " + note.strip()).strip(" ·")
    db.commit()
    db.refresh(vente)
    return vente


def reapprovisionner(
    db: Session, organisation: Organisation, produit_id: int, quantite: int, note: str
) -> Produit:
    produit = produit_de(db, organisation, produit_id)
    produit.stock += quantite
    if note.strip():
        produit.note = (produit.note + " · " + note.strip()).strip(" ·")
    db.commit()
    db.refresh(produit)
    return produit


def etat(db: Session, organisation: Organisation) -> dict:
    """La vitre de la caisse : ce qui manque, ce que la journée a fait."""
    ce_jour = aujourdhui()
    produits = db.scalars(
        select(Produit).where(
            Produit.organisation_id == organisation.id, Produit.actif.is_(True)
        )
    ).all()
    ventes = db.scalars(
        select(Vente).where(
            Vente.organisation_id == organisation.id,
            Vente.statut == "validee",
        )
    ).all()
    du_jour = [
        un for un in ventes if un.cree_le.date() == ce_jour
    ]
    return {
        "jour": ce_jour.isoformat(),
        "produits": len(produits),
        "ruptures": sum(1 for un in produits if un.stock == 0),
        "alertes": sum(
            1 for un in produits if 0 < un.stock <= un.seuil_alerte
        ),
        "ventes_du_jour": len(du_jour),
        "ca_du_jour": sum(un.total for un in du_jour),
        "ca_total": sum(un.total for un in ventes),
    }


def liste_ventes(
    db: Session, organisation: Organisation, limite: int = 200
) -> list[dict]:
    from .present import vente_dict

    ventes = db.scalars(
        select(Vente)
        .where(Vente.organisation_id == organisation.id)
        .order_by(Vente.cree_le.desc())
        .limit(limite)
    ).all()
    return [vente_dict(un) for un in ventes]


def recap(db: Session, organisation: Organisation, periode: str) -> dict:
    """Le mois de la boutique : CA, quantités, marge estimée."""
    import re as _re

    if not _re.match(r"^\d{4}-(0[1-9]|1[0-2])$", periode or ""):
        raise refus("periode_inconnue")
    annee, mois = (int(un) for un in periode.split("-"))
    debut = date(annee, mois, 1)
    if mois == 12:
        fin = date(annee + 1, 1, 1)
    else:
        fin = date(annee, mois + 1, 1)

    ventes = db.scalars(
        select(Vente).where(
            Vente.organisation_id == organisation.id,
            Vente.statut == "validee",
        )
    ).all()
    dans_le_mois = [
        un for un in ventes if debut <= un.cree_le.date() < fin
    ]

    par_produit: dict[int, dict] = {}
    ca = 0
    marge = 0
    for vente in dans_le_mois:
        ca += vente.total
        for ligne in vente.lignes:
            cle = ligne.produit_id
            if cle not in par_produit:
                par_produit[cle] = {
                    "produit_id": cle,
                    "nom": ligne.produit.nom,
                    "unite": ligne.produit.unite,
                    "quantite": 0,
                    "montant": 0,
                    "cout": 0,
                }
            par_produit[cle]["quantite"] += ligne.quantite
            par_produit[cle]["montant"] += ligne.quantite * ligne.prix_unitaire
            par_produit[cle]["cout"] += (
                ligne.quantite * ligne.produit.prix_achat
            )
    for un in par_produit.values():
        un["marge"] = un["montant"] - un["cout"]
        marge += un["marge"]

    return {
        "periode": periode,
        "ventes": len(dans_le_mois),
        "ca": ca,
        "marge": marge,
        "par_produit": sorted(
            par_produit.values(), key=lambda un: -un["montant"]
        ),
    }
