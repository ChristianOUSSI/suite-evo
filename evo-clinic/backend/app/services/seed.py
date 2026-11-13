from __future__ import annotations

import random
from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Acte, Organisation, Patient, Paiement, User
from ..security import hash_password
from ..utils import aujourdhui, maintenant, periode_de

RESPONSABLE = {"email": "ada@clinique.cm", "mot_de_passe": "Clinic2026!"}
AGENT = {"email": "mbarga@clinique.cm", "mot_de_passe": "Clinic2026!"}

CLINIQUE = {
    "nom": "Clinique Les Cocotiers",
    "ville": "Douala",
    "quartier": "Akwa",
    "telephone": "+237233456789",
}

NOMS = (
    "Marie-Thérèse", "Jean-Paul", "Grâce", "Alain", "Solange", "Eric",
    "Bertille", "Serge", "Nadège", "Patrice", "Sandrine", "Alain Christian",
    "Murielle", "Didier", "Clarisse", "Yolande", "Ulrich", "Estelle",
    "Gervais", "Ruth", "Jérôme", "Prisca", "Ghislain", "Carine",
    "Alphonse", "Lydie", "Marcel", "Ange", "Thérèse", "François",
)
TELEPHONES = (
    "+237677334455", "+237655667788", "+237699112233", "+237691998877",
    "+237670554433", "+237683221100", "+237660887766", "+237696144322",
)
GROUPES = ("A+", "A+", "O+", "B+", "AB+", "A-", "B-")
SEXES = ("femme", "homme")
MOTIFS = (
    "Consultation générale", "Paludisme", "Hypertension", "Diabète",
    "Fièvre typhoïde", "Fracture", "Grossesse / suivi", "Pédiatrie",
    "Dépistage", "Vaccination", "Douleurs abdominales", "Allergie",
)


def seed_database(db: Session) -> bool:
    """Une clinique garnie pour la démonstration. Faux si le registre existe."""
    if db.scalar(select(func.count(Organisation.id))):
        return False

    alea = random.Random(20_261_114)
    organisation = Organisation(**CLINIQUE)
    db.add(organisation)
    db.flush()

    responsable = User(
        organisation_id=organisation.id,
        nom="Dr Clarisse Ada",
        email=RESPONSABLE["email"],
        mot_de_passe=hash_password(RESPONSABLE["mot_de_passe"]),
        role="responsable",
    )
    agent = User(
        organisation_id=organisation.id,
        nom="Paul Mbarga",
        email=AGENT["email"],
        mot_de_passe=hash_password(AGENT["mot_de_passe"]),
        role="agent",
    )
    db.add_all([responsable, agent])
    db.flush()

    patients = _patients(db, organisation, alea)
    _actes_et_paiements(db, organisation, patients, [responsable, agent], alea)
    db.commit()
    return True


def _patients(db: Session, organisation: Organisation, alea) -> list[Patient]:
    lignes = []
    for i in range(alea.randint(60, 80)):
        nom = alea.choice(NOMS)
        if alea.random() < 0.5:
            nom = f"{nom} {alea.choice(['Grâce', 'Grâce', 'Grâce'])}"
        lignes.append(
            Patient(
                organisation_id=organisation.id,
                nom=nom,
                telephone=alea.choice(TELEPHONES),
                naissance=f"{alea.randint(1950, 2005)}-{alea.randint(1, 12):02d}-{alea.randint(1, 28):02d}",
                sexe=alea.choice(SEXES),
                groupe=alea.choice(GROUPES),
                allergies="pénicilline" if alea.random() < 0.08 else "",
                note="",
            )
        )
    db.add_all(lignes)
    db.flush()
    return lignes


def _actes_et_paiements(
    db: Session,
    organisation: Organisation,
    patients: list[Patient],
    comptes: list[User],
    alea,
) -> None:
    """Sept mois d'actes et d'encaissements, au fil des passages."""
    aujourdhui_d = aujourdhui()
    for patient in patients:
        nb_actes = alea.randint(1, 6)
        for _ in range(nb_actes):
            jour = aujourdhui_d - timedelta(days=alea.randint(0, 210))
            motif = alea.choice(MOTIFS)
            montant = alea.choice([5000, 7500, 10000, 15000, 20000, 25000])
            acte = Acte(
                organisation_id=organisation.id,
                patient_id=patient.id,
                date=jour,
                motif=motif,
                diagnostic=motif if alea.random() > 0.4 else "",
                traitement="" if alea.random() > 0.5 else "Repos, boisson, paracétamol",
                montant=montant,
                cree_par=alea.choice(comptes).id,
                cree_le=maintenant().replace(
                    year=jour.year, month=jour.month, day=jour.day,
                    hour=alea.randint(8, 18), minute=alea.randint(0, 59),
                ),
            )
            db.add(acte)
            db.flush()
            # La plupart paient tout de suite ; certains laissent un reste.
            if alea.random() > 0.25:
                moyen = alea.choice(["especes", "especes", "mtn_money", "orange_money"])
                db.add(
                    Paiement(
                        organisation_id=organisation.id,
                        patient_id=patient.id,
                        acte_id=acte.id if alea.random() > 0.3 else None,
                        montant=montant,
                        moyen=moyen,
                        date=jour,
                        note="",
                        recu=_code_recu(organisation.id, patient.id, jour, alea),
                        cree_par=alea.choice(comptes).id,
                        cree_le=acte.cree_le,
                    )
                )
    db.commit()


def _code_recu(organisation_id: int, patient_id: int, jour, alea) -> str:
    """Un code de reçu stable, sans passer par la base."""
    from ..security import code_de_controle

    sel = alea.randint(0, 999)
    return code_de_controle(organisation_id, patient_id, f"{jour.isoformat()}-{sel}")[:10].upper()
