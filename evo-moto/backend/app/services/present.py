from __future__ import annotations

"""Ce que l'API rend à l'écran : des nombres, des dates ISO, des clés stables."""

from ..models import Client, Moto, Organisation, Reparation, User
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


def moto_dict(moto: Moto, public: bool = False) -> dict:
    corps = {
        "id": moto.id,
        "marque": moto.marque,
        "modele": moto.modele,
        "annee": moto.annee,
        "kilometrage": moto.kilometrage,
        "couleur": moto.couleur,
        "prix": moto.prix,
        "statut": moto.statut,
        "note": moto.note,
        "cree_le": moto.cree_le.isoformat(timespec="seconds"),
    }
    if not public:
        corps.update({
            "client_id": moto.client_id,
            "client": moto.client.nom if moto.client else "",
            "date_vente": moto.date_vente.isoformat() if moto.date_vente else None,
        })
    return corps


def reparation_dict(un: Reparation) -> dict:
    return {
        "id": un.id,
        "client_id": un.client_id,
        "client": un.client.nom if un.client else "",
        "moto_id": un.moto_id,
        "moto": f"{un.moto.marque} {un.moto.modele}" if un.moto else "",
        "immatriculation": un.immatriculation,
        "panne": un.panne,
        "travaux": un.travaux,
        "cout_main_oeuvre": un.cout_main_oeuvre,
        "cout_pieces": un.cout_pieces,
        "cout_total": un.cout_main_oeuvre + un.cout_pieces,
        "statut": un.statut,
        "date_reception": un.date_reception.isoformat() if un.date_reception else None,
        "date_livraison": un.date_livraison.isoformat() if un.date_livraison else None,
        "note": un.note,
        "cree_le": un.cree_le.isoformat(timespec="seconds"),
    }
