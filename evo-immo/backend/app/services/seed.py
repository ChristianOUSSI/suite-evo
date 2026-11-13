from __future__ import annotations

import random

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Bien, Demande, Organisation, User, Visite
from ..security import hash_password
from ..utils import aujourdhui, maintenant, periode_de

RESPONSABLE = {"email": "ada@immo.cm", "mot_de_passe": "Immo2026!"}
AGENT = {"email": "mbarga@immo.cm", "mot_de_passe": "Immo2026!"}

AGENCE = {
    "nom": "Immo Horizon",
    "ville": "Douala",
    "quartier": "Akwa",
    "telephone": "+237233445566",
}

QUARTIERS = ("Akwa", "Bonanjo", "Bonapriso", "Bali", "Makepe", "Ndokoti", "Bonamoussadi", "Deido", "Logpom", "Bepanda")
TITRES = {
    "maison": ("Villa avec jardin", "Maison familiale", "Maison duplex", "Maison standing"),
    "appartement": ("Appartement F3 meublé", "Appartement F4 vue mer", "Appartement F2 centre-ville", "Appartement standing"),
    "chambre": ("Chambre chez l'habitant", "Chambre meublée", "Studio meublé"),
    "terrain": ("Terrain borné", "Terrain constructible", "Parcelle avec titre foncier"),
    "bureau": ("Bureau meublé", "Plateau de bureaux", "Bureau avec parking"),
    "commercial": ("Boutique avenue", "Local commercial", "Entrepôt avec quai"),
}
PROPRIETAIRES = ("M. Nlend", "Mme Fotso", "M. Kamga", "Mme Ekwalla", "M. Tchoupo", "Mme Ngono", "M. Biya", "Mme Ateba")
TELEPHONES = (
    "+237677334455", "+237655667788", "+237699112233", "+237691998877",
    "+237670554433", "+237683221100", "+237660887766", "+237696144322",
)
CLIENTS = ("Nathalie Eyenga", "Serge Ndongo", "Prisca Talla", "Ulrich Mvondo", "Sandrine Biya", "Jérôme Ateba", "Murielle Fotso", "Didier Kamga", "Alphonse Ekwalla", "Lydie Ngono")
CANAUX = ("telephone", "whatsapp", "visite", "panneau", "bouche_a_oreille", "autre")
ISSUES = ("ok", "ok", "ok", "absent", "refusee", "a_venir")


def seed_database(db: Session) -> bool:
    """Une agence garnie pour la démonstration. Faux si le registre existe."""
    if db.scalar(select(func.count(Organisation.id))):
        return False

    alea = random.Random(20_261_115)
    organisation = Organisation(**AGENCE)
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

    biens = _biens(db, organisation, [responsable, agent], alea)
    _demandes(db, organisation, biens, [responsable, agent], alea)
    _visites(db, organisation, biens, [responsable, agent], alea)
    db.commit()
    return True


def _biens(db: Session, organisation: Organisation, comptes: list[User], alea) -> list[Bien]:
    lignes = []
    types = list(TITRES.keys())
    for i in range(alea.randint(24, 32)):
        type_bien = alea.choice(types)
        quartier = alea.choice(QUARTIERS)
        statut = alea.choices(
            ["disponible", "negociation", "loue", "vendu", "retire"],
            weights=[55, 15, 10, 12, 8],
        )[0]
        prix = {
            "maison": alea.randint(15_000_000, 120_000_000),
            "appartement": alea.randint(8_000_000, 60_000_000),
            "chambre": alea.randint(50_000, 250_000),
            "terrain": alea.randint(2_000_000, 40_000_000),
            "bureau": alea.randint(150_000, 900_000),
            "commercial": alea.randint(200_000, 2_000_000),
        }[type_bien]
        lignes.append(
            Bien(
                organisation_id=organisation.id,
                type=type_bien,
                titre=alea.choice(TITRES[type_bien]),
                ville="Douala" if alea.random() > 0.15 else "Yaoundé",
                quartier=quartier,
                prix=prix,
                surface_m2=alea.choice([0, 0, 45, 65, 90, 120, 180, 250]),
                chambres=alea.choice([0, 1, 2, 3, 4, 5]) if type_bien in ("maison", "appartement", "chambre") else 0,
                description="" if alea.random() > 0.4 else "Proche du marché et des écoles. Visite sur rendez-vous.",
                statut=statut,
                proprietaire_nom=alea.choice(PROPRIETAIRES),
                proprietaire_telephone=alea.choice(TELEPHONES),
                agent_id=alea.choice(comptes).id,
                note="",
            )
        )
    db.add_all(lignes)
    db.flush()
    return lignes


def _demandes(
    db: Session,
    organisation: Organisation,
    biens: list[Bien],
    comptes: list[User],
    alea,
) -> None:
    aujourdhui_d = aujourdhui()
    from datetime import timedelta

    for _ in range(alea.randint(30, 45)):
        bien = alea.choice(biens) if alea.random() > 0.2 else None
        jour = aujourdhui_d - timedelta(days=alea.randint(0, 180))
        statut = alea.choices(
            ["nouvelle", "contactee", "visite", "convertie", "perdue"],
            weights=[20, 30, 25, 15, 10],
        )[0]
        db.add(
            Demande(
                organisation_id=organisation.id,
                bien_id=bien.id if bien else None,
                client_nom=alea.choice(CLIENTS),
                client_telephone=alea.choice(TELEPHONES),
                canal=alea.choice(CANAUX),
                message="" if alea.random() > 0.5 else "Je veux visiter ce week-end.",
                statut=statut,
                date=jour,
                cree_par=alea.choice(comptes).id,
                cree_le=maintenant().replace(
                    year=jour.year, month=jour.month, day=jour.day,
                    hour=alea.randint(8, 18), minute=alea.randint(0, 59),
                ),
            )
        )
    db.commit()


def _visites(
    db: Session,
    organisation: Organisation,
    biens: list[Bien],
    comptes: list[User],
    alea,
) -> None:
    from datetime import timedelta

    aujourdhui_d = aujourdhui()
    for _ in range(alea.randint(25, 40)):
        bien = alea.choice(biens)
        jour = aujourdhui_d - timedelta(days=alea.randint(-3, 90))
        db.add(
            Visite(
                organisation_id=organisation.id,
                bien_id=bien.id,
                date=jour,
                heure=f"{alea.randint(8, 17):02d}:{alea.choice(['00', '30'])}",
                client_nom=alea.choice(CLIENTS),
                client_telephone=alea.choice(TELEPHONES),
                issue=alea.choice(ISSUES),
                note="",
                cree_par=alea.choice(comptes).id,
                cree_le=maintenant().replace(
                    year=jour.year, month=jour.month, day=jour.day,
                    hour=alea.randint(8, 17), minute=alea.randint(0, 59),
                ),
            )
        )
    db.commit()
