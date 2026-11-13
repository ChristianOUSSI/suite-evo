"""Le jeu de démonstration : une école de Bonapriso, son année et sa caisse."""

from __future__ import annotations

import random
from datetime import date, datetime, time, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Classe, Ecole, Eleve, Engagement, Journee, User
from ..security import hash_password
from ..utils import annee_label, ecole_annee_scolaire, maintenant
from . import encaissement, facturation, relances

RENTEE = date(2026, 9, 7)
FIN_ANNEE = date(2027, 7, 9)
SAMEDI = 5

PRENOMS_F = (
    "Aïcha", "Béranar", "Chantal", "Davisnée", "Estelle", "Fanta", "Gisèle",
    "Honorine", "Idelette", "Josiane", "Kadi", "Léonie", "Marlène", "Ndèye",
    "Ombline", "Prisca", "Rachida", "Sylvie", "Tchéora", "Wendy", "Agnès",
    "Bénédicte", "Clarisse", "Dorcas", "Esther",
)

PRENOMS_M = (
    "Abel", "Blaise", "Cédric", "Dimitri", "Emmanuel", "Fernand", "Ghislain",
    "Hervé", "Ivan", "Jacques", "Karim", "Lucien", "Maurice", "Narcisse",
    "Olivier", "Parfait", "Rodrigue", "Serge", "Tanus", "Ulrich", "Victor",
    "Wilibon", "Yves", "Zachée", "Arsène",
)

NOMS = (
    "Abena", "Bassong", "Belolo", "Djoumessi", "Eballe", "Fouda", "Himded",
    "Kamga", "Lontsi", "Mani", "Njoya", "Ngo Bell", "Ondoua", "Pefol",
    "Sadou", "Talla", "Um Nyobelle", "Voke", "Wakoolo", "Yeni", "Zanga",
    "Ambele", "Bekolo", "Chendjou", "Dongo",
)

LIENS = ("mère", "père", "tuteur", "oncle", "grand-mère")

QUARTIERS = (
    "Bonapriso", "Nkoabang", "Deido", "Akwa", "Bassa", "Makepe", "Yassa",
    "Logbaba", "New-Bell", "Bonabéri",
)

CLASSES = (
    ("CP2", 2, "salle 4", "madame Abena", 45, 225_000, 60_000, 0, 25_000, 3, 8),
    ("CE1", 3, "salle 7", "monsieur Kamga", 45, 255_000, 60_000, 45_000, 25_000, 3, 8),
    ("CM2", 5, "salle 2", "madame Ngo Bell", 40, 285_000, 60_000, 45_000, 30_000, 3, 7),
    ("6e", 7, "amphi A", "monsieur Talla", 50, 420_000, 75_000, 60_000, 35_000, 3, 7),
    ("3e", 10, "amphi C", "madame Djoumessi", 45, 480_000, 75_000, 60_000, 40_000, 4, 7),
    ("Tle D", 13, "labo 1", "monsieur Sadou", 35, 650_000, 0, 60_000, 55_000, 2, 5),
)

REMISES = (
    (0, ""),
    (25, "bourse d'excellence du conseil"),
    (15, "fratrie, deuxième enfant inscrit"),
    (10, "paiement anticipé des deux termes"),
)

TENEURS = ("Marie-Josée Ette", "Sister Ndong Bell")

MODES = ("especes", "especes", "especes", "momo_mtn", "momo_orange", "cheque")


def seed_database(db: Session) -> bool:
    if db.scalar(select(func.count(Ecole.id))):
        return False

    alea = random.Random(20_260_907)
    annee = annee_label(*ecole_annee_scolaire(maintenant().date()))
    ecole = _ecole()
    db.add(ecole)
    db.flush()

    db.add_all(
        [
            User(
                ecole_id=ecole.id,
                nom="Sister Ndong Bell",
                email="direction@tilleuls.cm",
                mot_de_passe=hash_password("Caisse2026!"),
                role="directrice",
            ),
            User(
                ecole_id=ecole.id,
                nom="Marie-Josée Ette",
                email="caisse@tilleuls.cm",
                mot_de_passe=hash_password("Caisse2026!"),
                role="comptable",
            ),
        ]
    )

    classes = _classes(db, ecole, annee)
    eleves = _eleves(db, ecole, classes, annee, alea)
    engagements = _engagements(db, ecole, eleves, alea)
    _payer(db, ecole, engagements, alea)
    relances.programme(db, ecole, annee)
    relances.relancer(db, ecole)
    _declarations(db, ecole)
    db.commit()
    return True


