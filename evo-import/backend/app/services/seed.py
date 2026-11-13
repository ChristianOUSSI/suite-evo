from __future__ import annotations

import random
from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Client, Envoi, Organisation, Suivi, User
from ..security import hash_password
from ..utils import aujourdhui, maintenant, periode_de

RESPONSABLE = {"email": "ada@import.cm", "mot_de_passe": "Import2026!"}
AGENT = {"email": "mbarga@import.cm", "mot_de_passe": "Import2026!"}

TRANSITAIRE = {
    "nom": "Quai Horizon Freight",
    "ville": "Douala",
    "quartier": "Akwa",
    "telephone": "+237233556677",
}

CLIENTS = [
    ("Nathalie Eyenga", "particulier"),
    ("Serge Ndongo", "entreprise"),
    ("Prisca Talla", "particulier"),
    ("Ulrich Mvondo", "revendeur"),
    ("Sandrine Biya", "particulier"),
    ("Jérôme Ateba", "entreprise"),
    ("Murielle Fotso", "particulier"),
    ("Didier Kamga", "revendeur"),
    ("Alphonse Ekwalla", "particulier"),
    ("Lydie Ngono", "entreprise"),
]
TELEPHONES = (
    "+237677334455", "+237655667788", "+237699112233", "+237691998877",
    "+237670554433", "+237683221100", "+237660887766", "+237696144322",
    "+237677889900", "+237655112233",
)

ENVOIS = [
    ("Cartons de tissus wax", "maritime", "Abidjan", "Côte d'Ivoire", "Douala", "particulier"),
    ("Pièces détachées moto", "aerien", "Paris", "France", "Douala", "entreprise"),
    ("Sacs de riz 50kg", "terrestre", "Kousséri", "Cameroun", "Douala", "revendeur"),
    ("Téléphones reconditionnés", "express", "Dubaï", "Émirats", "Douala", "revendeur"),
    ("Matériel de chantier", "maritime", "Shanghai", "Chine", "Douala", "entreprise"),
    ("Produits cosmétiques", "aerien", "Lomé", "Togo", "Yaoundé", "entreprise"),
    ("Vêtements d'occasion", "maritime", "Dakar", "Sénégal", "Douala", "particulier"),
    ("Électronique grand public", "express", "Shenzhen", "Chine", "Douala", "revendeur"),
    ("Denrées alimentaires", "terrestre", "Bamenda", "Cameroun", "Douala", "particulier"),
    ("Machines agricoles", "maritime", "Anvers", "Belgique", "Yaoundé", "entreprise"),
    ("Papeterie et fournitures", "aerien", "Casablanca", "Maroc", "Douala", "entreprise"),
    ("Cartons de cacao", "maritime", "Kribi", "Cameroun", "Rotterdam", "entreprise"),
]
STATUTS = ("en_attente", "en_transit", "en_douane", "livre", "bloque", "annule")
NOTES = ("", "", "", "En attente du dédouanement.", "Client prévenu par WhatsApp.", "Facture jointe.", "")


def seed_database(db: Session) -> bool:
    if db.scalar(select(func.count(Organisation.id))):
        return False

    alea = random.Random(20_261_116)
    organisation = Organisation(**TRANSITAIRE)
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

    _envois(db, organisation, clients, alea)
    db.commit()
    return True


def _numero(alea) -> str:
    alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
    return "".join(alea.choice(alphabet) for _ in range(10))


def _envois(db: Session, organisation: Organisation, clients: list[Client], alea) -> None:
    aujourdhui_d = aujourdhui()
    for description, mode, pays, _pays_nom, ville, type_ in ENVOIS:
        statut = alea.choices(STATUTS, weights=[15, 30, 15, 30, 7, 3])[0]
        jour = aujourdhui_d - timedelta(days=alea.randint(1, 45))
        envoi = Envoi(
            organisation_id=organisation.id,
            numero_suivi=_numero(alea),
            description=description,
            mode=mode,
            expéditeur_nom="",
            expéditeur_pays=pays,
            destinataire_nom=alea.choice(clients).nom,
            destinataire_ville=ville,
            poids_kg=round(alea.uniform(2, 480), 1),
            valeur_declaree=alea.choice([150000, 450000, 900000, 2500000, 6000000]),
            frais=alea.choice([25000, 45000, 75000, 120000, 200000]),
            statut=statut,
            client_id=alea.choice(clients).id,
            date_envoi=jour,
            date_livraison=jour + timedelta(days=alea.randint(3, 20)) if statut == "livre" else None,
            note=alea.choice(NOTES),
            cree_le=maintenant().replace(
                year=jour.year, month=jour.month, day=jour.day,
                hour=alea.randint(8, 18), minute=alea.randint(0, 59),
            ),
        )
        db.add(envoi)
        db.flush()
        # Le parcours : les étapes déjà passées laissent leur ligne.
        etapes = ["en_attente", "en_transit", "en_douane"]
        arrivee = STATUTS.index(statut)
        for i in range(min(arrivee + 1, len(etapes))):
            db.add(
                Suivi(
                    envoi_id=envoi.id,
                    statut=etapes[i],
                    note="",
                    cree_le=maintenant().replace(
                        year=jour.year, month=jour.month,
                        day=min(jour.day + i * 4, 28),
                        hour=alea.randint(8, 18), minute=alea.randint(0, 59),
                    ),
                )
            )
        if statut in ("bloque", "annule"):
            db.add(
                Suivi(
                    envoi_id=envoi.id,
                    statut=statut,
                    note=alea.choice(NOTES),
                    cree_le=maintenant().replace(
                        year=jour.year, month=jour.month, day=min(jour.day + 10, 28),
                        hour=alea.randint(8, 18), minute=alea.randint(0, 59),
                    ),
                )
            )
        if statut == "livre":
            db.add(
                Suivi(
                    envoi_id=envoi.id,
                    statut="livre",
                    note="Livré au destinataire.",
                    cree_le=maintenant().replace(
                        year=envoi.date_livraison.year, month=envoi.date_livraison.month,
                        day=envoi.date_livraison.day,
                        hour=alea.randint(8, 18), minute=alea.randint(0, 59),
                    ),
                )
            )
    db.commit()
