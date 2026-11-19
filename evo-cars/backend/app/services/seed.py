from __future__ import annotations

"""La démo du garage : voitures, pièces, clients - déterministe, jamais en prod."""

import random
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Client, Organisation, Piece, User, Voiture
from ..security import hash_password
from ..utils import aujourdhui

RESPONSABLE = {"email": "ada@garage.cm", "mot_de_passe": "Cars2026!"}
AGENT = {"email": "mbarga@garage.cm", "mot_de_passe": "Cars2026!"}

MARQUES = [
    ("Toyota", "Hilux", 2019, 45000),
    ("Toyota", "Corolla", 2015, 15000),
    ("Honda", "CR-V", 2020, 68000),
    ("Honda", "Civic", 2016, 12000),
    ("Nissan", "Patrol", 2018, 95000),
    ("Nissan", "X-Trail", 2019, 52000),
    ("Mazda", "CX-5", 2021, 38000),
    ("Ford", "Ranger", 2017, 72000),
    ("Volkswagen", "Polo", 2018, 22000),
    ("Toyota", "Prado", 2019, 81000),
    ("Isuzu", "D-Max", 2020, 40000),
    ("Toyota", "Land Cruiser", 2016, 115000),
    ("Mercedes-Benz", "Sprinter", 2019, 55000),
    ("Toyota", "Coaster", 2015, 88000),
    ("Hyundai", "Tucson", 2020, 41000),
]

PIECES = [
    ("Filtre à huile", "Toyota Hilux / Land Cruiser", 12, 4500, 8500),
    ("Filtre à air", "Honda CR-V / Toyota Corolla", 18, 6200, 11000),
    ("Plaquettes de frein avant", "Nissan Patrol", 6, 18500, 28000),
    ("Ampoule de phare H4", "Tous véhicules", 40, 1200, 2500),
    ("Pneumatici 265/65R17", "Toyota Hilux / Nissan Patrol", 8, 45000, 65000),
    ("Batterie 12V 70Ah", "Tous véhicules", 5, 85000, 120000),
    ("Courroie de distribution", "Toyota Corolla / Honda Civic", 4, 22000, 35000),
    ("Suspension avant complète", "Toyota Land Cruiser", 2, 185000, 260000),
    ("Alternateur", "Nissan X-Trail", 3, 75000, 105000),
    ("Démarreur", "Toyota Hilux", 2, 92000, 130000),
]

CLIENTS = [
    ("Jean-Paul Mbarga", "+237699112233", "entreprise"),
    ("Femme de ménage grace", "+237677554433", "particulier"),
    ("Garage Auto Union Douala", "+237655998877", "garage"),
    ("Jacques Essomba", "+237690223344", "particulier"),
    ("Transport Douala-Bafoussam", "+237688776655", "entreprise"),
    ("Rosine Mbe", "+237676665544", "particulier"),
    ("BTP Nord Cameroun", "+237672211009", "entreprise"),
    ("Rodrigue Biya", "+237699887766", "particulier"),
    ("Garage Central Yaoundé", "+237655443322", "garage"),
    ("Marine Ngo", "+237690112345", "particulier"),
]


def _moi(annee: int, mois: int, jour: int):
    from datetime import date
    return date(annee, mois, jour)


def seed_database(db: Session) -> None:
    if db.scalar(select(User.id)) is not None:
        return

    organisation = Organisation(
        nom="Garage Les Voitures +",
        ville="Douala",
        quartier="Bonanjo",
        telephone="+237655112233",
    )
    db.add(organisation)
    db.flush()

    responsable = User(
        organisation_id=organisation.id,
        nom="Ada Garage",
        email="ada@garage.cm",
        mot_de_passe=hash_password("Cars2026!"),
        role="responsable",
    )
    agent = User(
        organisation_id=organisation.id,
        nom="Mbarga Pièces",
        email="mbarga@garage.cm",
        mot_de_passe=hash_password("Cars2026!"),
        role="agent",
    )
    db.add_all([responsable, agent])

    clients: list[Client] = []
    for nom, tel, typ in CLIENTS:
        client = Client(
            organisation_id=organisation.id,
            nom=nom,
            telephone=tel,
            type=typ,
            note="",
        )
        db.add(client)
        clients.append(client)
    db.flush()

    alea = random.Random(20261014)
    auj = aujourdhui()

    # Voitures : le parc se vend, se réserve, sort.
    for i, (marque, modele, annee, prix) in enumerate(MARQUES):
        if i < 10:
            statut = "en_vente"
            client_id = None
            date_vente = None
        elif i < 13:
            statut = "vendu"
            client_id = clients[alea.randrange(len(clients))].id
            date_vente = _moi(auj.year, alea.choice([9, 10, 11]), alea.randint(2, 26))
            if date_vente > auj:
                date_vente = _moi(auj.year, 10, alea.randint(2, 26))
        elif i < 14:
            statut = "reserve"
            client_id = clients[alea.randrange(len(clients))].id
            date_vente = None
        else:
            statut = "retire"
            client_id = None
            date_vente = None
        voiture = Voiture(
            organisation_id=organisation.id,
            marque=marque,
            modele=modele,
            annee=annee,
            kilometrage=alea.randint(8000, 180000),
            carburant=alea.choice(["essence", "diesel", "diesel", "essence"]),
            boite=alea.choice(["manuelle", "automatique", "automatique"]),
            prix=prix * 1000,
            statut=statut,
            client_id=client_id,
            date_vente=date_vente,
            note="",
        )
        db.add(voiture)

    # Pièces : le stock descend, remonte, s'épuise.
    for i, (designation, compat, stock, achat, vente) in enumerate(PIECES):
        if i < 7:
            statut = "en_stock"
            quantite = 0
            client_id = None
            date_vente = None
        elif i < 9:
            statut = "vendu"
            quantite = alea.randint(1, min(3, stock))
            client_id = clients[alea.randrange(len(clients))].id
            date_vente = _moi(auj.year, alea.choice([9, 10, 11]), alea.randint(2, 26))
            if date_vente > auj:
                date_vente = _moi(auj.year, 10, alea.randint(2, 26))
            stock = max(0, stock - quantite)
        else:
            statut = "epuise"
            quantite = 0
            client_id = None
            date_vente = None
            stock = 0
        piece = Piece(
            organisation_id=organisation.id,
            reference=f"PC-{1000 + i * 7}",
            designation=designation,
            compatibilite=compat,
            stock=stock,
            prix_achat=achat,
            prix_vente=vente,
            statut=statut,
            quantite_vendue=quantite,
            client_id=client_id,
            date_vente=date_vente,
            note="",
        )
        db.add(piece)

    db.commit()
