from __future__ import annotations

"""Ce que l'API rend à l'écran : des nombres, des dates ISO, des clés stables."""

from ..models import Annonce, Commande, Organisation, User
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


def annonce_dict(annonce: Annonce, detail: bool = False) -> dict:
    commandes = [un for un in annonce.commandes_liste if un.statut != "annulee"]
    corps = {
        "id": annonce.id,
        "titre": annonce.titre,
        "categorie": annonce.categorie,
        "description": annonce.description,
        "prix": annonce.prix,
        "stock": annonce.stock,
        "ville": annonce.ville,
        "quartier": annonce.quartier,
        "statut": annonce.statut,
        "vendeur_nom": annonce.vendeur_nom,
        "vendeur_telephone": annonce.vendeur_telephone,
        "vendeur_telephone_display": affiche_telephone(annonce.vendeur_telephone),
        "vendeur_joignable": canonise_telephone(annonce.vendeur_telephone) is not None,
        "vendeur_operateur": operateur(annonce.vendeur_telephone),
        "note": annonce.note,
        "commandes": len(commandes),
        "vendu": sum(un.quantite for un in commandes),
        "cree_le": annonce.cree_le.isoformat(timespec="seconds"),
    }
    if detail:
        corps["commandes_liste"] = [
            commande_dict(un) for un in sorted(annonce.commandes_liste, key=lambda u: u.date, reverse=True)
        ]
    return corps


def annonce_publique_dict(annonce: Annonce) -> dict:
    """Ce que la page publique montre : l'article, pas le vendeur."""
    return {
        "id": annonce.id,
        "titre": annonce.titre,
        "categorie": annonce.categorie,
        "description": annonce.description,
        "prix": annonce.prix,
        "stock": annonce.stock,
        "ville": annonce.ville,
        "quartier": annonce.quartier,
    }


def commande_dict(commande: Commande) -> dict:
    return {
        "id": commande.id,
        "annonce_id": commande.annonce_id,
        "annonce": commande.annonce.titre if commande.annonce else "",
        "categorie": commande.annonce.categorie if commande.annonce else "",
        "prix_unitaire": commande.annonce.prix if commande.annonce else 0,
        "quantite": commande.quantite,
        "montant": commande.montant,
        "acheteur_nom": commande.acheteur_nom,
        "acheteur_telephone": commande.acheteur_telephone,
        "acheteur_telephone_display": affiche_telephone(commande.acheteur_telephone),
        "acheteur_joignable": canonise_telephone(commande.acheteur_telephone) is not None,
        "acheteur_operateur": operateur(commande.acheteur_telephone),
        "moyen": commande.moyen,
        "statut": commande.statut,
        "date": commande.date.isoformat(),
        "note": commande.note,
        "cree_par": commande.auteur.nom if commande.auteur else "",
        "cree_le": commande.cree_le.isoformat(timespec="seconds"),
    }
