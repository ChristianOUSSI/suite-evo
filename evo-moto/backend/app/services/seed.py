from __future__ import annotations

import random
from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Client, Moto, Organisation, Reparation, User
from ..security import hash_password
from ..utils import aujourdhui, maintenant, periode_de

RESPONSABLE = {"email": "ada@moto.cm", "mot_de_passe": "Moto2026!"}
AGENT = {"email": "mbarga@moto.cm", "mot_de_passe": "Moto2026!"}

GARAGE = {
    "nom": "Garage Horizon Motos",
    "ville": "Douala",
    "quartier": "Akwa",
    "telephone": "+237699887766",
}

CLIENTS = [
    ("Nathalie Eyenga", "particulier"),
    ("Serge Ndongo", "entreprise"),
    ("Prisca Talla", "particulier"),
    ("Ulrich Mvondo", "livreur"),
    ("Sandrine Biya", "particulier"),
    ("Jérôme Ateba", "entreprise"),
    ("Murielle Fotso", "particulier"),
    ("Didier Kamga", "livreur"),
    ("Alphonse Ekwalla", "particulier"),
    ("Lydie Ngono", "entreprise"),
]
TELEPHONES = (
    "+237677334455", "+237655667788", "+237699112233", "+237691998877",
    "+237670554433", "+237683221100", "+237660887766", "+237696144322",
    "+237677889900", "+237655112233",
)

# marque, modele, annee, km, couleur, prix
MOTOS = [
    ("Yamaha", "YBR 125", 2021, 18500, "Noir", 750000),
    ("Yamaha", "FZ 150", 2020, 24000, "Rouge", 980000),
    ("Honda", "CB 125", 2019, 31000, "Bleu", 820000),
    ("Honda", "CBR 250R", 2022, 9200, "Rouge/Noir", 1450000),
    ("TVS", "Apache RTR 160", 2021, 16800, "Jaune", 1150000),
    ("TVS", "Star City", 2018, 42000, "Gris", 620000),
    ("Suzuki", "Gixxer 150", 2020, 27600, "Bleu", 1050000),
    ("Kawasaki", "Ninja 300", 2017, 35500, "Vert", 2100000),
    ("Bajaj", "Pulsar 150", 2022, 12400, "Noir", 880000),
    ("Bajaj", "Boxer BM 100", 2019, 38000, "Bleu", 520000),
    ("Hero", "Splendor Plus", 2021, 22000, "Noir/Rouge", 580000),
    ("Bera", "BR 150", 2020, 29900, "Bleu", 680000),
    ("Yamaha", "Crypton 110", 2021, 19500, "Gris", 720000),
    ("Honda", "Wave 110", 2018, 44800, "Bleu", 450000),
    ("TVS", "NTorq 125", 2023, 5400, "Noir", 1350000),
    ("Suzuki", "Address 110", 2021, 21300, "Rouge", 700000),
    ("KTM", "Duke 200", 2020, 28900, "Orange", 2800000),
    ("Bajaj", "Dominar 400", 2021, 17200, "Rouge", 3400000),
    ("Vespa", "Primavera 125", 2019, 24600, "Crème", 3900000),
]

PANNE = (
    "Vidange et filtre à huile",
    "Plaquettes de frein avant",
    "Pneus à changer (l'un crevé)",
    "Courroie de distribution",
    "Ampoule et clignotant cassés",
    "Démarrage difficile, batterie faible",
    "Kit d'embrayage",
    "Alignement des roues",
)
TRAVAUX = (
    "Vidange complète, contrôle niveaux",
    "Remplacement plaquettes, purge du circuit",
    "Montage de deux pneus neufs",
    "Changement courroie et galets",
    "Remplacement ampoule et réglage clignotant",
    "Test batterie, recharge si possible",
    "Remplacement kit complet, rodage",
    "Réglage parallèle avant et arrière",
)


def seed_database(db: Session) -> bool:
    if db.scalar(select(func.count(Organisation.id))):
        return False

    alea = random.Random(20_261_114)
    organisation = Organisation(**GARAGE)
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

    _motos(db, organisation, clients, alea)
    _reparations(db, organisation, clients, alea)
    db.commit()
    return True


def _motos(db: Session, organisation: Organisation, clients: list[Client], alea) -> None:
    aujourdhui_d = aujourdhui()
    for marque, modele, annee, km, couleur, prix in MOTOS:
        statut = alea.choices(["en_vente", "reserve", "vendu", "retire"], weights=[50, 15, 28, 7])[0]
        client = alea.choice(clients) if statut == "vendu" else (alea.choice(clients) if statut == "reserve" and alea.random() > 0.5 else None)
        date_vente = (
            aujourdhui_d - timedelta(days=alea.randint(1, 60))
            if statut == "vendu"
            else None
        )
        db.add(
            Moto(
                organisation_id=organisation.id,
                marque=marque,
                modele=modele,
                annee=annee,
                kilometrage=km + alea.randint(0, 3000),
                couleur=couleur,
                prix=prix + alea.randint(-80000, 80000),
                statut=statut,
                client_id=client.id if client else None,
                date_vente=date_vente,
                note="",
                cree_le=maintenant().replace(
                    year=annee, month=alea.randint(1, 12), day=alea.randint(1, 28),
                    hour=alea.randint(8, 18), minute=alea.randint(0, 59),
                ),
            )
        )
    db.flush()


def _reparations(db: Session, organisation: Organisation, clients: list[Client], alea) -> None:
    aujourdhui_d = aujourdhui()
    motos = db.scalars(
        select(Moto).where(Moto.organisation_id == organisation.id)
    ).all()
    for i in range(14):
        client = alea.choice(clients)
        moto = alea.choice(motos) if alea.random() > 0.4 else None
        statut = alea.choices(["recue", "en_cours", "terminee", "livree"], weights=[20, 30, 20, 30])[0]
        reception = aujourdhui_d - timedelta(days=alea.randint(0, 21))
        livraison = (
            reception + timedelta(days=alea.randint(1, 5))
            if statut in ("terminee", "livree")
            else None
        )
        main_oeuvre = alea.randint(5000, 45000)
        pieces = alea.randint(0, 60000) if alea.random() > 0.3 else 0
        db.add(
            Reparation(
                organisation_id=organisation.id,
                client_id=client.id,
                moto_id=moto.id if moto else None,
                immatriculation=f"LT-{alea.randint(1000, 9999)}-{alea.choice('ABCDEFGH')}" if alea.random() > 0.4 else "",
                panne=PANNE[i % len(PANNE)],
                travaux=TRAVAUX[i % len(TRAVAUX)],
                cout_main_oeuvre=main_oeuvre,
                cout_pieces=pieces,
                statut=statut,
                date_reception=reception,
                date_livraison=livraison,
                note="",
                cree_le=maintenant().replace(
                    hour=alea.randint(8, 17), minute=alea.randint(0, 59), second=0,
                ),
            )
        )
    db.commit()
