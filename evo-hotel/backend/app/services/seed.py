from __future__ import annotations

import random
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Chambre, Client, Organisation, Sejour, User
from ..security import hash_password
from ..utils import aujourdhui

RESPONSABLE = {"email": "ada@hotellba.cm", "mot_de_passe": "Hotel2026!"}
ACCUEIL = {"email": "mbarga@hotellba.cm", "mot_de_passe": "Hotel2026!"}

ENTREPRISE = {
    "nom": "Hôtel Le Wouri",
    "ville": "Douala",
    "quartier": "Bonanjo",
    "telephone": "+237699556677",
}

# Douze chambres, trois types, comme un hôtel de ville ordinaire.
CHAMBRES = (
    ("101", "standard", 18000, 2),
    ("102", "standard", 18000, 2),
    ("103", "standard", 18000, 2),
    ("104", "standard", 18000, 2),
    ("201", "deluxe", 28000, 2),
    ("202", "deluxe", 28000, 2),
    ("203", "deluxe", 28000, 3),
    ("301", "suite", 45000, 3),
    ("302", "suite", 45000, 4),
    ("401", "familiale", 35000, 5),
    ("402", "familiale", 35000, 5),
    ("501", "suite", 55000, 4),
)

CLIENTS = (
    ("M. Njoya Alain", "+237677334455", "CNI n° 1.2.33.8871", "client régulier, préfère la 201"),
    ("Mme Fotso Brigitte", "+237655667788", "", "appelle le matin pour confirmer"),
    ("M. Tchoupo Jean", "+237699112233", "Passeport C01-2244", "entreprise : missions ponctuelles"),
    ("Dr. Ekwalla Sandrine", "+237691998877", "Ordre des pharmaciens", "séjours médicaux, paiement à la sortie"),
    ("M. Biya Paul", "+237670554433", "", ""),
    ("Mme Ngono Claudine", "+237683221100", "CNI n° 1.1.55.0022", "famille de 4, lit bébé fourni"),
    ("M. Essomba Robert", "+237660887766", "", "chauffeur de convoi, dort tôt"),
    ("Mlle Zanga Mirabelle", "+237696144322", "", "étudiante, tarif négocié"),
    ("M. Onana Grégoire", "+237675990011", "CNI n° 1.4.78.5510", "habitué des suites"),
    ("Mme Ateba Josiane", "+237659003344", "", ""),
    ("M. Mbappe Serge", "+237677221100", "Passeport C02-8812", "sportif, matériel volumineux"),
    ("Mme Kono Lucie", "+237655778899", "CNI n° 1.3.09.3344", ""),
)

NOMS_HOTEL = ["Le Wouri", "Sonia", "Akwa Palace", "Foyer du Centre", "Horizon Douala"]


def seed_database(db: Session) -> bool:
    """Un hôtel garnie pour la démonstration. Faux si le cahier existe."""
    if db.scalar(select(func.count(Organisation.id))):
        return False

    alea = random.Random(20_261_110)
    organisation = Organisation(**ENTREPRISE)
    db.add(organisation)
    db.flush()

    responsable = User(
        organisation_id=organisation.id,
        nom="Clarisse Ada",
        email=RESPONSABLE["email"],
        mot_de_passe=hash_password(RESPONSABLE["mot_de_passe"]),
        role="responsable",
    )
    accueil = User(
        organisation_id=organisation.id,
        nom="Paul Mbarga",
        email=ACCUEIL["email"],
        mot_de_passe=hash_password(ACCUEIL["mot_de_passe"]),
        role="receptionniste",
    )
    db.add_all([responsable, accueil])
    db.flush()

    chambres = _chambres(db, organisation)
    clients = _clients(db, organisation)
    _sejours(db, organisation, chambres, clients, [responsable, accueil], alea)
    db.commit()
    return True


def _chambres(db: Session, organisation: Organisation) -> list[Chambre]:
    lignes = [
        Chambre(
            organisation_id=organisation.id,
            numero=numero,
            type=type_chambre,
            prix_par_nuit=prix,
            capacite=capacite,
            note="" if type_chambre != "suite" else "balcon vue fleuve",
        )
        for numero, type_chambre, prix, capacite in CHAMBRES
    ]
    db.add_all(lignes)
    db.flush()
    return lignes


def _clients(db: Session, organisation: Organisation) -> list[Client]:
    lignes = [
        Client(
            organisation_id=organisation.id,
            nom=nom,
            telephone=telephone,
            piece=piece,
            note=note,
        )
        for nom, telephone, piece, note in CLIENTS
    ]
    db.add_all(lignes)
    db.flush()
    return lignes


def _sejours(
    db: Session,
    organisation: Organisation,
    chambres: list[Chambre],
    clients: list[Client],
    comptes: list[User],
    alea,
) -> None:
    """Six semaines de séjours passés et à venir, sans jamais doubler une
    chambre sur une même nuit."""
    aujourdhui_d = aujourdhui()
    # D'abord les séjours passés, chambre par chambre, sans chevauchement.
    for chambre in chambres:
        curseur = aujourdhui_d - timedelta(days=45)
        while curseur < aujourdhui_d - timedelta(days=3):
            if alea.random() < 0.45:
                nuits = alea.randint(1, 4)
                arrivee = curseur
                depart = curseur + timedelta(days=nuits)
                db.add(
                    Sejour(
                        organisation_id=organisation.id,
                        chambre_id=chambre.id,
                        client_id=alea.choice(clients).id,
                        arrivee=arrivee,
                        depart=depart,
                        statut="terminee",
                        note="",
                        cree_par=alea.choice(comptes).id,
                        cree_le=_a_heure(arrivee, alea),
                    )
                )
                curseur = depart + timedelta(days=alea.randint(0, 5))
            else:
                curseur += timedelta(days=1)

    # Puis les séjours à venir et en cours : garantis sans chevauchement.
    occupe: dict[int, tuple[date, date] | None] = {un.id: None for un in chambres}
    for _ in range(14):
        chambre = alea.choice(chambres)
        arrivee = aujourdhui_d - timedelta(days=alea.randint(0, 2))
        if alea.random() < 0.6:
            arrivee = aujourdhui_d + timedelta(days=alea.randint(1, 10))
        nuits = alea.randint(1, 4)
        depart = arrivee + timedelta(days=nuits)
        if occupe[chambre.id] and not (depart <= occupe[chambre.id][0] or arrivee >= occupe[chambre.id][1]):
            continue
        statut = "en_cours" if arrivee <= aujourdhui_d < depart else "confirmee"
        db.add(
            Sejour(
                organisation_id=organisation.id,
                chambre_id=chambre.id,
                client_id=alea.choice(clients).id,
                arrivee=arrivee,
                depart=depart,
                statut=statut,
                note="" if alea.random() > 0.3 else "lit bébé / lit d'appoint",
                cree_par=alea.choice(comptes).id,
                cree_le=_a_heure(arrivee - timedelta(days=alea.randint(1, 9)), alea),
            )
        )
        occupe[chambre.id] = (arrivee, depart)


def _a_heure(jour: date, alea):
    from datetime import datetime

    return datetime(jour.year, jour.month, jour.day, 8, alea.randint(0, 59))
