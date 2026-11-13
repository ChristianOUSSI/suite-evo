from __future__ import annotations

"""Ce que l'API rend à l'écran : des nombres, des dates ISO, des clés stables.

Aucune phrase fabriquée ici. Un reçu écrit en français par le serveur est
un reçu imposé en français à une réceptionniste anglophone.
"""

from ..models import Acte, Organisation, Patient, Paiement, User
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


def du(patient: Patient) -> int:
    """Ce que le patient doit : les actes non annulés moins les paiements."""
    dus = sum(un.montant for un in patient.actes if not un.annule)
    payes = sum(un.montant for un in patient.paiements if not un.annule)
    return dus - payes


def patient_dict(patient: Patient, detail: bool = False) -> dict:
    corps = {
        "id": patient.id,
        "nom": patient.nom,
        "telephone": patient.telephone,
        "telephone_display": affiche_telephone(patient.telephone),
        "telephone_joignable": canonise_telephone(patient.telephone) is not None,
        "telephone_operateur": operateur(patient.telephone),
        "naissance": patient.naissance,
        "sexe": patient.sexe,
        "groupe": patient.groupe,
        "allergies": patient.allergies,
        "note": patient.note,
        "actif": patient.actif,
        "dus": du(patient),
        "actes": len([un for un in patient.actes if not un.annule]),
        "paiements": len([un for un in patient.paiements if not un.annule]),
    }
    if detail:
        corps["actes_liste"] = [acte_dict(un) for un in sorted(patient.actes, key=lambda u: u.date, reverse=True)]
        corps["paiements_liste"] = [paiement_dict(un) for un in sorted(patient.paiements, key=lambda u: u.date, reverse=True)]
    return corps


def acte_dict(acte: Acte) -> dict:
    return {
        "id": acte.id,
        "patient_id": acte.patient_id,
        "patient": acte.patient.nom,
        "date": acte.date.isoformat(),
        "motif": acte.motif,
        "diagnostic": acte.diagnostic,
        "traitement": acte.traitement,
        "montant": acte.montant,
        "annule": acte.annule,
        "cree_par": acte.auteur.nom if acte.auteur else "",
        "cree_le": acte.cree_le.isoformat(timespec="seconds"),
    }


def paiement_dict(paiement: Paiement) -> dict:
    return {
        "id": paiement.id,
        "patient_id": paiement.patient_id,
        "patient": paiement.patient.nom,
        "acte_id": paiement.acte_id,
        "acte": paiement.acte.motif if paiement.acte else "",
        "montant": paiement.montant,
        "moyen": paiement.moyen,
        "date": paiement.date.isoformat(),
        "note": paiement.note,
        "recu": paiement.recu,
        "annule": paiement.annule,
        "cree_par": paiement.auteur.nom if paiement.auteur else "",
        "cree_le": paiement.cree_le.isoformat(timespec="seconds"),
    }


def recu_dict(paiement: Paiement) -> dict:
    organisation = paiement.organisation
    patient = paiement.patient
    return {
        "valide": not paiement.annule,
        "recu": paiement.recu,
        "clinique": organisation.nom,
        "ville": organisation.ville,
        "quartier": organisation.quartier,
        "patient": patient.nom,
        "telephone": patient.telephone,
        "montant": paiement.montant,
        "moyen": paiement.moyen,
        "date": paiement.date.isoformat(),
        "note": paiement.note,
        "acte": paiement.acte.motif if paiement.acte else "",
    }
