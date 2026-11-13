from __future__ import annotations

import random
from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Client, Organisation, User, Vehicule
from ..security import hash_password
from ..utils import aujourdhui, maintenant, periode_de

RESPONSABLE = {"email": "ada@auto.cm", "mot_de_passe": "Auto2026!"}
AGENT = {"email": "mbarga@auto.cm", "mot_de_passe": "Auto2026!"}

CONCESSIONNAIRE = {
    "nom": "Parc Horizon Motors",
    "ville": "Douala",
    "quartier": "Akwa",
    "telephone": "+237699887766",
}

CLIENTS = [
    ("Nathalie Eyenga", "particulier"),
    ("Serge Ndongo", "entreprise"),
    ("Prisca Talla", "particulier"),
    ("Ulrich Mvondo", "garage"),
    ("Sandrine Biya", "particulier"),
    ("Jérôme Ateba", "entreprise"),
    ("Murielle Fotso", "particulier"),
    ("Didier Kamga", "garage"),
    ("Alphonse Ekwalla", "particulier"),
    ("Lydie Ngono", "entreprise"),
]
TELEPHONES = (
    "+237677334455", "+237655667788", "+237699112233", "+237691998877",
    "+237670554433", "+237683221100", "+237660887766", "+237696144322",
    "+237677889900", "+237655112233",
)

VEHICULES = [
    ("Toyota", "Corolla", 2019, 62000, "essence", "automatique", 4850000),
    ("Toyota", "Land Cruiser", 2018, 98000, "diesel", "automatique", 12500000),
    ("Toyota", "Hilux", 2021, 45000, "diesel", "manuelle", 9800000),
    ("Honda", "CR-V", 2020, 55000, "essence", "automatique", 7200000),
    ("Honda", "Civic", 2017, 88000, "essence", "automatique", 3900000),
    ("Nissan", "Patrol", 2016, 120000, "essence", "automatique", 8900000),
    ("Nissan", "Navara", 2019, 74000, "diesel", "manuelle", 6400000),
    ("Hyundai", "Tucson", 2021, 38000, "essence", "automatique", 6800000),
    ("Hyundai", "Santa Fe", 2018, 81000, "diesel", "automatique", 7800000),
    ("Ford", "Ranger", 2020, 66000, "diesel", "manuelle", 8500000),
    ("Kia", "Sportage", 2019, 71000, "essence", "automatique", 5200000),
    ("Mercedes", "Classe C", 2017, 95000, "diesel", "automatique", 9800000),
    ("BMW", "Série 3", 2018, 89000, "essence", "automatique", 9200000),
    ("Volkswagen", "Golf", 2016, 102000, "essence", "manuelle", 2800000),
    ("Peugeot", "3008", 2020, 59000, "diesel", "automatique", 6400000),
    ("Renault", "Duster", 2019, 76000, "essence", "manuelle", 3600000),
    ("Suzuki", "Vitara", 2018, 83000, "essence", "automatique", 4500000),
    ("Mitsubishi", "Pajero", 2015, 115000, "diesel", "manuelle", 5800000),
    ("Isuzu", "D-Max", 2021, 42000, "diesel", "manuelle", 7600000),
]
NOTES = ("", "", "", "Véhicule de fonction, carnet à jour.", "Première main, garantie restante.", "Reprise concession, contrôle technique fait.", "", "")


def seed_database(db: Session) -> bool:
    if db.scalar(select(func.count(Organisation.id))):
        return False

    alea = random.Random(20_261_115)
    organisation = Organisation(**CONCESSIONNAIRE)
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

    clients = []
    for nom, type_ in CLIENTS:
        clients.append(
            Client(
                organisation_id=organisation.id,
                nom=nom,
                telephone=alea.choice(TELEPHONES),
                type=type_,
                note="",
            )
        )
    db.add_all(clients)
    db.flush()

    _vehicules(db, organisation, clients, alea)
    db.commit()
    return True


def _vehicules(db: Session, organisation: Organisation, clients: list[Client], alea) -> None:
    aujourdhui_d = aujourdhui()
    for marque, modele, annee, km, carburant, boite, prix in VEHICULES:
        statut = alea.choices(["en_vente", "reserve", "vendu", "retire"], weights=[55, 15, 25, 5])[0]
        client = alea.choice(clients) if statut == "vendu" else (alea.choice(clients) if statut == "reserve" and alea.random() > 0.5 else None)
        date_vente = (
            aujourdhui_d - timedelta(days=alea.randint(1, 60))
            if statut == "vendu"
            else None
        )
        db.add(
            Vehicule(
                organisation_id=organisation.id,
                marque=marque,
                modele=modele,
                annee=annee,
                kilometrage=km + alea.randint(0, 4000),
                carburant=carburant,
                boite=boite,
                prix=prix + alea.randint(-150000, 150000),
                statut=statut,
                client_id=client.id if client else None,
                date_vente=date_vente,
                note=alea.choice(NOTES),
                cree_le=maintenant().replace(
                    year=annee, month=alea.randint(1, 12), day=alea.randint(1, 28),
                    hour=alea.randint(8, 18), minute=alea.randint(0, 59),
                ),
            )
        )
    db.commit()