def _ecole() -> Ecole:
    return Ecole(
        nom="Groupe Scolaire Les Tilleuls",
        sigle="GSTL",
        genre="groupe",
        ville="Douala",
        quartier="Bonapriso",
        direction="Sister Ndong Bell",
        comptable="Marie-Josée Ette",
        telephone="+237233421805",
        date_rentree=RENTEE,
        fin_annee=FIN_ANNEE,
        abonnement=15_000,
        relance_avance=7,
        tolerance_retard=21,
        ton="courtois",
        mention_recu=(
            "Le reçu fait foi. Toute réclamation se fait à la caisse avant la "
            "fin du mois."
        ),
        whatsapp_actif=True,
        sms_actif=False,
        especes_actifs=True,
        momo_actif=True,
        orange_actif=True,
    )


def _classes(db: Session, ecole: Ecole, annee: str) -> list[tuple[Classe, int]]:
    feuilles: list[tuple[Classe, int]] = []
    for (
        label,
        niveau,
        salle,
        titulaire,
        effectif_max,
        scolarite,
        cantine,
        transport,
        autres,
        tranches,
        effectif,
    ) in CLASSES:
        classe = Classe(
            ecole_id=ecole.id,
            label=label,
            niveau=niveau,
            salle=salle,
            titulaire=titulaire,
            effectif_max=effectif_max,
            annee=annee,
            scolarite=scolarite,
            cantine=cantine,
            transport=transport,
            autres=autres,
            tranches=tranches,
        )
        db.add(classe)
        feuilles.append((classe, effectif))
    db.flush()
    return feuilles


def _eleves(
    db: Session,
    ecole: Ecole,
    classes: list[tuple[Classe, int]],
    annee: str,
    alea: random.Random,
) -> list[Eleve]:
    eleves: list[Eleve] = []
    numero = 0
    for classe, effectif in classes:
        for _ in range(effectif):
            numero += 1
            sexe = "F" if alea.getrandbits(1) else "M"
            prenom = alea.choice(PRENOMS_F if sexe == "F" else PRENOMS_M)
            nom = alea.choice(NOMS)
            tete = "6" if alea.getrandbits(1) else "2"
            eleve = Eleve(
                ecole_id=ecole.id,
                matricule=(
                    f"{classe.label.replace(' ', '').upper()}-"
                    f"{annee[:2]}{annee[-2:]}-{numero:03d}"
                ),
                prenoms=prenom,
                nom=nom,
                sexe=sexe,
                classe_id=classe.id,
                tuteur_nom=f"{alea.choice(PRENOMS_F + PRENOMS_M)} {nom}",
                tuteur_telephone=f"+237{tete}{alea.randint(50, 99)}{alea.randint(100000, 999999)}",
                tuteur_second=(
                    f"+2376{alea.randint(10, 99)}{alea.randint(100000, 999999)}"
                    if alea.getrandbits(1)
                    else ""
                ),
                tuteur_lien=alea.choice(LIENS),
                quartier=alea.choice(QUARTIERS),
                date_entree=RENTEE,
            )
            db.add(eleve)
            eleves.append(eleve)
    db.flush()
    return eleves


def _engagements(
    db: Session, ecole: Ecole, eleves: list[Eleve], alea: random.Random
) -> list[Engagement]:
    retards_volontaires = {alea.randrange(len(eleves)) for _ in range(7)}
    lignes: list[Engagement] = []
    for index, eleve in enumerate(eleves):
        classe = db.get(Classe, eleve.classe_id)
        pourcentage, motif = alea.choice(REMISES)
        brut = classe.scolarite + classe.cantine + classe.transport + classe.autres
        engagement = Engagement(
            ecole_id=ecole.id,
            eleve_id=eleve.id,
            annee=classe.annee,
            scolarite=classe.scolarite,
            cantine=classe.cantine,
            transport=classe.transport,
            autres=classe.autres,
            remise=brut * pourcentage // 100,
            motif_remise=motif,
            tranches=classe.tranches,
        )
        db.add(engagement)
        lignes.append((engagement, index in retards_volontaires))
    db.flush()

    engagements: list[Engagement] = []
    for engagement, en_retard in lignes:
        ancrage = None
        if en_retard:
            ancrage = date(2026, 10, 5) if engagement.id % 2 else date(2026, 9, 28)
        facturation.poser_echeances(db, engagement, RENTEE, premiere=ancrage)
        engagements.append(engagement)
    db.flush()
    return engagements


