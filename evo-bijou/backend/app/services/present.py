from __future__ import annotations

"""Ce que l'API rend à l'écran : des nombres, des dates ISO, des clés stables."""

from ..models import Client, Organisation, Piece, User
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


def piece_dict(piece: Piece, public: bool = False) -> dict:
    corps = {
        "id": piece.id,
        "reference": piece.reference,
        "nom": piece.nom,
        "matiere": piece.matiere,
        "poids_grammes": piece.poids_grammes,
        "carat": piece.carat,
        "prix_vente": piece.prix_vente,
        "statut": piece.statut,
        "fournisseur": piece.fournisseur,
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
    else:
        corps.update({
            "date_vente": piece.date_vente.isoformat() if piece.date_vente else None,
        })
    return corps
