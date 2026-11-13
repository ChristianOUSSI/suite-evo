from __future__ import annotations

"""Ce que l'API rend à l'écran : des nombres, des dates ISO, des clés stables."""

from ..models import Client, Organisation, Piece, User, Voiture
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
        "type": client.type,
        "note": client.note,
        "cree_le": client.cree_le.isoformat(timespec="seconds"),
    }


def voiture_dict(voiture: Voiture, public: bool = False) -> dict:
    corps = {
        "id": voiture.id,
        "marque": voiture.marque,
        "modele": voiture.modele,
        "annee": voiture.annee,
        "kilometrage": voiture.kilometrage,
        "carburant": voiture.carburant,
        "boite": voiture.boite,
        "prix": voiture.prix,
        "statut": voiture.statut,
        "note": voiture.note,
        "cree_le": voiture.cree_le.isoformat(timespec="seconds"),
    }
    if not public:
        corps.update({
            "client_id": voiture.client_id,
            "client": voiture.client.nom if voiture.client else "",
            "date_vente": voiture.date_vente.isoformat() if voiture.date_vente else None,
        })
    return corps


def piece_dict(piece: Piece, public: bool = False) -> dict:
    corps = {
        "id": piece.id,
        "reference": piece.reference,
        "designation": piece.designation,
        "compatibilite": piece.compatibilite,
        "stock": piece.stock,
        "prix_vente": piece.prix_vente,
        "statut": piece.statut,
        "quantite_vendue": piece.quantite_vendue,
        "note": piece.note,
        "cree_le": piece.cree_le.isoformat(timespec="seconds"),
    }
    if not public:
        corps.update({
            "prix_achat": piece.prix_achat,
            "client_id": piece.client_id,
            "client": piece.client.nom if piece.client else "",
            "date_vente": piece.date_vente.isoformat() if piece.date_vente else None,
        })
    return corps
