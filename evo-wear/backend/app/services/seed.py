from __future__ import annotations

"""La démo de la boutique : articles de prêt-à-porter et clientes - déterministe."""

import random
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Article, Client, Organisation, User
from ..security import hash_password
from ..utils import aujourdhui

RESPONSABLE = {"email": "ada@boutique.cm", "mot_de_passe": "Wear2026!"}
AGENT = {"email": "mbarga@boutique.cm", "mot_de_passe": "Wear2026!"}

ARTICLES = [
    ("Pagne wax 6 yards Premium", "pagne", "unique", "orange", 12000, 25000, 8),
    ("Robe balinais coton", "robe", "M", "bleu", 8000, 18000, 5),
    ("Chemise homme droite", "chemise", "L", "blanc", 6000, 12000, 12),
    ("Ensemble deux pièces wax", "ensemble", "unique", "rouge", 15000, 32000, 4),
    ("Pagne dentelle trad", "pagne", "unique", "violet", 20000, 45000, 3),
    ("Robe soirée paillettes", "robe", "S", "noir", 18000, 40000, 2),
    ("Chemise femme fluide", "chemise", "M", "vert", 7000, 15000, 9),
    ("Pantalon tailleur", "pantalon", "38", "beige", 9000, 20000, 6),
    ("Sandales locales cuir", "chaussure", "40", "marron", 5000, 11000, 15),
    ("Sac à main wax assorti", "accessoire", "unique", "orange", 4500, 10000, 10),
    ("Boubou brodé homme", "chemise", "XL", "blanc", 25000, 55000, 3),
    ("Jupe droite coton", "pantalon", "M", "jaune", 6500, 14000, 7),
]

CLIENTES = [
    ("Nadia Fotso", "+237677112233", "particulier"),
    ("Revendeur Marché Central", "+237699887766", "revendeur"),
    ("Mme Ngo Bell", "+237655443322", "particulier"),
    ("Boutique Mode Yaoundé", "+237690223344", "revendeur"),
    ("Aïcha Hamadou", "+237676665544", "particulier"),
    ("Mariage Famille Mbarga", "+237672211009", "evenement"),
    ("Revendeur Carrefour", "+237688776655", "revendeur"),
    ("Grâce Essomba", "+237699112345", "particulier"),
    ("Cérémonie de dot", "+237655998877", "evenement"),
    ("Mme Tchoupo", "+237690556677", "particulier"),
]


def _moi(annee: int, mois: int, jour: int) -> date:
    return date(annee, mois, jour)


def seed_database(db: Session) -> None:
    if db.scalar(select(User.id)) is not None:
        return

    organisation = Organisation(
        nom="La Mode Africaine",
        ville="Douala",
        quartier="Akwa",
        telephone="+237655223344",
    )
    db.add(organisation)
    db.flush()

    responsable = User(
        organisation_id=organisation.id,
        nom="Ada Boutique",
        email=RESPONSABLE["email"],
        mot_de_passe=hash_password(RESPONSABLE["mot_de_passe"]),
        role="responsable",
    )
    agent = User(
        organisation_id=organisation.id,
        nom="Mbarga Ventes",
        email=AGENT["email"],
        mot_de_passe=hash_password(AGENT["mot_de_passe"]),
        role="agent",
    )
    db.add_all([responsable, agent])

    clientes: list[Client] = []
    for nom, tel, typ in CLIENTES:
        cliente = Client(
            organisation_id=organisation.id,
            nom=nom,
            telephone=tel,
            type=typ,
            note="",
        )
        db.add(cliente)
        clientes.append(cliente)
    db.flush()

    alea = random.Random(20261113)
    auj = aujourdhui()

    # Articles : les derniers partent, certains s'épuisent, d'autres arrivent.
    for i, (nom, categorie, taille, couleur, achat, vente, stock) in enumerate(ARTICLES):
        if i < 8:
            statut = "en_stock"
            quantite = 0
            client_id = None
            date_vente = None
        elif i < 10:
            statut = "vendu"
            quantite = alea.randint(1, min(3, stock))
            client_id = clientes[alea.randrange(len(clientes))].id
            date_vente = _moi(auj.year, alea.choice([9, 10, 11]), alea.randint(2, 26))
            if date_vente > auj:
                date_vente = _moi(auj.year, 10, alea.randint(2, 26))
            stock = max(0, stock - quantite)
            if stock == 0:
                statut = "epuise"
        else:
            statut = "epuise"
            quantite = 0
            client_id = None
            date_vente = None
            stock = 0
        article = Article(
            organisation_id=organisation.id,
            reference=f"PT-{2000 + i * 11}",
            nom=nom,
            categorie=categorie,
            taille=taille,
            couleur=couleur,
            stock=stock,
            prix_achat=achat,
            prix_vente=vente,
            statut=statut,
            quantite_vendue=quantite,
            client_id=client_id,
            date_vente=date_vente,
            note="",
        )
        db.add(article)

    db.commit()
