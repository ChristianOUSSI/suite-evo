from __future__ import annotations

"""Ce que l'API rend à l'écran : des nombres, des dates ISO, des clés stables.

Aucune phrase fabriquée ici. Un ticket écrit en français par le serveur est
un ticket imposé en français à une caissière anglophone.
"""

from ..models import LigneVente, Organisation, Produit, User, Vente
from ..utils import affiche_telephone, canonise_telephone, operateur


def organisation_dict(organisation: Organisation) -> dict:
    return {
        "id": organisation.id,
        "nom": organisation.nom,
        "ville": organisation.ville,
        "quartier": organisation.quartier,
        "telephone": organisation.telephone,
        "telephone_display": affiche_telephone(organisation.telephone),
    }


def compte_dict(compte: User) -> dict:
    return {"id": compte.id, "nom": compte.nom, "email": compte.email, "role": compte.role}


def produit_dict(produit: Produit) -> dict:
    return {
        "id": produit.id,
        "nom": produit.nom,
        "unite": produit.unite,
        "prix_achat": produit.prix_achat,
        "prix_vente": produit.prix_vente,
        "stock": produit.stock,
        "seuil_alerte": produit.seuil_alerte,
        "alerte": produit.stock <= produit.seuil_alerte,
        "actif": produit.actif,
        "note": produit.note,
        "ventes": len(produit.lignes),
    }


def ligne_dict(ligne: LigneVente) -> dict:
    return {
        "produit_id": ligne.produit_id,
        "nom": ligne.produit.nom,
        "unite": ligne.produit.unite,
        "quantite": ligne.quantite,
        "prix_unitaire": ligne.prix_unitaire,
        "montant": ligne.quantite * ligne.prix_unitaire,
    }


def vente_dict(vente: Vente) -> dict:
    return {
        "id": vente.id,
        "client_nom": vente.client_nom,
        "total": vente.total,
        "statut": vente.statut,
        "note": vente.note,
        "cree_par": vente.auteur.nom if vente.auteur else "",
        "cree_le": vente.cree_le.isoformat(timespec="seconds"),
        "lignes": [ligne_dict(un) for un in vente.lignes],
    }
