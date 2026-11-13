from __future__ import annotations

"""Ce que l'API rend à l'écran : des nombres, des dates ISO, des clés stables."""

from ..models import Client, Livraison, Organisation, User
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


def client_dict(client: Client) -> dict:
    return {
        "id": client.id,
        "nom": client.nom,
        "telephone": client.telephone,
        "telephone_display": affiche_telephone(client.telephone),
        "telephone_joignable": canonise_telephone(client.telephone) is not None,
        "operateur": operateur(client.telephone),
        "quartier": client.quartier,
        "type": client.type,
        "note": client.note,
        "cree_le": client.cree_le.isoformat(timespec="seconds"),
    }


def livraison_dict(livraison: Livraison, public: bool = False) -> dict:
    corps = {
        "id": livraison.id,
        "client_id": livraison.client_id,
        "client": livraison.client.nom if livraison.client else "",
        "quantite": livraison.quantite,
        "montant": livraison.quantite * livraison.prix_unitaire,
        "statut": livraison.statut,
        "date_commande": livraison.date_commande.isoformat() if livraison.date_commande else None,
        "date_livraison": livraison.date_livraison.isoformat() if livraison.date_livraison else None,
        "adresse": livraison.adresse,
        "note": livraison.note,
        "cree_le": livraison.cree_le.isoformat(timespec="seconds"),
    }
    if not public:
        corps.update({
            "prix_unitaire": livraison.prix_unitaire,
            "telephone": livraison.client.telephone if livraison.client else "",
            "quartier": livraison.client.quartier if livraison.client else "",
        })
    return corps
