from __future__ import annotations

"""Le registre de la clinique : qui a été vu, combien ça a coûté, qui a payé.

Trois règles :

1. Le prix de l'acte se fige à l'écriture. Le reste du patient se calcule à
   la lecture : somme des actes non annulés − somme des paiements non annulés.
2. Chaque paiement porte un code de reçu unique, dérivé d'un secret serveur :
   il ne se devine pas, il ne se forge pas, il ne livre que le paiement
   qu'il désigne — ni les autres patients, ni les autres actes.
3. Annuler un acte ou un paiement ne l'efface pas : il garde sa ligne, le
   reste remonte tout seul. On ne réécrit pas le passé.
"""

import re
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..messages import refus
from ..models import Acte, Organisation, Patient, Paiement, User
from ..schemas import ActeEntree, PaiementEntree
from ..security import code_de_controle
from ..utils import aujourdhui, periode_de


def patient_de(db: Session, organisation: Organisation, patient_id: int) -> Patient:
    patient = db.get(Patient, patient_id)
    if patient is None or patient.organisation_id != organisation.id:
        raise refus("patient_inconnu", 404)
    return patient


def acte_de(db: Session, organisation: Organisation, acte_id: int) -> Acte:
    acte = db.get(Acte, acte_id)
    if acte is None or acte.organisation_id != organisation.id:
        raise refus("acte_inconnu", 404)
    return acte


def paiement_de(db: Session, organisation: Organisation, paiement_id: int) -> Paiement:
    paiement = db.get(Paiement, paiement_id)
    if paiement is None or paiement.organisation_id != organisation.id:
        raise refus("paiement_inconnu", 404)
    return paiement


def _recu_libre(db: Session, organisation_id: int, patient_id: int, jour: date) -> str:
    """Un code de reçu unique, tiré du secret serveur."""
    for tentative in range(20):
        code = code_de_controle(
            organisation_id, patient_id, f"{jour.isoformat()}-{tentative}"
        )[:10].upper()
        pris = db.scalar(
            select(Paiement.id).where(
                Paiement.organisation_id == organisation_id,
                Paiement.recu == code,
            )
        )
        if pris is None:
            return code
    raise refus("saisie")


def consulter(db: Session, organisation: Organisation, entree: ActeEntree, compte: User) -> Acte:
    """Un acte : le motif, le diagnostic, le traitement, le prix figé."""
    patient = patient_de(db, organisation, entree.patient_id)
    if not patient.actif:
        raise refus("patient_inconnu", 404)
    jour = entree.date or aujourdhui()
    if jour > aujourdhui():
        raise refus("saisie", date="le jour")

    acte = Acte(
        organisation_id=organisation.id,
        patient_id=patient.id,
        date=jour,
        motif=entree.motif.strip(),
        diagnostic=entree.diagnostic.strip(),
        traitement=entree.traitement.strip(),
        montant=entree.montant,
        cree_par=compte.id,
    )
    db.add(acte)
    db.commit()
    db.refresh(acte)
    return acte


def annuler_acte(db: Session, organisation: Organisation, acte_id: int) -> Acte:
    acte = acte_de(db, organisation, acte_id)
    if acte.annule:
        raise refus("acte_annule", 409)
    acte.annule = True
    db.commit()
    db.refresh(acte)
    return acte


def encaisser(db: Session, organisation: Organisation, entree: PaiementEntree, compte: User) -> Paiement:
    """Un paiement : son montant, son moyen, son reçu qui prouve."""
    patient = patient_de(db, organisation, entree.patient_id)
    if not patient.actif:
        raise refus("patient_inconnu", 404)
    if entree.acte_id is not None:
        acte = acte_de(db, organisation, entree.acte_id)
        if acte.annule or acte.patient_id != patient.id:
            raise refus("acte_inconnu", 404)
    jour = entree.date or aujourdhui()
    if jour > aujourdhui():
        raise refus("saisie", date="le jour")

    paiement = Paiement(
        organisation_id=organisation.id,
        patient_id=patient.id,
        acte_id=entree.acte_id,
        montant=entree.montant,
        moyen=entree.moyen,
        date=jour,
        note=entree.note.strip(),
        recu=_recu_libre(db, organisation.id, patient.id, jour),
        cree_par=compte.id,
    )
    db.add(paiement)
    db.commit()
    db.refresh(paiement)
    return paiement


def annuler_paiement(
    db: Session, organisation: Organisation, paiement_id: int, note: str
) -> Paiement:
    paiement = paiement_de(db, organisation, paiement_id)
    if paiement.annule:
        raise refus("paiement_annule", 409)
    paiement.annule = True
    if note.strip():
        paiement.note = (paiement.note + " · " + note.strip()).strip(" ·")
    db.commit()
    db.refresh(paiement)
    return paiement


def recu_par_code(db: Session, code: str) -> Paiement | None:
    """Le reçu public : un code, un paiement, rien d'autre."""
    code = (code or "").strip().upper()
    if not code:
        return None
    return db.scalar(
        select(Paiement).where(Paiement.recu == code, Paiement.annule.is_(False))
    )


