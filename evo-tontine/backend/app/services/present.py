from __future__ import annotations

"""Ce que l'API rend à l'écran.

Choix assumé, et il change des autres produits de la maison : ici le backend ne
met pas les montants en phrase. Il rend des nombres bruts, des dates ISO et des
clés stables (statut, mode, role). La raison tient en une ligne : le produit
doit être anglais et français, et un label fabriqué côté serveur est une langue
imposée. L'écran formate, avec les règles du Cameroun partagées par tous les
produits CADC.
"""

from ..config import settings
from ..models import Cotisation, Groupe, Membre, Remise, Tour, User
from ..security import code_membre
from ..utils import affiche_telephone, canonise_telephone, operateur


def groupe_dict(groupe: Groupe) -> dict:
    return {
        "id": groupe.id,
        "nom": groupe.nom,
        "ville": groupe.ville,
        "quartier": groupe.quartier,
        "frequence": groupe.frequence,
        "jour_ancre": groupe.jour_ancre,
        "cotisation": groupe.cotisation,
        "penalite": groupe.penalite,
        "telephone": groupe.telephone,
        "telephone_display": affiche_telephone(groupe.telephone),
        "mot_du_groupe": groupe.mot_du_groupe,
        "abonnement_mensuel": groupe.abonnement_mensuel,
        "momo_actif": groupe.momo_actif,
        "orange_actif": groupe.orange_actif,
        "especes_actifs": groupe.especes_actifs,
    }


def compte_dict(compte: User) -> dict:
    return {
        "id": compte.id,
        "nom": compte.nom,
        "email": compte.email,
        "role": compte.role,
    }


def membre_dict(membre: Membre, cotisation: Cotisation | None = None) -> dict:
    du = cotisation.montant_attendu if cotisation else 0
    paye = cotisation.montant_paye if cotisation else 0
    return {
        "id": membre.id,
        "nom": membre.nom,
        "telephone": membre.telephone,
        "telephone_display": affiche_telephone(membre.telephone),
        "operateur": operateur(membre.telephone),
        "joignable": canonise_telephone(membre.telephone) is not None,
        "part": membre.part,
        "actif": membre.actif,
        "entree_le": membre.entree_le.isoformat(),
        "note": membre.note,
        "du": du,
        "paye": paye,
        "reste": max(0, du - paye),
        "penalite": cotisation.penalite if cotisation else 0,
        "payee_le": cotisation.payee_le.isoformat() if cotisation and cotisation.payee_le else None,
        "mode": cotisation.mode if cotisation else "",
        "reference": cotisation.reference if cotisation else "",
        "code": code_membre(membre.id),
        "lien": f"{settings.public_base_url}/membre/{code_membre(membre.id)}",
    }


def tour_dict(tour: Tour | None) -> dict | None:
    if tour is None:
        return None
    rentre = sum(un.montant_paye for un in tour.cotisations)
    du = sum(un.montant_attendu for un in tour.cotisations)
    return {
        "id": tour.id,
        "numero": tour.numero,
        "date_prevue": tour.date_prevue.isoformat(),
        "date_tirage": tour.date_tirage.isoformat() if tour.date_tirage else None,
        "statut": tour.statut,
        "pot": tour.montant_pot,
        "du": du,
        "rentre": rentre,
        "restant": max(0, du - rentre),
        "gagnant": tour.gagnant.nom if tour.gagnant else None,
        "gagnant_id": tour.gagnant_id,
        "graine": tour.graine,
        "note": tour.note,
        "remis": tour.remise is not None,
    }


def remise_dict(remise: Remise) -> dict:
    return {
        "id": remise.id,
        "tour_id": remise.tour_id,
        "numero_tour": remise.tour.numero,
        "membre": remise.membre.nom,
        "membre_id": remise.membre_id,
        "montant": remise.montant,
        "moment": remise.moment.isoformat(),
        "jour": remise.tour.date_prevue.isoformat(),
        "jeton": remise.jeton,
        "temoin": remise.temoin,
        "mode": remise.mode,
        "note": remise.note,
    }


def tour_detail(tour: Tour) -> dict:
    return {
        **tour_dict(tour),
        "cotisations": [
            membre_dict(cotisation.membre, cotisation)
            for cotisation in sorted(tour.cotisations, key=lambda un: un.membre.nom)
        ],
        "remise": remise_dict(tour.remise) if tour.remise else None,
    }
