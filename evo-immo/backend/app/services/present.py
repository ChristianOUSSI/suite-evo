from __future__ import annotations

"""Ce que l'API rend à l'écran : des nombres, des dates ISO, des clés stables.

Aucune phrase fabriquée ici. Un statut écrit en français par le serveur est
un statut imposé en français à un agent anglophone.
"""

from ..models import Bien, Demande, Organisation, User, Visite
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


def bien_dict(bien: Bien, detail: bool = False) -> dict:
    corps = {
        "id": bien.id,
        "type": bien.type,
        "titre": bien.titre or _titre_par_defaut(bien),
        "ville": bien.ville,
        "quartier": bien.quartier,
        "prix": bien.prix,
        "surface_m2": bien.surface_m2,
        "chambres": bien.chambres,
        "description": bien.description,
        "statut": bien.statut,
        "proprietaire_nom": bien.proprietaire_nom,
        "proprietaire_telephone": bien.proprietaire_telephone,
        "proprietaire_telephone_display": affiche_telephone(bien.proprietaire_telephone),
        "proprietaire_joignable": canonise_telephone(bien.proprietaire_telephone) is not None,
        "proprietaire_operateur": operateur(bien.proprietaire_telephone),
        "agent_id": bien.agent_id,
        "agent": bien.agent.nom if bien.agent else "",
        "note": bien.note,
        "visites": len(bien.visites),
        "demandes": len(bien.demandes),
        "cree_le": bien.cree_le.isoformat(timespec="seconds"),
    }
    if detail:
        corps["visites_liste"] = [
            visite_dict(un) for un in sorted(bien.visites, key=lambda u: (u.date, u.heure), reverse=True)
        ]
        corps["demandes_liste"] = [
            demande_dict(un) for un in sorted(bien.demandes, key=lambda u: u.date, reverse=True)
        ]
    return corps


def _titre_par_defaut(bien: Bien) -> str:
    lieu = bien.quartier or bien.ville
    return f"{bien.type.capitalize()} — {lieu}".strip(" —")


def annonce_dict(bien: Bien) -> dict:
    """Ce que la page publique montre : le bien, pas le propriétaire."""
    return {
        "id": bien.id,
        "type": bien.type,
        "titre": bien.titre or _titre_par_defaut(bien),
        "ville": bien.ville,
        "quartier": bien.quartier,
        "prix": bien.prix,
        "surface_m2": bien.surface_m2,
        "chambres": bien.chambres,
        "description": bien.description,
        "statut": bien.statut,
    }


def demande_dict(demande: Demande) -> dict:
    return {
        "id": demande.id,
        "bien_id": demande.bien_id,
        "bien": demande.bien.titre or _titre_par_defaut(demande.bien) if demande.bien else "",
        "client_nom": demande.client_nom,
        "client_telephone": demande.client_telephone,
        "client_telephone_display": affiche_telephone(demande.client_telephone),
        "client_joignable": canonise_telephone(demande.client_telephone) is not None,
        "client_operateur": operateur(demande.client_telephone),
        "canal": demande.canal,
        "message": demande.message,
        "statut": demande.statut,
        "note": demande.note,
        "date": demande.date.isoformat(),
        "cree_par": demande.auteur.nom if demande.auteur else "",
        "cree_le": demande.cree_le.isoformat(timespec="seconds"),
    }


def visite_dict(visite: Visite) -> dict:
    return {
        "id": visite.id,
        "bien_id": visite.bien_id,
        "bien": visite.bien.titre or _titre_par_defaut(visite.bien),
        "type": visite.bien.type,
        "quartier": visite.bien.quartier,
        "date": visite.date.isoformat(),
        "heure": visite.heure,
        "client_nom": visite.client_nom,
        "client_telephone": visite.client_telephone,
        "client_telephone_display": affiche_telephone(visite.client_telephone),
        "client_joignable": canonise_telephone(visite.client_telephone) is not None,
        "issue": visite.issue,
        "note": visite.note,
        "cree_par": visite.auteur.nom if visite.auteur else "",
        "cree_le": visite.cree_le.isoformat(timespec="seconds"),
    }