def etat(db: Session, organisation: Organisation) -> dict:
    """La vitre de l'accueil : qui est passé, ce que le mois a encaissé."""
    ce_mois = periode_de(aujourdhui())
    patients = db.scalars(
        select(Patient).where(
            Patient.organisation_id == organisation.id, Patient.actif.is_(True)
        )
    ).all()
    actes = db.scalars(
        select(Acte).where(
            Acte.organisation_id == organisation.id, Acte.annule.is_(False)
        )
    ).all()
    paiements = db.scalars(
        select(Paiement).where(
            Paiement.organisation_id == organisation.id,
            Paiement.annule.is_(False),
        )
    ).all()
    du_mois = [un for un in paiements if periode_de(un.date) == ce_mois]
    return {
        "jour": aujourdhui().isoformat(),
        "periode": ce_mois,
        "patients": len(patients),
        "actes_mois": sum(1 for un in actes if periode_de(un.date) == ce_mois),
        "encaisses": len(du_mois),
        "ca_mois": sum(un.montant for un in du_mois),
        "ca_total": sum(un.montant for un in paiements),
        "dus_total": sum(un.montant for un in actes) - sum(un.montant for un in paiements),
    }


def liste_patients(
    db: Session,
    organisation: Organisation,
    seulement_detteurs: bool = False,
) -> list[dict]:
    from .present import du, patient_dict

    patients = db.scalars(
        select(Patient)
        .where(Patient.organisation_id == organisation.id)
        .order_by(Patient.nom)
    ).all()
    resultats = [patient_dict(un) for un in patients]
    if seulement_detteurs:
        resultats = [un for un in resultats if un["dus"] > 0]
    return resultats


def fiche_patient(db: Session, organisation: Organisation, patient_id: int) -> dict:
    from .present import patient_dict

    return patient_dict(patient_de(db, organisation, patient_id), detail=True)


def liste_actes(
    db: Session,
    organisation: Organisation,
    patient_id: int | None = None,
    periode: str | None = None,
    limite: int = 500,
) -> list[dict]:
    from .present import acte_dict

    requete = (
        select(Acte)
        .where(Acte.organisation_id == organisation.id)
        .order_by(Acte.date.desc(), Acte.id.desc())
        .limit(limite)
    )
    if patient_id is not None:
        requete = requete.where(Acte.patient_id == patient_id)
    if periode:
        actes = [un for un in db.scalars(requete).all() if periode_de(un.date) == periode]
        return [acte_dict(un) for un in actes]
    return [acte_dict(un) for un in db.scalars(requete).all()]


def liste_paiements(
    db: Session,
    organisation: Organisation,
    patient_id: int | None = None,
    periode: str | None = None,
    limite: int = 500,
) -> list[dict]:
    from .present import paiement_dict

    requete = (
        select(Paiement)
        .where(Paiement.organisation_id == organisation.id)
        .order_by(Paiement.date.desc(), Paiement.id.desc())
        .limit(limite)
    )
    if patient_id is not None:
        requete = requete.where(Paiement.patient_id == patient_id)
    if periode:
        paiements = [un for un in db.scalars(requete).all() if periode_de(un.date) == periode]
        return [paiement_dict(un) for un in paiements]
    return [paiement_dict(un) for un in db.scalars(requete).all()]


def recap(db: Session, organisation: Organisation, periode: str) -> dict:
    """Le mois de la clinique : encaissé, actes, ce qui reste dû."""
    if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", periode or ""):
        raise refus("periode_inconnue")

    actes = db.scalars(
        select(Acte).where(
            Acte.organisation_id == organisation.id, Acte.annule.is_(False)
        )
    ).all()
    paiements = db.scalars(
        select(Paiement).where(
            Paiement.organisation_id == organisation.id,
            Paiement.annule.is_(False),
        )
    ).all()
    du_mois = [un for un in paiements if periode_de(un.date) == periode]
    actes_mois = [un for un in actes if periode_de(un.date) == periode]
    patients = db.scalars(
        select(Patient).where(
            Patient.organisation_id == organisation.id, Patient.actif.is_(True)
        )
    ).all()

    par_motif: dict[str, dict] = {}
    for un in actes_mois:
        cle = un.motif or "—"
        if cle not in par_motif:
            par_motif[cle] = {"motif": cle, "actes": 0, "montant": 0}
        par_motif[cle]["actes"] += 1
        par_motif[cle]["montant"] += un.montant

    par_patient = []
    for un in patients:
        dus = sum(a.montant for a in un.actes if not a.annule) - sum(
            p.montant for p in un.paiements if not p.annule
        )
        if dus > 0:
            par_patient.append({"patient_id": un.id, "nom": un.nom, "dus": dus})

    return {
        "periode": periode,
        "actes": len(actes_mois),
        "montant_actes": sum(un.montant for un in actes_mois),
        "paiements": len(du_mois),
        "encaisses": sum(un.montant for un in du_mois),
        "dus_total": sum(un.montant for un in actes) - sum(un.montant for un in paiements),
        "par_motif": sorted(par_motif.values(), key=lambda un: -un["montant"]),
        "par_patient": sorted(par_patient, key=lambda un: -un["dus"])[:30],
    }
