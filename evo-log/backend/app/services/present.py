from __future__ import annotations

"""Ce que l'API rend à l'écran : des nombres, des dates ISO, des clés stables.

Aucune phrase fabriquée ici. Un statut écrit en français par le serveur est
un statut imposé en français à un agent anglophone.
"""

from ..models import Colis, Organisation, User
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


def colis_dict(colis: Colis) -> dict:
    return {
        "id": colis.id,
        "numero": colis.numero,
        "genre": colis.genre,
        "description": colis.description,
        "poids_kg": colis.poids_kg,
        "expediteur_nom": colis.expediteur_nom,
        "expediteur_telephone": colis.expediteur_telephone,
        "expediteur_telephone_display": affiche_telephone(colis.expediteur_telephone),
        "destinataire_nom": colis.destinataire_nom,
        "destinataire_telephone": colis.destinataire_telephone,
        "destinataire_telephone_display": affiche_telephone(colis.destinataire_telephone),
        "destinataire_joignable": canonise_telephone(colis.destinataire_telephone) is not None,
        "destinataire_operateur": operateur(colis.destinataire_telephone),
        "depart": colis.depart,
        "arrivee": colis.arrivee,
        "frais": colis.frais,
        "moyen": colis.moyen,
        "statut": colis.statut,
        "date_depot": colis.date_depot.isoformat(),
        "date_livraison": colis.date_livraison.isoformat() if colis.date_livraison else None,
        "note": colis.note,
        "agent": colis.agent.nom if colis.agent else "",
        "cree_par": colis.auteur.nom if colis.auteur else "",
        "cree_le": colis.cree_le.isoformat(timespec="seconds"),
    }


def suivi_dict(colis: Colis) -> dict:
    """Ce que le destinataire voit : le colis, pas les agents."""
    return {
        "numero": colis.numero,
        "genre": colis.genre,
        "description": colis.description,
        "depart": colis.depart,
        "arrivee": colis.arrivee,
        "statut": colis.statut,
        "date_depot": colis.date_depot.isoformat(),
        "date_livraison": colis.date_livraison.isoformat() if colis.date_livraison else None,
        "transporteur": colis.organisation.nom,
        "ville": colis.organisation.ville,
        "telephone": colis.organisation.telephone,
        "telephone_display": affiche_telephone(colis.organisation.telephone),
    }