def _payer(
    db: Session, ecole: Ecole, engagements: list[Engagement], alea: random.Random
) -> None:
    """Quarante jours de guichet : des familles réglées, d'autres en retard."""
    for index, engagement in enumerate(engagements):
        eleve = db.get(Eleve, engagement.eleve_id)
        termes = facturation.triees(list(engagement.echeances))
        premier = termes[0]
        du = premier.montant
        choix = alea.random()
        if index % 11 == 0 or choix < 0.12:
            regles: list[int] = []
        elif choix < 0.5:
            regles = [du]
        elif choix < 0.75:
            regles = [arrondir(du * 0.6, alea)]
        elif choix < 0.9:
            regles = [arrondir(du * 0.35, alea)]
        else:
            second = termes[1] if len(termes) > 1 else premier
            regles = [du, arrondir(second.montant * 0.5, alea)]

        for montant in regles:
            if montant <= 0:
                continue
            jour = ouvrable(
                maintenant().date() - timedelta(days=alea.randint(1, 40))
            )
            minute = alea.choice((0, 12, 25, 40, 55))
            moment = datetime.combine(
                jour, time(hour=alea.randint(8, 15), minute=minute)
            )
            try:
                encaissement.encaisser(
                    db,
                    ecole,
                    eleve,
                    engagement.annee,
                    montant,
                    alea.choice(MODES),
                    reference(alea),
                    alea.choice(TENEURS),
                    "",
                    moment=moment,
                )
            except ValueError:
                continue
    db.flush()


def arrondir(montant: float, alea: random.Random) -> int:
    """Un parent ne compte pas des francs isolés : on arrondit au millier."""
    retour = int(montant) // 1000 * 1000
    return max(5_000, retour + alea.choice((0, 500)))


def ouvrable(value: date) -> date:
    while value.weekday() >= SAMEDI:
        value -= timedelta(days=1)
    return value


def reference(alea: random.Random) -> str:
    if alea.getrandbits(1):
        return f"MTN{alea.randrange(16_777_216):08X}"
    return f"OM{alea.randint(100000, 999999)}"


def _declarations(db: Session, ecole: Ecole) -> None:
    """Douze jours de caisse déclarés, dont une soirée avec un écart de 5 000."""
    from . import caisse

    today = maintenant().date()
    decalage = 0
    tenues = 0
    while tenues < 12:
        jour = today - timedelta(days=decalage)
        decalage += 1
        if jour.weekday() >= SAMEDI:
            continue
        tenues += 1
        etat = caisse.etat(db, ecole, jour)
        comptage = etat["attendu"] - (5_000 if tenues == 4 else 0)
        db.add(
            Journee(
                ecole_id=ecole.id,
                jour=jour,
                fond=50_000,
                comptage=max(0, comptage),
                tenu_par="Marie-Josée Ette",
                note=(
                    "Un billet de 5 000 manqué au comptage, le tiroir a été "
                    "rouvert deux fois."
                    if comptage != etat["attendu"]
                    else ""
                ),
                declaree=True,
            )
        )
    db.flush()


if __name__ == "__main__":
    import argparse

    from ..database import Base, SessionLocal, engine, init_db

    parser = argparse.ArgumentParser(
        description="Réinitialise les données de ÉCOLE CASH."
    )
    parser.add_argument(
        "--reset", action="store_true", help="Efface et recrée la base."
    )
    args = parser.parse_args()

    if args.reset:
        Base.metadata.drop_all(bind=engine)
    init_db()
    with SessionLocal() as session:
        cree = seed_database(session)
        print("Données de démonstration créées." if cree else "Base déjà remplie.")
