from __future__ import annotations

"""Ce que l'API rend à l'écran : des nombres, des dates ISO, des clés stables."""

from ..models import Client, Envoi, Organisation, Suivi, User
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


def suivi_dict(ligne: Suivi) -> dict:
    return {
        "id": ligne.id,
        "statut": ligne.statut,
        "note": ligne.note,
        "cree_le": ligne.cree_le.isoformat(timespec="seconds"),
    }


def envoi_dict(envoi: Envoi, public: bool = False) -> dict:
    corps = {
        "id": envoi.id,
        "numero_suivi": envoi.numero_suivi,
        "description": envoi.description,
        "mode": envoi.mode,
        "expéditeur_nom": envoi.expéditeur_nom,
        "expéditeur_pays": envoi.expéditeur_pays,
        "destinataire_nom": envoi.destinataire_nom,
        "destinataire_ville": envoi.destinataire_ville,
        "poids_kg": envoi.poids_kg,
        "valeur_declaree": envoi.valeur_declaree,
        "frais": envoi.frais,
        "statut": envoi.statut,
        "client_id": envoi.client_id,
        "client": envoi.client.nom if envoi.client else "",
        "date_envoi": envoi.date_envoi.isoformat(),
        "date_livraison": envoi.date_livraison.isoformat() if envoi.date_livraison else None,
        "note": envoi.note,
        "cree_le": envoi.cree_le.isoformat(timespec="seconds"),
        "suivi": [suivi_dict(un) for un in envoi.suivi],
    }
    if public:
        # La page publique ne montre ni le client interne ni les frais
        # de marge : le destinataire lit le parcours, pas la compta.
        corps.pop("client_id", None)
        corps.pop("client", None)
        corps.pop("frais", None)
        corps["expéditeur_nom"] = envoi.expéditeur_nom or ""
    return corps
