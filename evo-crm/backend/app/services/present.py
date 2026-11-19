"""Ce que l'API rend à l'écran.

Comme dans toute la maison à partir d'ici : des nombres bruts, des dates ISO
et des clés stables. Pas de phrase fabriquée côté serveur, parce qu'une
phrase fabriquée côté serveur est une langue imposée. L'écran formate, avec
les règles du Cameroun partagées par tous les produits CADC.
"""

from __future__ import annotations

from datetime import date

from ..models import Client, Echange, Entreprise, Relance, User
from ..utils import affiche_telephone, aujourdhui, canonise_telephone, jours_depuis, operateur


def entreprise_dict(entreprise: Entreprise) -> dict:
    return {
        "id": entreprise.id,
        "nom": entreprise.nom,
        "ville": entreprise.ville,
        "quartier": entreprise.quartier,
        "secteur": entreprise.secteur,
        "telephone": entreprise.telephone,
        "telephone_display": affiche_telephone(entreprise.telephone),
        "silence_jours": entreprise.silence_jours,
        "rappel_jours": entreprise.rappel_jours,
        "abonnement_mensuel": entreprise.abonnement_mensuel,
    }


def compte_dict(compte: User) -> dict:
    return {
        "id": compte.id,
        "nom": compte.nom,
        "email": compte.email,
        "role": compte.role,
    }


def _dernier(client: Client) -> Echange | None:
    if not client.echanges:
        return None
    return max(client.echanges, key=lambda un: un.moment)


def _relance_en_attente(client: Client) -> Relance | None:
    dues = [un for un in client.relances if un.statut == "a_faire"]
    if not dues:
        return None
    return min(dues, key=lambda un: un.due_le)


def client_dict(client: Client, ce_jour: date | None = None) -> dict:
    dernier = _dernier(client)
    relance = _relance_en_attente(client)
    return {
        "id": client.id,
        "nom": client.nom,
        "telephone": client.telephone,
        "telephone_display": affiche_telephone(client.telephone),
        "operateur": operateur(client.telephone),
        "joignable": canonise_telephone(client.telephone) is not None,
        "email": client.email,
        "quartier": client.quartier,
        "segment": client.segment,
        "note": client.note,
        "actif": client.actif,
        "cree_le": client.cree_le.isoformat(),
        "echanges": len(client.echanges),
        "dernier_type": dernier.type if dernier else None,
        "dernier_moment": dernier.moment.isoformat() if dernier else None,
        "derniers_jours": jours_depuis(
            dernier.moment.date() if dernier else None, ce_jour
        ),
        "relance": relance_dict(relance, ce_jour) if relance else None,
    }


def echange_dict(echange: Echange) -> dict:
    return {
        "id": echange.id,
        "client_id": echange.client_id,
        "type": echange.type,
        "note": echange.note,
        "moment": echange.moment.isoformat(),
        "jour": echange.moment.date().isoformat(),
        "montant": echange.montant,
        "par": echange.user.nom if echange.user else "",
    }


def relance_dict(relance: Relance, ce_jour: date | None = None) -> dict:
    hoje = ce_jour or aujourdhui()
    retard = max(0, (hoje - relance.due_le).days) if relance.statut == "a_faire" else 0
    return {
        "id": relance.id,
        "client_id": relance.client_id,
        "client": relance.client.nom,
        "telephone": relance.client.telephone,
        "motif": relance.motif,
        "origine": relance.origine,
        "due_le": relance.due_le.isoformat(),
        "statut": relance.statut,
        "faite_le": relance.faite_le.isoformat() if relance.faite_le else None,
        "retard": retard,
        "note": relance.note,
    }


def fiche_dict(client: Client, ce_jour: date | None = None) -> dict:
    return {
        **client_dict(client, ce_jour),
        "historique": [echange_dict(un) for un in _tries(client.echanges)],
        "relances": [
            relance_dict(un, ce_jour) for un in _tries_relances(client.relances)
        ],
    }


def _tries(echanges: list[Echange]) -> list[Echange]:
    return sorted(echanges, key=lambda un: un.moment, reverse=True)


def _tries_relances(relances: list[Relance]) -> list[Relance]:
    return sorted(relances, key=lambda un: (un.statut != "a_faire", un.due_le))
