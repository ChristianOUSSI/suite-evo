from __future__ import annotations

import random
from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Client, Organisation, Piece, User
from ..security import hash_password
from ..utils import aujourdhui, maintenant, periode_de
from .bijou import _reference_libre

RESPONSABLE = {"email": "ada@bijou.cm", "mot_de_passe": "Bijou2026!"}
AGENT = {"email": "mbarga@bijou.cm", "mot_de_passe": "Bijou2026!"}

BIJOUTERIE = {
    "nom": "Or & Perles",
    "ville": "Douala",
    "quartier": "Bonanjo",
    "telephone": "+237699112233",
}

CLIENTS = [
    ("Nathalie Eyenga", "particulier"),
    ("Serge Ndongo", "entreprise"),
    ("Prisca Talla", "particulier"),
    ("Ulrich Mvondo", "collectionneur"),
    ("Sandrine Biya", "particulier"),
    ("Jérôme Ateba", "entreprise"),
    ("Murielle Fotso", "particulier"),
    ("Didier Kamga", "collectionneur"),
    ("Alphonse Ekwalla", "particulier"),
    ("Lydie Ngono", "entreprise"),
]
TELEPHONES = (
    "+237677334455", "+237655667788", "+237699112233", "+237691998877",
    "+237670554433", "+237683221100", "+237660887766", "+237696144322",
    "+237677889900", "+237655112233",
)

# nom, matiere, poids g, carat, prix achat, prix vente
PIECES = [
    ("Bague en or 18 carats", "or", 4.2, 18, 850000, 1200000),
    ("Collier en argent 925", "argent", 18.5, None, 95000, 180000),
    ("Bracelet plaqué or", "plaque_or", 12.0, None, 45000, 95000),
    ("Boucles d'oreilles perles", "perle", 6.4, None, 120000, 240000),
    ("Chaîne en or 14 carats", "or", 8.7, 14, 620000, 890000),
    ("Montre plaquée or", "plaque_or", 45.0, None, 180000, 350000),
    ("Bracelet en acier argenté", "acier", 22.0, None, 15000, 35000),
    ("Pendentif en or 10 carats", "or", 3.1, 10, 380000, 550000),
    ("Collier en perles de culture", "perle", 14.2, None, 200000, 420000),
    ("Bague en argent gravée", "argent", 5.5, None, 55000, 120000),
    ("Bracelet en or 22 carats", "or", 7.9, 22, 950000, 1350000),
    ("Manchettes en argent", "argent", 16.0, None, 85000, 160000),
    ("Chaîne plaquée or 45 cm", "plaque_or", 9.8, None, 52000, 110000),
    ("Bagues en acier doré (paire)", "acier", 11.5, None, 12000, 28000),
    ("Collier en or 9 carats", "or", 5.6, 9, 290000, 420000),
    ("Bracelet jonc en argent", "argent", 9.2, None, 70000, 135000),
    ("Pendentif plaqué or", "plaque_or", 3.8, None, 28000, 60000),
    ("Boucles d'oreilles en or 14 carats", "or", 2.4, 14, 480000, 680000),
    ("Chaîne en acier inoxydable", "acier", 24.5, None, 8000, 20000),
]
NOTES = ("", "", "", "Pièce d'exposition, certificat à demander.", "Reprise client, état impeccable.", "Arrivée de Dubai, dédouanée.", "", "")
FOURNISSEURS = ("Dubai Gold", "Antwerp Exchange", "Reprise client", "Yaoundé Orfèvre", "")


def seed_database(db: Session) -> bool:
    if db.scalar(select(func.count(Organisation.id))):
        return False

    alea = random.Random(20_261_113)
    organisation = Organisation(**BIJOUTERIE)
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

    _pieces(db, organisation, clients, alea)
    db.commit()
    return True


def _pieces(db: Session, organisation: Organisation, clients: list[Client], alea) -> None:
    aujourdhui_d = aujourdhui()
    for nom, matiere, poids, carat, achat, vente in PIECES:
        # Une référence unique par pièce.
        db.flush()
        statut = alea.choices(["en_vitrine", "reserve", "vendu", "retire"], weights=[50, 15, 28, 7])[0]
        client = alea.choice(clients) if statut == "vendu" else (alea.choice(clients) if statut == "reserve" and alea.random() > 0.5 else None)
        date_vente = (
            aujourdhui_d - timedelta(days=alea.randint(1, 60))
            if statut == "vendu"
            else None
        )
        reference = _reference_libre(db)
        db.add(
            Piece(
                organisation_id=organisation.id,
                reference=reference,
                nom=nom,
                matiere=matiere,
                poids_grammes=poids + alea.uniform(0, 0.4),
                carat=carat,
                prix_achat=achat + alea.randint(-20000, 20000),
                prix_vente=vente + alea.randint(-30000, 30000),
                statut=statut,
                client_id=client.id if client else None,
                date_vente=date_vente,
                fournisseur=alea.choice(FOURNISSEURS),
                note=alea.choice(NOTES),
                cree_le=maintenant().replace(
                    hour=alea.randint(9, 18), minute=alea.randint(0, 59), second=0,
                ),
            )
        )
    db.commit()
