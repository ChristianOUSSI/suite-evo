from __future__ import annotations

import random
from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Classe, Eleve, Organisation, User, Versement
from ..security import hash_password
from ..utils import aujourdhui, maintenant, periode_de

RESPONSABLE = {"email": "ada@ecolecm.cm", "mot_de_passe": "School2026!"}
COMPTABLE = {"email": "mbarga@ecolecm.cm", "mot_de_passe": "School2026!"}

ENTREPRISE = {
    "nom": "École Les Palmiers",
    "ville": "Douala",
    "quartier": "Bonapriso",
    "telephone": "+237699334455",
}

CLASSES = (
    ("CP1 A", "Mme Eyenga", 45000),
    ("CP2 A", "M. Fotso", 45000),
    ("CE1 A", "Mme Talla", 55000),
    ("CE2 A", "M. Ndongo", 55000),
    ("CM1 A", "Mme Ekwalla", 65000),
    ("CM2 A", "M. Kamga", 65000),
    ("6e A", "Mme Ateba", 75000),
    ("5e A", "M. Biya", 75000),
)

NOMS = (
    "Junior", "Grâce", "Merveille", "Paulin", "Esther", "Naomi",
    "Grâce Divine", "Fiston", "Grâce Merveille", "Grâce Grâce",
    "Grâce Junior", "Grâce Grâce Divine", "Grâce Grâce Merveille",
    "Grâce Grâce Grâce", "Grâce Grâce Grâce Divine",
)

PARENTS = ("M. Njoya", "Mme Fotso", "M. Tchoupo", "Mme Ekwalla", "M. Biya", "Mme Ngono")
TELEPHONES = (
    "+237677334455", "+237655667788", "+237699112233", "+237691998877",
    "+237670554433", "+237683221100", "+237660887766", "+237696144322",
)


def seed_database(db: Session) -> bool:
    """Une école garnie pour la démonstration. Faux si le cahier existe."""
    if db.scalar(select(func.count(Organisation.id))):
        return False

    alea = random.Random(20_261_113)
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
    comptable = User(
        organisation_id=organisation.id,
        nom="Paul Mbarga",
        email=COMPTABLE["email"],
        mot_de_passe=hash_password(COMPTABLE["mot_de_passe"]),
        role="comptable",
    )
    db.add_all([responsable, comptable])
    db.flush()

    classes = _classes(db, organisation)
    eleves = _eleves(db, organisation, classes, alea)
    _versements(db, organisation, eleves, [responsable, comptable], alea)
    db.commit()
    return True


def _classes(db: Session, organisation: Organisation) -> list[Classe]:
    lignes = [
        Classe(
            organisation_id=organisation.id,
            nom=nom,
            titulaire=titulaire,
            frais_annuels=frais,
            note="",
        )
        for nom, titulaire, frais in CLASSES
    ]
    db.add_all(lignes)
    db.flush()
    return lignes


def _eleves(
    db: Session,
    organisation: Organisation,
    classes: list[Classe],
    alea,
) -> list[Eleve]:
    lignes = []
    compteur = 1
    for classe in classes:
        for i in range(alea.randint(14, 22)):
            nom = f"{alea.choice(NOMS)} {alea.choice(['Grâce', 'Grâce', 'Grâce', 'Grâce'])}"
            parent = alea.choice(PARENTS)
            telephone = alea.choice(TELEPHONES)
            lignes.append(
                Eleve(
                    organisation_id=organisation.id,
                    classe_id=classe.id,
                    nom=f"{nom}",
                    matricule=f"{classe.nom.split()[0]}-{compteur:04d}",
                    parent_nom=parent,
                    parent_telephone=telephone,
                    frais_attendu=classe.frais_annuels,
                    note="",
                )
            )
            compteur += 1
    db.add_all(lignes)
    db.flush()
    return lignes


def _versements(
    db: Session,
    organisation: Organisation,
    eleves: list[Eleve],
    comptes: list[User],
    alea,
) -> None:
    """Sept mois de versements, sans jamais dépasser le montant attendu."""
    aujourdhui_d = aujourdhui()
    for eleve in eleves:
        paye = 0
        # Certains élèves n'ont rien payé, d'autres ont tout payé.
        scenario = alea.random()
        if scenario < 0.15:
            continue  # rien payé
        if scenario > 0.85:
            nb = alea.randint(3, 5)
        else:
            nb = alea.randint(1, 3)
        for _ in range(nb):
            reste = eleve.frais_attendu - paye
            if reste <= 0:
                break
            # Des versements de tailles variées, jusqu'au solde.
            montant = min(reste, alea.choice([5000, 10000, 15000, 20000, 25000]))
            if montant <= 0:
                break
            jour = aujourdhui_d - timedelta(days=alea.randint(0, 200))
            moyen = alea.choice(["especes", "especes", "mtn_money", "orange_money", "nexttel_money"])
            db.add(
                Versement(
                    organisation_id=organisation.id,
                    eleve_id=eleve.id,
                    montant=montant,
                    moyen=moyen,
                    date=jour,
                    periode=periode_de(jour),
                    note="" if alea.random() > 0.2 else "1ère tranche / 2ème tranche",
                    recu=_code_recu(organisation.id, eleve.id, jour, alea),
                    cree_par=alea.choice(comptes).id,
                    cree_le=maintenant().replace(
                        year=jour.year, month=jour.month, day=jour.day,
                        hour=alea.randint(8, 17), minute=alea.randint(0, 59),
                    ),
                )
            )
            paye += montant
    db.commit()


def _code_recu(organisation_id: int, eleve_id: int, jour, alea) -> str:
    """Un code de reçu stable, sans passer par la base : le secret serveur
    suffit, l'unicité est quasi certaine sur 10 signes."""
    from ..security import code_de_controle

    sel = alea.randint(0, 999)
    return code_de_controle(organisation_id, eleve_id, f"{jour.isoformat()}-{sel}")[:10].upper()
