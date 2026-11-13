from __future__ import annotations

"""Ce que l'API rend à l'écran : des nombres, des dates ISO, des clés stables.

Aucune phrase fabriquée ici. Un reçu écrit en français par le serveur est
un reçu imposé en français à une caissière anglophone.
"""

from ..models import Classe, Eleve, Organisation, User, Versement
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


def classe_dict(classe: Classe, eleves: int = 0) -> dict:
    return {
        "id": classe.id,
        "nom": classe.nom,
        "titulaire": classe.titulaire,
        "frais_annuels": classe.frais_annuels,
        "actif": classe.actif,
        "note": classe.note,
        "eleves": eleves if eleves else len(classe.eleves),
    }


def verse(versement: Versement) -> int:
    """Le total payé par l'élève, hors versements annulés."""
    return sum(un.montant for un in versement.eleve.versements if not un.annule)


def eleve_dict(eleve: Eleve) -> dict:
    paye = sum(un.montant for un in eleve.versements if not un.annule)
    return {
        "id": eleve.id,
        "classe_id": eleve.classe_id,
        "classe": eleve.classe.nom,
        "nom": eleve.nom,
        "matricule": eleve.matricule,
        "parent_nom": eleve.parent_nom,
        "parent_telephone": eleve.parent_telephone,
        "parent_telephone_display": affiche_telephone(eleve.parent_telephone),
        "parent_joignable": canonise_telephone(eleve.parent_telephone) is not None,
        "parent_operateur": operateur(eleve.parent_telephone),
        "frais_attendu": eleve.frais_attendu,
        "paye": paye,
        "reste": max(0, eleve.frais_attendu - paye),
        "solde": eleve.frais_attendu - paye,
        "actif": eleve.actif,
        "note": eleve.note,
        "versements": len([un for un in eleve.versements if not un.annule]),
    }


def versement_dict(versement: Versement) -> dict:
    return {
        "id": versement.id,
        "eleve_id": versement.eleve_id,
        "eleve": versement.eleve.nom,
        "classe": versement.eleve.classe.nom,
        "montant": versement.montant,
        "moyen": versement.moyen,
        "date": versement.date.isoformat(),
        "periode": versement.periode,
        "note": versement.note,
        "recu": versement.recu,
        "annule": versement.annule,
        "cree_par": versement.auteur.nom if versement.auteur else "",
        "cree_le": versement.cree_le.isoformat(timespec="seconds"),
    }
