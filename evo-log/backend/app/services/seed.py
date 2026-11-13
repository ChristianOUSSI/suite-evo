from __future__ import annotations

import random
from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Colis, Organisation, User
from ..security import hash_password
from ..utils import aujourdhui, maintenant, periode_de
from .log import _numero

RESPONSABLE = {"email": "ada@logistique.cm", "mot_de_passe": "Log2026!"}
AGENT = {"email": "mbarga@logistique.cm", "mot_de_passe": "Log2026!"}

TRANSPORTEUR = {
    "nom": "Express Horizon",
    "ville": "Douala",
    "quartier": "Akwa",
    "telephone": "+237233445566",
}

NOMS = ("Nathalie Eyenga", "Serge Ndongo", "Prisca Talla", "Ulrich Mvondo", "Sandrine Biya", "Jérôme Ateba", "Murielle Fotso", "Didier Kamga", "Alphonse Ekwalla", "Lydie Ngono", "Patrick Same", "Grâce Mballa", "Eric Tchoupo", "Brice Ndoumbe", "Céline Eyenga")
TELEPHONES = (
    "+237677334455", "+237655667788", "+237699112233", "+237691998877",
    "+237670554433", "+237683221100", "+237660887766", "+237696144322",
    "+237650998877", "+237697665544",
)
GENRES = ("document", "colis", "valise", "electromenager", "palette", "autre")
DESCRIPTION = {
    "document": "Dossier administratif",
    "colis": "Cartons de marchandises",
    "valise": "Valise de voyage",
    "electromenager": "Réfrigérateur / congélateur",
    "palette": "Palette de produits",
    "autre": "Objet fragile",
}
STATUTS = ("recu", "en_transit", "arrive", "distribue", "retourne", "annule")
MOYENS = ("especes", "mtn_money", "orange_money", "nexttel_money", "virement", "a_payer", "autre")
TRAJETS = (
    ("Douala", "Yaoundé"), ("Yaoundé", "Douala"), ("Douala", "Bafoussam"),
    ("Douala", "Bamenda"), ("Yaoundé", "Bertoua"), ("Douala", "Kribi"),
    ("Douala", "Limbe"), ("Yaoundé", "Bafoussam"), ("Douala", "Maroua"),
    ("Douala", "Douala"), ("Yaoundé", "Yaoundé"),
)


def seed_database(db: Session) -> bool:
    """Un transporteur garni pour la démonstration. Faux si le registre existe."""
    if db.scalar(select(func.count(Organisation.id))):
        return False

    alea = random.Random(20_261_116)
    organisation = Organisation(**TRANSPORTEUR)
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

    _colis(db, organisation, [responsable, agent], alea)
    db.commit()
    return True


def _colis(db: Session, organisation: Organisation, comptes: list[User], alea) -> None:
    aujourdhui_d = aujourdhui()
    for _ in range(alea.randint(40, 55)):
        genre = alea.choice(GENRES)
        depart, arrivee = alea.choice(TRAJETS)
        statut = alea.choices(
            STATUTS, weights=[15, 30, 15, 25, 8, 7]
        )[0]
        jour = aujourdhui_d - timedelta(days=alea.randint(0, 150))
        livraison = None
        if statut in ("distribue", "retourne") and alea.random() > 0.3:
            livraison = jour + timedelta(days=alea.randint(1, 6))
        frais = {
            "document": alea.randint(1_500, 5_000),
            "colis": alea.randint(3_000, 25_000),
            "valise": alea.randint(8_000, 40_000),
            "electromenager": alea.randint(15_000, 80_000),
            "palette": alea.randint(50_000, 250_000),
            "autre": alea.randint(2_000, 60_000),
        }[genre]
        db.add(
            Colis(
                organisation_id=organisation.id,
                numero=_numero(db, organisation),
                genre=genre,
                description=DESCRIPTION[genre] if alea.random() > 0.4 else "",
                poids_kg=alea.choice([0, 1, 2, 5, 10, 20, 50]),
                expediteur_nom=alea.choice(NOMS),
                expediteur_telephone=alea.choice(TELEPHONES),
                destinataire_nom=alea.choice(NOMS),
                destinataire_telephone=alea.choice(TELEPHONES),
                depart=depart,
                arrivee=arrivee,
                frais=frais,
                moyen=alea.choice(MOYENS),
                statut=statut,
                date_depot=jour,
                date_livraison=livraison,
                note="",
                agent_id=alea.choice(comptes).id,
                cree_par=alea.choice(comptes).id,
                cree_le=maintenant().replace(
                    year=jour.year, month=jour.month, day=jour.day,
                    hour=alea.randint(7, 18), minute=alea.randint(0, 59),
                ),
            )
        )
        db.flush()
    db.commit()
