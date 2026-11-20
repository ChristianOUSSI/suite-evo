from __future__ import annotations

"""Ce que l'API rend à l'écran : des nombres, des dates ISO, des clés stables."""

from ..models import Demande, Client, Organisation, User, Vehicule
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


def vehicule_dict(vehicule: Vehicule) -> dict:
    return {
        "id": vehicule.id,
        "marque": vehicule.marque,
        "modele": vehicule.modele,
        "annee": vehicule.annee,
        "kilometrage": vehicule.kilometrage,
        "carburant": vehicule.carburant,
        "boite": vehicule.boite,
        "prix": vehicule.prix,
        "statut": vehicule.statut,
        "client_id": vehicule.client_id,
        "client": vehicule.client.nom if vehicule.client else "",
        "date_vente": vehicule.date_vente.isoformat() if vehicule.date_vente else None,
        "note": vehicule.note,
        "cree_le": vehicule.cree_le.isoformat(timespec="seconds"),
    }


def vehicule_publique_dict(vehicule: Vehicule) -> dict:
    """Ce que le catalogue montre : la fiche du véhicule, jamais le client
    ni le statut interne."""
    return {
        "id": vehicule.id,
        "marque": vehicule.marque,
        "modele": vehicule.modele,
        "annee": vehicule.annee,
        "kilometrage": vehicule.kilometrage,
        "carburant": vehicule.carburant,
        "boite": vehicule.boite,
        "prix": vehicule.prix,
        "statut": vehicule.statut,
        "note": vehicule.note,
    }


def demande_dict(demande: Demande) -> dict:
    """La demande publique, pour l'écran interne."""
    return {
        "id": demande.id,
        "vehicule_id": demande.vehicule_id,
        "vehicule": f"{demande.vehicule.marque} {demande.vehicule.modele} {demande.vehicule.annee}" if demande.vehicule else "",
        "client_nom": demande.client_nom,
        "client_telephone": demande.client_telephone,
        "telephone_display": affiche_telephone(demande.client_telephone),
        "note": demande.note,
        "statut": demande.statut,
        "cree_le": demande.cree_le.isoformat() if demande.cree_le else "",
        "traite_le": demande.traite_le.isoformat() if demande.traite_le else None,
    }
