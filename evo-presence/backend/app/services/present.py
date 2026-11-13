from __future__ import annotations

"""Ce que l'API rend à l'écran : des nombres, des dates ISO, des clés stables.

Aucune phrase fabriquée ici. Un bulletin écrit en français par le serveur est
un bulletin imposé en français à un employé anglophone.
"""

from ..models import Employe, Organisation, Presence, User
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


def employe_dict(employe: Employe) -> dict:
    return {
        "id": employe.id,
        "nom": employe.nom,
        "telephone": employe.telephone,
        "telephone_display": affiche_telephone(employe.telephone),
        "operateur": operateur(employe.telephone),
        "joignable": canonise_telephone(employe.telephone) is not None,
        "service": employe.service,
        "actif": employe.actif,
        "entree_le": employe.entree_le.isoformat(),
        "note": employe.note,
        "pointages": len(employe.pointages),
    }


def presence_dict(ligne: Presence) -> dict:
    return {
        "id": ligne.id,
        "employe_id": ligne.employe_id,
        "employe": ligne.employe.nom,
        "service": ligne.employe.service,
        "jour": ligne.jour.isoformat(),
        "statut": ligne.statut,
        "arrivee": ligne.arrivee,
        "depart": ligne.depart,
        "note": ligne.note,
        "pointe_par": ligne.pointe_par,
        "pointe_le": ligne.pointe_le.isoformat(),
        "par": ligne.pointeur.nom if ligne.pointeur else "",
    }
