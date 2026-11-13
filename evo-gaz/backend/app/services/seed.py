from __future__ import annotations

"""La démo du dépôt : clients et livraisons — déterministe, jamais en prod."""

import random
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Client, Livraison, Organisation, User
from ..security import hash_password
from ..utils import aujourdhui

RESPONSABLE = {"email": "ada@depotgaz.cm", "mot_de_passe": "Gaz2026!"}
AGENT = {"email": "mbarga@depotgaz.cm", "mot_de_passe": "Gaz2026!"}

CLIENTS = [
    ("Mama Ngo Epse", "+237677112233", "Akwa", "particulier"),
    ("Restaurant Le Bon Gout", "+237699887766", "Bonapriso", "restaurant"),
    ("Revendeur LPG Akwa", "+237655443322", "Akwa", "revendeur"),
    ("Chantier BTP Bonanjo", "+237690223344", "Bonanjo", "chantier"),
    ("M. Fotso Fils", "+237676665544", "Deido", "particulier"),
    ("Snack Chez Mama", "+237672211009", "Akwa", "restaurant"),
    ("Dépanneur Central", "+237688776655", "Bonapriso", "revendeur"),
    ("Famille Mbarga", "+237699112345", "Bonanjo", "particulier"),
    ("Maquis La Joie", "+237655998877", "Deido", "restaurant"),
    ("Atelier Mécanique", "+237690556677", "Akwa", "chantier"),
]

QUARTIERS = ["Akwa", "Bonapriso", "Bonanjo", "Deido", "Akwa", "Bonapriso", "Deido"]


def _jour(annee: int, mois: int, jour: int) -> date:
    return date(annee, mois, jour)


def seed_database(db: Session) -> None:
    if db.scalar(select(User.id)) is not None:
        return

    organisation = Organisation(
        nom="Dépôt GPL Bonanjo",
        ville="Douala",
        quartier="Bonanjo",
        telephone="+237233425678",
    )
    db.add(organisation)
    db.flush()

    responsable = User(
        organisation_id=organisation.id,
        nom="Ada Dépôt",
        email=RESPONSABLE["email"],
        mot_de_passe=hash_password(RESPONSABLE["mot_de_passe"]),
        role="responsable",
    )
    agent = User(
        organisation_id=organisation.id,
        nom="Mbarga Livreurs",
        email=AGENT["email"],
        mot_de_passe=hash_password(AGENT["mot_de_passe"]),
        role="agent",
    )
    db.add_all([responsable, agent])

    clients: list[Client] = []
    for nom, tel, quartier, typ in CLIENTS:
        client = Client(
            organisation_id=organisation.id,
            nom=nom,
            telephone=tel,
            quartier=quartier,
            type=typ,
            note="",
        )
        db.add(client)
        clients.append(client)
    db.flush()

    alea = random.Random(20261113)
    auj = aujourdhui()

    # Livraisons : les récents partent, certains sont en cours, d'anciens livrés.
    for i in range(24):
        client = clients[alea.randrange(len(clients))]
        quantite = alea.choice([1, 1, 2, 2, 3, 5])
        prix = 6800 if quantite <= 2 else 6500
        if i < 8:
            statut = "livree"
            date_livraison = _jour(auj.year, alea.choice([9, 10, 11]), alea.randint(2, 26))
            if date_livraison > auj:
                date_livraison = _jour(auj.year, 10, alea.randint(2, 26))
        elif i < 14:
            statut = alea.choice(["commandee", "en_route"])
            date_livraison = None
        elif i < 20:
            statut = "livree"
            date_livraison = _jour(auj.year, alea.choice([8, 9, 10]), alea.randint(2, 26))
        else:
            statut = "annulee"
            date_livraison = None
        date_commande = _jour(auj.year, alea.choice([9, 10, 11]), alea.randint(2, 26))
        if date_commande > auj:
            date_commande = _jour(auj.year, 10, alea.randint(2, 26))
        livraison = Livraison(
            organisation_id=organisation.id,
            client_id=client.id,
            quantite=quantite,
            prix_unitaire=prix,
            statut=statut,
            date_commande=date_commande,
            date_livraison=date_livraison,
            adresse=alea.choice(QUARTIERS),
            note="commande publique" if alea.random() < 0.3 else "",
        )
        db.add(livraison)

    db.commit()
