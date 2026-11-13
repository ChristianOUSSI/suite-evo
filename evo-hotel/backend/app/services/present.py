from __future__ import annotations

"""Ce que l'API rend à l'écran : des nombres, des dates ISO, des clés stables.

Aucune phrase fabriquée ici. Un séjour écrit en français par le serveur est
un séjour imposé en français à une réception anglophone.
"""

from datetime import date

from ..models import Chambre, Client, Organisation, Sejour, User
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


def chambre_dict(chambre: Chambre) -> dict:
    return {
        "id": chambre.id,
        "numero": chambre.numero,
        "type": chambre.type,
        "prix_par_nuit": chambre.prix_par_nuit,
        "capacite": chambre.capacite,
        "actif": chambre.actif,
        "note": chambre.note,
        "sejours": len(chambre.sejours),
    }


def client_dict(client: Client) -> dict:
    return {
        "id": client.id,
        "nom": client.nom,
        "telephone": client.telephone,
        "telephone_display": affiche_telephone(client.telephone),
        "operateur": operateur(client.telephone),
        "joignable": canonise_telephone(client.telephone) is not None,
        "piece": client.piece,
        "actif": client.actif,
        "note": client.note,
        "sejours": len(client.sejours),
    }


def nuits(arrivee: date, depart: date) -> int:
    return max(0, (depart - arrivee).days)


def sejour_dict(sejour: Sejour) -> dict:
    """Un séjour, avec ses nuits recalculées et son montant estimé."""
    nb_nuits = nuits(sejour.arrivee, sejour.depart)
    return {
        "id": sejour.id,
        "chambre_id": sejour.chambre_id,
        "chambre": sejour.chambre.numero,
        "chambre_type": sejour.chambre.type,
        "client_id": sejour.client_id,
        "client": sejour.client.nom,
        "client_telephone": sejour.client.telephone,
        "arrivee": sejour.arrivee.isoformat(),
        "depart": sejour.depart.isoformat(),
        "nuits": nb_nuits,
        "montant": nb_nuits * sejour.chambre.prix_par_nuit,
        "statut": sejour.statut,
        "note": sejour.note,
        "cree_par": sejour.auteur.nom if sejour.auteur else "",
        "cree_le": sejour.cree_le.isoformat(timespec="seconds"),
    }
