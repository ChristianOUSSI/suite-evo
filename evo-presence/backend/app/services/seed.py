from __future__ import annotations

import random
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Employe, Organisation, Presence, User
from ..security import hash_password
from ..utils import aujourdhui

RESPONSABLE = {"email": "ada@horizon.cm", "mot_de_passe": "Presence2026!"}
AGENT = {"email": "mbarga@horizon.cm", "mot_de_passe": "Presence2026!"}

ENTREPRISE = {
    "nom": "SARL Horizon Services",
    "ville": "Douala",
    "quartier": "Akwa",
    "telephone": "+237699334455",
}

# Les services d'une PME camerounaise ordinaire, avec leurs numéros.
EQUIPE = (
    ("Clarisse Ada", "+237677112233", "direction", "CNI n° 1.2.45.0042"),
    ("Paul Mbarga", "+237655443322", "commercial", ""),
    ("Bertille Ngo", "+237699887766", "comptabilité", ""),
    ("Cyrille Onana", "+237691220044", "atelier", "CNI n° 1.3.11.7782"),
    ("Delphine Eboa", "+237670998822", "magasin", ""),
    ("Etienne Mandeng", "+237660223311", "logistique", "CNI n° 1.1.09.4410"),
    ("Fulgence Sadio", "+237683445511", "commercial", ""),
    ("Grâce Mbella", "+237696776622", "accueil", "CNI n° 1.4.22.0091"),
    ("Hermann Douala", "+237675223300", "atelier", ""),
    ("Irène Nkoulou", "+237659001133", "comptabilité", "CNI n° 1.2.77.3311"),
    ("Joseph Balaga", "", "magasin", "pas de numéro, pointé à la caisse"),
)


def seed_database(db: Session) -> bool:
    """Une entreprise garnie pour la démonstration. Faux si le cahier existe."""
    if db.scalar(select(func.count(Organisation.id))):
        return False

    alea = random.Random(20_261_110)
    organisation = Organisation(**ENTREPRISE)
    db.add(organisation)
    db.flush()

    ada = User(
        organisation_id=organisation.id,
        nom="Clarisse Ada",
        email=RESPONSABLE["email"],
        mot_de_passe=hash_password(RESPONSABLE["mot_de_passe"]),
        role="responsable",
    )
    mbarga = User(
        organisation_id=organisation.id,
        nom="Paul Mbarga",
        email=AGENT["email"],
        mot_de_passe=hash_password(AGENT["mot_de_passe"]),
        role="agent",
    )
    db.add_all([ada, mbarga])
    db.flush()

    employes = _employes(db, organisation)
    _presences(db, employes, [ada, mbarga], alea)
    db.commit()
    return True


def _employes(db: Session, organisation: Organisation) -> list[Employe]:
    lignes = []
    for index, (nom, telephone, service, note) in enumerate(EQUIPE):
        lignes.append(
            Employe(
                organisation_id=organisation.id,
                nom=nom,
                telephone=telephone,
                service=service,
                actif=nom != "Joseph Balaga",
                entree_le=aujourdhui() - timedelta(days=200 - index * 9),
                note=note,
            )
        )
    db.add_all(lignes)
    db.flush()
    return lignes


def _presences(
    db: Session,
    employes: list[Employe],
    comptes: list[User],
    alea,
) -> None:
    """Six semaines de pointages, week-ends et absences compris.

    L'absent tombe souvent le même jour pour toute l'équipe : c'est ce que
    l'agent veut pouvoir prouver, quand un employé réclame une journée que
    personne n'a faite.
    """
    aujourdhui_d = aujourdhui()
    actifs = [un for un in employes if un.actif]
    jours_absence = {aujourdhui_d - timedelta(days=11), aujourdhui_d - timedelta(days=27)}

    for delta in range(42, 0, -1):
        jour = aujourdhui_d - timedelta(days=delta)
        week_end = jour.weekday() >= 5
        for employe in actifs:
            if alea.random() < 0.22:
                continue
            statut = "present"
            arrivee = ""
            depart = ""
            if jour in jours_absence and alea.random() < 0.6:
                statut = "absent"
            elif week_end:
                statut = "present" if alea.random() < 0.25 else "absent"
            elif alea.random() < 0.06:
                statut = "retard"
                arrivee = f"08:{alea.randint(30, 59):02d}"
            if statut != "absent" and not arrivee:
                arrivee = f"0{alea.randint(7, 8)}:{alea.choice([0, 15, 30, 45]):02d}"
            if statut != "absent":
                depart = f"1{alea.randint(7, 9)}:{alea.choice([0, 15, 30, 45]):02d}"
            db.add(
                Presence(
                    employe_id=employe.id,
                    jour=jour,
                    statut=statut,
                    arrivee=arrivee,
                    depart=depart,
                    note="absence signalée la veille" if statut == "absent" else "",
                    pointe_par=alea.choice(comptes).id,
                    pointe_le=_a_heure(jour, alea),
                )
            )


def _a_heure(jour: date, alea):
    from datetime import datetime

    return datetime(jour.year, jour.month, jour.day, 7, alea.randint(0, 59))
