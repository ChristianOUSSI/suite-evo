from __future__ import annotations

"""Ce que l'API rend à l'écran : des nombres, des dates ISO, des clés stables."""

from ..models import CommandeVocale, Organisation, User
from ..utils import affiche_telephone


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


def commande_dict(commande: CommandeVocale) -> dict:
    return {
        "id": commande.id,
        "transcription": commande.transcription,
        "intention": commande.intention,
        "statut": commande.statut,
        "resultat": commande.resultat,
        "auteur": commande.auteur,
        "cree_le": commande.cree_le.isoformat(timespec="seconds"),
        "maj_le": commande.maj_le.isoformat(timespec="seconds") if commande.maj_le else None,
    }
