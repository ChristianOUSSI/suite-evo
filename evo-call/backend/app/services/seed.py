from __future__ import annotations

import random
from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Appel, Organisation, User
from ..security import hash_password
from ..utils import aujourdhui, maintenant, periode_de

RESPONSABLE = {"email": "ada@call.cm", "mot_de_passe": "Call2026!"}
AGENT = {"email": "mbarga@call.cm", "mot_de_passe": "Call2026!"}

CENTRE = {
    "nom": "Standard Horizon",
    "ville": "Douala",
    "quartier": "Bonanjo",
    "telephone": "+237233445566",
}

CLIENTS = ("Nathalie Eyenga", "Serge Ndongo", "Prisca Talla", "Ulrich Mvondo", "Sandrine Biya", "Jérôme Ateba", "Murielle Fotso", "Didier Kamga", "Alphonse Ekwalla", "Lydie Ngono", "", "")
TELEPHONES = (
    "+237677334455", "+237655667788", "+237699112233", "+237691998877",
    "+237670554433", "+237683221100", "+237660887766", "+237696144322",
    "", "",
)
MOTIFS = ("vente", "sav", "renseignement", "plainte", "rappel", "prospection", "autre")
STATUTS = ("en_file", "en_cours", "termine", "sans_reponse", "rappel", "annule")
NOTES = ("", "", "", "Client pressé, rappeler avant 17h.", "Problème de facturation réglé.", "Demande de catalogue envoyée.", "Rappel programmé demain matin.", "")


def seed_database(db: Session) -> bool:
    if db.scalar(select(func.count(Organisation.id))):
        return False

    alea = random.Random(20_261_114)
    organisation = Organisation(**CENTRE)
    db.add(organisation)
    db.flush()

    responsable = User(
        organisation_id=organisation.id,
        nom="Clarisse Ada",
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

    _appels(db, organisation, [responsable, agent], alea)
    db.commit()
    return True


def _appels(db: Session, organisation: Organisation, comptes: list[User], alea) -> None:
    aujourdhui_d = aujourdhui()
    for _ in range(alea.randint(45, 65)):
        jour = aujourdhui_d - timedelta(days=alea.randint(0, 45))
        statut = alea.choices(STATUTS, weights=[12, 8, 55, 12, 8, 5])[0]
        sens = alea.choices(["entrant", "sortant"], weights=[70, 30])[0]
        agent = alea.choice(comptes) if statut in ("en_cours", "termine") and alea.random() > 0.3 else None
        duree = alea.randint(30, 900) if statut == "termine" else alea.choice([0, 0, alea.randint(10, 120)])
        db.add(
            Appel(
                organisation_id=organisation.id,
                client_nom=alea.choice(CLIENTS),
                client_telephone=alea.choice(TELEPHONES),
                sens=sens,
                motif=alea.choice(MOTIFS),
                statut=statut,
                agent_id=agent.id if agent else None,
                duree_secondes=duree,
                date=jour,
                heure_appel=maintenant().replace(
                    year=jour.year, month=jour.month, day=jour.day,
                    hour=alea.randint(8, 19), minute=alea.randint(0, 59),
                ) if statut in ("en_cours", "termine") else None,
                date_rappel=jour + timedelta(days=alea.randint(1, 5)) if statut == "rappel" else None,
                note=alea.choice(NOTES),
                cree_par=alea.choice(comptes).id,
                cree_le=maintenant().replace(
                    year=jour.year, month=jour.month, day=jour.day,
                    hour=alea.randint(8, 19), minute=alea.randint(0, 59),
                ),
            )
        )
    db.commit()
