from __future__ import annotations

import random
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Cotisation, Groupe, Membre, Remise, Tour, User
from ..security import hash_password, jeton_public
from ..utils import maintenant

DEMO_EMAIL = "tresoriere@njangi.cm"
DEMO_PASSWORD = "Tontine2026!"
LECTEUR_EMAIL = "lecteur@njangi.cm"

# Un cercle de quartier tel qu'il existe vraiment : des noms courts, deux
# parts pour celui qui a deux têtes à nourrir, un rythme mensuel ancré au 5.
MEMBRES = (
    ("Alima Hadjira", "+237699112204", 1, "marchande, New-Bell"),
    ("Bertrand Nyongo", "+237677334411", 2, "deux parts, frère et belle-sœur"),
    ("Clarisse Etonde", "+237655889900", 1, "enseignante, Ndokoti"),
    ("Dieudonné Mbarga", "+237691220033", 1, "taxi, Bonabéri"),
    ("Estelle Nkoussa", "+237683445566", 1, "couturière, Deido"),
    ("Franck Obiang", "+237670998877", 1, "dépôt de glace, Mboppi"),
    ("Georgette Awono", "+237696776655", 1, "bayam-sellam, Mvan"),
    ("Hervé Tchoumi", "+237659001122", 1, "menuisier, Nsam"),
    ("Irène Ndongo", "+237675223344", 1, "infirmière, Bastos"),
)

TEMOINS = ("Alima Hadjira", "Franck Obiang", "Irène Ndongo")


def seed_database(db: Session) -> bool:
    """Un cercle garni pour la démonstration. Faux si le cahier existe déjà."""
    if db.scalar(select(func.count(Groupe.id))):
        return False

    alea = random.Random(20_261_106)
    groupe = _groupe()
    db.add(groupe)
    db.flush()

    db.add(
        User(
            groupe_id=groupe.id,
            nom="Rosine Abena",
            email=DEMO_EMAIL,
            mot_de_passe=hash_password(DEMO_PASSWORD),
            role="tresorier",
        )
    )
    # Un second compte, sans droit d'écriture : c'est ainsi qu'on montre à un
    # acheteur que le rôle tient lieu de clé, et non l'adresse de la personne.
    db.add(
        User(
            groupe_id=groupe.id,
            nom="Baba Ibrahim",
            email=LECTEUR_EMAIL,
            mot_de_passe=hash_password(DEMO_PASSWORD),
            role="membre",
        )
    )
    db.flush()

    membres = _membres(db, groupe)
    _tours(db, groupe, membres, alea)
    db.commit()
    return True


def _groupe() -> Groupe:
    return Groupe(
        nom="Njangi des Femmes et Hommes de Ndokoti",
        ville="Douala",
        quartier="Ndokoti",
        frequence="mensuel",
        jour_ancre=5,
        cotisation=10_000,
        penalite=500,
        telephone="+237699112204",
        mot_du_groupe=(
            "On cotise le 5. Le pot va à celui que le tirage désigne, "
            "devant deux témoins. Personne ne sort du cercle avec une dette."
        ),
        abonnement_mensuel=5_000,
        momo_actif=True,
        orange_actif=True,
        especes_actifs=True,
    )


def _membres(db: Session, groupe: Groupe) -> list[Membre]:
    lignes = []
    for nom, telephone, part, note in MEMBRES:
        membre = Membre(
            groupe_id=groupe.id,
            nom=nom,
            telephone=telephone,
            part=part,
            note=note,
            entree_le=date.today() - timedelta(days=alea_entree(nom)),
        )
        db.add(membre)
        lignes.append(membre)
    db.flush()
    return lignes


def alea_entree(nom: str) -> int:
    """Une date d'entrée stable, pour que le semis se répète à l'identique."""
    return 90 + (sum(ord(un) for un in nom) % 200)


def _tours(db: Session, groupe: Groupe, membres: list[Membre], alea: random.Random) -> None:
    total_parts = sum(un.part for un in membres)
    today = date.today()

    # Six tours écoulés, un en cours. Le gagnant suit l'ordre du tirage.
    for numero in range(1, 8):
        mois = today.month - (7 - numero)
        annee = today.year + (mois - 1) // 12
        jour = date(annee, ((mois - 1) % 12) + 1, groupe.jour_ancre)
        gagne = membres[(numero * 5) % len(membres)]
        cloture = numero < 7

        tour = Tour(
            groupe_id=groupe.id,
            numero=numero,
            date_prevue=jour,
            montant_pot=groupe.cotisation * total_parts,
            statut="remis" if cloture else "en_cours",
            graine=f"{groupe.nom}|tour {numero}|{jour.isoformat()}",
        )
        if cloture:
            tour.date_tirage = jour - timedelta(days=2)
            tour.gagnant_id = gagne.id
        db.add(tour)
        db.flush()

        for membre in membres:
            du = groupe.cotisation * membre.part
            en_retard = cloture and alea.random() < 0.22
            paye_le = jour + timedelta(days=alea.randint(3, 9)) if en_retard else jour - timedelta(days=alea.randint(0, 4))
            cotisation = Cotisation(
                tour_id=tour.id,
                membre_id=membre.id,
                montant_attendu=du,
                montant_paye=du if cloture else (du if alea.random() < 0.72 else 0),
                payee_le=paye_le if cloture else (None if alea.random() < 0.2 else jour),
                mode=alea.choice(["especes", "especes", "momo_mtn", "momo_orange"]) if cloture else "",
                penalite=groupe.penalite if en_retard else 0,
                reference=jeton_public(8),
            )
            db.add(cotisation)

        if cloture:
            db.add(
                Remise(
                    tour_id=tour.id,
                    groupe_id=groupe.id,
                    membre_id=gagne.id,
                    montant=tour.montant_pot,
                    moment=maintenant().replace(
                        year=jour.year, month=jour.month, day=jour.day, hour=18, minute=30
                    ),
                    jeton=jeton_public(),
                    temoin=alea.choice(TEMOINS),
                    mode="especes",
                    note="remis en main propre à la séance",
                )
            )
    db.flush()
