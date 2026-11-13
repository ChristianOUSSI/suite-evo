from __future__ import annotations

import random
from collections import deque
from datetime import date, datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import (
    Answer,
    Appointment,
    Call,
    Closure,
    Contact,
    Dispatch,
    Line,
    MenuEntry,
    Message,
    Organization,
    Schedule,
    Service,
    ServiceDay,
    User,
)
from ..security import hash_password
from ..utils import format_clock, format_day_fr, normalize_phone, utcnow
from . import calendar_cm as calendrier
from . import scheduling, switching

DEMO_EMAIL = "standard@iswouri.cm"
DEMO_PASSWORD = "Voix2026!"

# statement : la question telle que l'agent l'a notée. body : ce que la voix dit.
REPONSES = [
    (
        "Quels sont vos horaires d'ouverture ?",
        "horaires ouverture ferme matin apres midi samedi jour ferie week-end heure",
        "L'institut ouvre l'accueil du lundi au vendredi, de 7 h 30 à 16 h 30. "
        "Le samedi, le guichet tient jusqu'à midi. La caisse ferme à 15 h. "
        "Après ces heures, laissez un message, un conseiller rappelle le lendemain.",
        "Accueil",
        "Touche 5 pour laisser un message, touche 0 pour parler à une personne.",
    ),
    (
        "Où se trouve le campus et comment entrer ?",
        "adresse campus plan carrefour route taxi badge entrée porte localisation",
        "Le campus est à Bonapriso, au carrefour Deïdos, entrée par la rue Njo-Njo. "
        "Les taxis collectifs s'arrêtent à la station Nkoar. À pied, six minutes "
        "depuis la rue de l'hôpital. Le badge se présente au poste de garde, "
        "la pièce d'identité reste déposée à l'accueil.",
        "Accueil",
        "Le plan d'accès part par SMS sur demande.",
    ),
    (
        "Combien coûte la scolarité et comment payer ?",
        "frais scolarité payement payer somme tarif tranche caisse combien cout "
        "facture échéance mobile money espèces",
        "Les frais de scolarité se règlent en trois tranches. La première arrive avant "
        "la rentrée, la deuxième en janvier, la troisième en avril. La caisse prend "
        "Mobile Money et les espèces du lundi au vendredi, de 12 h à 15 h. "
        "Un échéancier se demande à la scolarité, pièce en main.",
        "Scolarité",
        "Touche 4 pour un rendez-vous à la caisse.",
    ),
    (
        "Quelles pièces pour un dossier d'inscription ?",
        "inscription dossier piece copie diplome acte naissance bulletin photo "
        "justificatif domicile quittance déposer retirer",
        "Il faut l'acte de naissance, la copie certifiée du dernier diplôme, quatre "
        "bulletins, deux photos d'identité, la pièce d'identité en cours de validité, "
        "le justificatif de domicile et la quittance des frais. "
        "Le guichet reçoit les dépôts du lundi au vendredi, entre 8 h et 15 h.",
        "Scolarité",
        "Touche 2 pour un transfert direct à la scolarité.",
    ),
    (
        "Les bourses sur critères sociaux, jusqu'à quand ?",
        "bourse aide financement critère social remise réduction paiement dossier",
        "Les bourses sociales se demandent avant le 30 novembre. Le dossier "
        "prend le bulletin de salaire du foyer, l'avis d'imposition et une lettre "
        "manuscrite. La commission répond dans les six semaines, par écrit et appel.",
        "Scolarité",
        "Un conseiller rappelle pour les pièces manquantes.",
    ),
    (
        "Comment fonctionne l'internat et les repas ?",
        "internat chambre repas cantine restauration nourriture hébergement dortoir "
        "veillée nuit étage",
        "L'internat ferme ses portes à 22 h. Les repas sortent à 12 h 15 et à 18 h 30, "
        "avec une option sans porc et une alternative végétarienne notée à l'avance. "
        "Une nuit hors campus se signale au responsable d'étage avant 19 h.",
        "Internat",
        "Touche 6 pour joindre le service de l'internat.",
    ),
    (
        "Comment obtenir un relevé de notes ou un diplôme ?",
        "note relevé diplome attestation résultat bulletin imprimer retirer papier "
        "timbre commission",
        "Les relevés de notes s'impriment à la scolarité, sur présentation de la pièce "
        "d'identité. Le diplôme passe par la commission de juillet et se retire "
        "deux semaines plus tard. Une attestation de réussite sort le jour même, "
        "trois mille francs de droit de timbre.",
        "Scolarité",
        "Touche 1 pour les horaires du guichet.",
    ),
    (
        "Les rattrapages, à quelle date et dans quelle salle ?",
        "examen rattrapage épreuve convocation date salle calendrier ajourné absent "
        "certificat",
        "Les rattrapages tiennent la deuxième semaine de juin. La convocation arrive "
        "par SMS quarante-huit heures avant l'épreuve, avec la salle et l'heure. "
        "Une absence se justifie par un certificat dans les trois jours, sinon "
        "l'épreuve est notée zéro.",
        "Examens",
        "La liste des salles s'affiche dans le hall principal.",
    ),
    (
        "Une convention de stage, ça se dépose où ?",
        "stage entreprise convention tuteur insertion professionnel mémoire soutenance",
        "Le bureau des stages reçoit les conventions en trois exemplaires, signées par "
        "l'entreprise et par le tuteur. Le dépôt se fait du mardi au jeudi. "
        "La soutenance se planifie en avril, avec un passage de vingt minutes devant "
        "deux enseignants.",
        "Insertion",
        "Touche 4 pour un rendez-vous au bureau des stages.",
    ),
    (
        "Je conteste une facture, comment faire ?",
        "réclamation erreur facture litige contestation trop payé remboursement "
        "double débit comptable",
        "Une réclamation sur une facture se dépose par écrit à la caisse, en deux "
        "exemplaires tamponnés. Le financier répond sous huit jours, par courrier "
        "ou par appel. Un trop-perçu est reversé sur la tranche suivante, ou rendu en "
        "espèces après validation du comptable.",
        "Finances",
        "Touche 3 pour parler à un responsable de la caisse.",
    ),
]

NOM_APPELANTS = [
    "Alima Diallo",
    "Serge Kamga",
    "Niama Bello",
    "Patrick Ondoa",
    "Clarisse Eboa",
    "Yves-Marie Talla",
    "Rachida Manou",
    "Blaise Njoya",
    "Josiane Mbé",
    "Aboubakar Sali",
    "Caroline Ngo Bassong",
    "Thierry Soulé",
    "Aïchatou Bello",
    "Gustave Ajong",
    "Martine Bekolo",
    "Landry Fokam",
    "Hadiya Nour",
    "Étienne Massena",
    "Solange Tiberglien",
    "Marc-Antoine Ongené",
]

MOTIFS_MESSAGES = [
    ("Awa Njoya", "6 94 21 63 08", "simple",
     "Le père d'élève passe chercher l'attestation de scolarité jeudi matin, "
     "il repart avant midi.", 180),
    ("Roger Timba", "6 77 55 02 41", "note",
     "Réclamation sur un trop-perçu de trente-cinq mille francs. "
     "Demande le nom du comptable.", 420),
    ("Blessing Ekema", "6 55 18 40 92", "urgent",
     "Sa fille n'est pas rentrée de l'internat à 22 h. "
     "Veut parler au responsable d'étage tout de suite.", 720),
    ("Ferrand Ngwa", "6 86 40 15 33", "simple",
     "Livreur de papier, demande le numéro de l'intendance pour la tournée de lundi.",
     960),
    ("Sylvie Mbarga", "6 99 70 14 22", "note",
     "Maman d'une élève de terminale, veut savoir si la bourse passe avant la rentrée.",
     21),
    ("Ibrahim Bello", "6 70 33 98 15", "simple",
     "Demande le report de la deuxième tranche à février. A déjà réglé la première.",
     55),
    ("Nadège Ondoua", "6 58 42 77 63", "note",
     "Absence de son fils pour trois jours, certificat médical à déposer.", 480),
    ("Petit-Fils Kana", "6 77 09 88 74", "simple",
     "La coopérative veut le nom du responsable de la cantine pour livrer.", 4),
]


# Le Wouri parle français et anglais : cinq fiches portent leur traduction.
TRADUCTIONS = {
    0: (
        "What are your opening hours?",
        "hours opening close morning afternoon saturday holiday weekend time",
        "The institute opens its front desk from Monday to Friday, 7:30 to 16:30. "
        "On Saturday the counter closes at noon and the cash desk at 15:00. "
        "After those hours, leave a message and an officer calls back next day.",
    ),
    1: (
        "Where is the campus and how do I get in?",
        "address campus map junction taxi badge gate entrance",
        "The campus is in Bonapriso, at Deïdos junction, entered from Njo-Njo street. "
        "Shared taxis stop at Nkoar station. Six minutes on foot from hospital road. "
        "Show your badge at the guard post and leave your ID at the front desk.",
    ),
    2: (
        "How much is tuition and how do I pay?",
        "fees tuition payment amount instalment cash invoice mobile money",
        "Tuition is paid in three instalments: before the start of term, in January "
        "and in April. The cash desk takes Mobile Money and cash, Monday to Friday, "
        "12:00 to 15:00. A payment plan is requested at the registrar's office.",
    ),
    3: (
        "Which documents does an admission file need?",
        "registration file copy diploma birth certificate photo ID proof",
        "You need the birth certificate, a certified copy of the last diploma, four "
        "report cards, two ID photos, a valid ID card, proof of address and the fee "
        "receipt. Files are received Monday to Friday between 8:00 and 15:00.",
    ),
    5: (
        "Boarding meals and times",
        "boarding meals breakfast dinner dormitory absence",
        "Breakfast is served from 6:30, lunch at 12:30 and dinner at 18:30 in the "
        "boarding dining hall. Report an absence before 20:00 so the kitchen can "
        "adjust the count for the next morning.",
    ),
}

# Le carnet de l'accueil : qui appelle, sous quelle qualité, comment la voix le salue.
CARNET = [
    ("Esther Ndoh", "parent", "maman Ndoh", "Fille en terminale D, section B."),
    (
        "Aboubakar Ibrahim",
        "parent",
        "monsieur Ibrahim",
        "Deux enfants, réclame les relevés.",
    ),
    (
        "Befaga Blaise",
        "fournisseur",
        "monsieur Blaise",
        "Livraisons de papier, mardi matin.",
    ),
    ("Dr Ngo Bell", "medecin", "docteur Ngo", "Visites médicales des internes."),
    (
        "Solange Metube",
        "administration",
        "madame Metube",
        "Contrôleur académique du siège.",
    ),
    ("Jean Paul Njo", "parent", "papa Njo", "Appelle toujours avant 8 h."),
    ("Grace Ashu", "eleve", "mademoiselle Ashu", "Déléguée de licence 2 Gestion."),
    (
        "Alphonse Edoa",
        "fournisseur",
        "monsieur Edoa",
        "Cantine, factures du trimestre.",
    ),
]

# Ce que l'accueil demande et qu'aucune fiche ne couvre encore. La voix note,
# le répertoire réclame une fiche.
QUESTIONS_SANS_FICHE = [
    "le transport scolaire passe t il par bonamoussadi le samedi",
    "est ce que vous hébergez les étudiants qui viennent d'ailleurs",
    "peut on régler la deuxième tranche en trois fois par mobile money",
    "le laboratoire d'informatique est il ouvert le samedi matin",
]

# Les anglophones du Sud-Ouest et du Nord-Ouest appellent le même standard.
APPELANTS_ANGLOPHONES = [
    "Njie Comfort",
    "Chia Emmanuel",
    "Tabi Laurence",
    "Fru Gilbert",
    "Awa Valentine",
]


def _jour_de(moment: datetime) -> str:
    return format_day_fr(moment.date())


def _numero(alea: random.Random) -> str:
    prefixe = alea.choice(["6 77", "6 99", "6 55", "6 86", "6 70", "6 94", "6 58"])
    queue = f"{alea.randint(10, 99)} {alea.randint(10, 99)} {alea.randint(10, 99)}"
    return normalize_phone(f"{prefixe} {queue}")


def _plages(
    ligne: Line | Service, db: Session, regles: list[tuple[int, int, time, time]]
) -> None:
    """Un trait d'horaires par jour couvert, du premier au dernier de la plage."""
    for debut, fin, ouvre, ferme in regles:
        for weekday in range(debut, fin + 1):
            if isinstance(ligne, Line):
                db.add(
                    Schedule(
                        line_id=ligne.id, weekday=weekday, opens=ouvre, closes=ferme
                    )
                )
            else:
                db.add(
                    ServiceDay(
                        service_id=ligne.id, weekday=weekday, opens=ouvre, closes=ferme
                    )
                )


def seed_database(db: Session) -> bool:
    if db.scalar(select(Organization.id)):
        return False

    aujourd_hui = utcnow().date()
    org = Organization(
        name="Institut Supérieur du Wouri",
        kind="universite",
        city="Douala",
        quartier="Bonapriso",
        main_line=normalize_phone("2 33 42 55 18"),
        agent_name="Naëlle",
        greeting="",
        greeting_en="",
        language="bilingue",
        tone="chaleureux",
        callback_minutes=90,
        plan="institution",
        monthly_fee=75_000,
        sms_price=8,
    )
    db.add(org)
    db.flush()

    db.add(
        User(
            organization_id=org.id,
            name="Régine Eballe",
            email=DEMO_EMAIL,
            password_hash=hash_password(DEMO_PASSWORD),
            role="standardiste",
        )
    )

    reponses: list[Answer] = []
    for index, (question, mots, corps, domaine, suite) in enumerate(REPONSES):
        anglais = TRADUCTIONS.get(index, ("", "", ""))
        answer = Answer(
            organization_id=org.id,
            statement=question,
            keywords=mots,
            body=corps,
            statement_en=anglais[0],
            keywords_en=anglais[1],
            body_en=anglais[2],
            area=domaine,
            follow_up=suite,
            hits=0,
            updated_at=utcnow() - timedelta(days=3 + index * 4),
        )
        db.add(answer)
        reponses.append(answer)
    db.flush()

    accueil = _poste(db, org, "Standard de Bonapriso", "2 33 42 55 18", 1, True, 2)
    scolarite = _poste(
        db, org, "Scolarité et inscriptions", "2 33 42 55 21", 2, True, 1
    )
    internat = _poste(
        db, org, "Internat et restauration", "2 33 42 55 24", 3, False
    )
    _plages(
        accueil,
        db,
        [(0, 4, time(7, 30), time(16, 30)), (5, 5, time(8, 0), time(12, 0))],
    )
    _plages(scolarite, db, [(0, 4, time(8, 0), time(15, 0))])
    _plages(
        internat,
        db,
        [
            (1, 1, time(11, 0), time(14, 0)),
            (3, 3, time(11, 0), time(14, 0)),
            (4, 4, time(17, 0), time(20, 0)),
        ],
    )

    dossier = Service(
        organization_id=org.id,
        name="retrait ou dépôt de dossier",
        room="guichet scolarité, bureau 3",
        duration_min=15,
        step_min=15,
        lead_days=1,
        horizon_days=10,
        note="La copie de la pièce d'identité suffit pour un dépôt.",
    )
    admission = Service(
        organization_id=org.id,
        name="entretien d'admission",
        room="salle conseil, premier étage",
        duration_min=30,
        step_min=30,
        lead_days=2,
        horizon_days=14,
        note="Vingt minutes d'échange, dix minutes de questions.",
    )
    caisse = Service(
        organization_id=org.id,
        name="règlement à la caisse",
        room="caisse, hall principal",
        duration_min=10,
        step_min=10,
        lead_days=0,
        horizon_days=7,
        note="Mobile Money ou espèces, pas de carte bancaire.",
    )
    db.add_all([dossier, admission, caisse])
    db.flush()

    _plages(
        dossier,
        db,
        [
            (0, 0, time(9, 0), time(12, 0)),
            (2, 2, time(9, 0), time(12, 0)),
            (4, 4, time(9, 0), time(12, 0)),
            (0, 0, time(14, 0), time(16, 0)),
            (2, 2, time(14, 0), time(16, 0)),
        ],
    )
    _plages(admission, db, [(0, 3, time(10, 0), time(12, 0))])
    _plages(caisse, db, [(0, 4, time(12, 0), time(15, 0))])

    db.add_all(
        [
            Closure(
                organization_id=org.id,
                starts=aujourd_hui + timedelta(days=6),
                ends=aujourd_hui + timedelta(days=6),
                reason="journée pédagogique",
                reason_en="in-service training day",
                kind="pedagogique",
            ),
            Closure(
                organization_id=org.id,
                starts=aujourd_hui + timedelta(days=21),
                ends=aujourd_hui + timedelta(days=28),
                reason="vacances du second trimestre",
                reason_en="second term holidays",
                kind="vacances",
            ),
        ]
    )

    _touche(
        db, accueil, "1", "Horaires et adresses", "reponse",
        answer=reponses[0], label_en="Opening hours and address",
    )
    _touche(
        db, accueil, "2", "Inscriptions et scolarité", "transfert", cible=scolarite,
        label_en="Admissions and registrar",
    )
    _touche(
        db, accueil, "3", "Frais de scolarité", "reponse", answer=reponses[2],
        label_en="Tuition fees",
    )
    _touche(
        db, accueil, "4", "Prendre rendez-vous au guichet", "rendezvous",
        service=dossier, label_en="Book a counter appointment",
    )
    _touche(
        db, accueil, "5", "Laisser un message", "message", label_en="Leave a message"
    )
    _touche(
        db, accueil, "6", "Internat et restauration", "transfert", cible=internat,
        label_en="Boarding and catering",
    )
    _touche(db, scolarite, "1", "Pièces du dossier", "reponse", answer=reponses[3])
    _touche(
        db, scolarite, "2", "Rendez-vous d'admission", "rendezvous",
        service=admission,
    )
    _touche(db, scolarite, "3", "Message à la scolarité", "message")
    _touche(
        db, internat, "1", "Repas et heures de l'internat", "reponse",
        answer=reponses[5],
    )
    _touche(db, internat, "2", "Prévenir d'une absence", "message")
    db.flush()

    alea = random.Random(20261026)
    references: set[str] = set()
    _agenda(db, org, [dossier, admission, caisse], alea, references)
    _fiches(db, org, [accueil, scolarite, internat], reponses, alea)
    _main_courante(db, org, [accueil, scolarite])
    _feries_nationales(db, org, aujourd_hui)
    _carnet(db, org, alea)
    _embouteillage(db, org, accueil, alea)
    _anglophones(db, org, accueil, reponses, alea)
    db.commit()
    return True


def _feries_nationales(db: Session, org: Organization, jour: date) -> None:
    """L'année en cours est déjà bouchée aux jours fériés connus."""
    posees = set(
        db.scalars(
            select(Closure.starts).where(Closure.organization_id == org.id)
        ).all()
    )
    for ligne in calendrier.feries(jour.year):
        if ligne["starts"] in posees or ligne["starts"] < jour:
            continue
        db.add(
            Closure(
                organization_id=org.id,
                starts=ligne["starts"],
                ends=ligne["ends"],
                reason=ligne["reason"],
                reason_en=ligne["reason_en"],
                kind="ferie",
            )
        )
        posees.add(ligne["starts"])


def _carnet(db: Session, org: Organization, alea: random.Random) -> None:
    """Les numéros que l'accueil connaît déjà, parents comme fournisseurs."""
    for nom, qualite, salutation, note in CARNET:
        db.add(
            Contact(
                organization_id=org.id,
                phone=normalize_phone(_numero(alea)),
                name=nom,
                tag=qualite,
                salutation=salutation,
                note=note,
                call_count=alea.randint(2, 26),
                first_seen=utcnow() - timedelta(days=alea.randint(60, 300)),
                last_seen=utcnow() - timedelta(hours=alea.randint(2, 300)),
            )
        )


def _embouteillage(
    db: Session, org: Organization, accueil: Line, alea: random.Random
) -> None:
    """Le jour des résultats : deux lignes, une file, des rappels promis."""
    instant = datetime.combine(
        utcnow().date() - timedelta(days=4), time(10, 0)
    )
    for rang in range(1, 7):
        moment = instant + timedelta(minutes=3 * rang)
        script = [
            f"Bonjour, Institut Supérieur du Wouri, Standard de Bonapriso. "
            "Naëlle vous écoute. Pour l'anglais, touche 9.",
            f"Voix : Toutes les lignes de Standard de Bonapriso sont prises, vous "
            f"êtes en file au rang {rang}. Gardez votre numéro ouvert, on vous "
            "rappelle dès qu'une place se libère.",
            "Voix : C'est noté. Un conseiller vous rappelle aujourd'hui avant "
            f"{format_clock((moment + timedelta(minutes=90)).time())}.",
        ]
        db.add(
            Call(
                organization_id=org.id,
                line_id=accueil.id,
                caller_phone=_numero(alea),
                caller_name=alea.choice(NOM_APPELANTS),
                started_at=moment,
                duration_sec=switching.duree_dictee(script),
                handled="voix",
                outcome="sature",
                transcript="\n".join(script),
            )
        )
        if rang <= 3:
            db.add(
                Message(
                    organization_id=org.id,
                    line_id=accueil.id,
                    from_name=alea.choice(NOM_APPELANTS),
                    from_phone=_numero(alea),
                    body=(
                        f"Rappel file d'attente, rang {rang}, "
                        f"{_jour_de(moment)}."
                    ),
                    urgency="simple",
                    promised_at=moment + timedelta(minutes=90),
                    status="rappelle" if rang == 1 else "nouveau",
                    recalled_at=moment + timedelta(minutes=70) if rang == 1 else None,
                    created_at=moment,
                )
            )


def _anglophones(
    db: Session,
    org: Organization,
    accueil: Line,
    reponses: list[Answer],
    alea: random.Random,
) -> None:
    """Quatre appels en anglais sur la semaine, le Littoral est bilingue."""
    for pas in range(1, 5):
        moment = datetime.combine(
            utcnow().date() - timedelta(days=pas), time(9, 30 + pas * 7)
        )
        fiche = reponses[2]
        script = [
            "Good morning, Institut Supérieur du Wouri, Standard de Bonapriso. "
            "Naëlle is listening. For French, press 9.",
            f"Voice : {fiche.body_en[:180]}",
            "Phone: the caller thanked the desk and hung up.",
        ]
        db.add(
            Call(
                organization_id=org.id,
                line_id=accueil.id,
                caller_phone=_numero(alea),
                caller_name=alea.choice(APPELANTS_ANGLOPHONES),
                started_at=moment,
                duration_sec=switching.duree_dictee(script),
                handled="voix",
                outcome="renseigne",
                language="en",
                answer_id=fiche.id,
                transcript="\n".join(script),
            )
        )
        fiche.hits += 1


def _poste(
    db: Session,
    org: Organization,
    label: str,
    numero: str,
    position: int,
    humain: bool,
    capacity: int = 0,
) -> Line:
    ligne = Line(
        organization_id=org.id,
        label=label,
        number=normalize_phone(numero),
        position=position,
        answered_by_human=humain,
        capacity=capacity,
    )
    db.add(ligne)
    db.flush()
    return ligne


def _touche(
    db: Session,
    ligne: Line,
    digit: str,
    label: str,
    action: str,
    *,
    answer: Answer | None = None,
    service: Service | None = None,
    cible: Line | None = None,
    label_en: str = "",
) -> None:
    db.add(
        MenuEntry(
            line_id=ligne.id,
            digit=digit,
            label=label,
            label_en=label_en,
            action=action,
            answer_id=answer.id if answer else None,
            service_id=service.id if service else None,
            target_line_id=cible.id if cible else None,
        )
    )


def _reference(moment: datetime, stock: set[str]) -> str:
    for _ in range(12):
        valeur = scheduling.reference(moment)
        if valeur not in stock:
            stock.add(valeur)
            return valeur
    valeur = f"{scheduling.reference(moment)}{len(stock) % 26}"
    stock.add(valeur)
    return valeur


def _agenda(
    db: Session,
    org: Organization,
    services: list[Service],
    alea: random.Random,
    stock: set[str],
) -> None:
    dossier, admission, caisse = services
    maintenant = utcnow()

    passes = [
        (dossier, maintenant - timedelta(days=9, hours=1), "venu", "voix"),
        (admission, maintenant - timedelta(days=7, hours=3), "venu", "console"),
        (caisse, maintenant - timedelta(days=5, hours=2), "manque", "voix"),
        (dossier, maintenant - timedelta(days=3, hours=1), "venu", "voix"),
        (admission, maintenant - timedelta(days=1, hours=4), "venu", "comptoir"),
    ]
    for index, (service, moment, statut, origine) in enumerate(passes):
        db.add(
            Appointment(
                organization_id=org.id,
                service_id=service.id,
                reference=_reference(moment, stock),
                caller_name=NOM_APPELANTS[index],
                caller_phone=_numero(alea),
                starts_at=moment.replace(second=0, microsecond=0),
                duration_min=service.duration_min,
                origin=origine,
                status=statut,
            )
        )

    futurs = [
        (dossier, 1, 9, "voix"),
        (dossier, 1, 10, "voix"),
        (admission, 3, 10, "console"),
        (caisse, 0, 12, "voix"),
        (admission, 4, 11, "voix"),
        (dossier, 5, 14, "comptoir"),
        (caisse, 8, 13, "voix"),
    ]
    for index, (service, jours, heure, origine) in enumerate(futurs):
        moment = datetime.combine(
            (maintenant + timedelta(days=jours)).date(), time(heure, 0)
        )
        appointment = Appointment(
            organization_id=org.id,
            service_id=service.id,
            reference=_reference(moment, stock),
            caller_name=NOM_APPELANTS[index + 6],
            caller_phone=_numero(alea),
            starts_at=moment,
            duration_min=service.duration_min,
            origin=origine,
            status="confirme",
            note="Redoublement demandé par la famille." if index == 3 else "",
        )
        db.add(appointment)
        db.flush()
        if index < 2:
            appointment.reminded_at = maintenant - timedelta(hours=4 * index + 1)
        db.add(
            Dispatch(
                organization_id=org.id,
                channel="sms",
                to_phone=appointment.caller_phone,
                body=(
                    f"{org.name} : votre place pour {service.name} est notée "
                    f"{moment.day}/{moment.month:02d} à {format_clock(moment.time())}. "
                    f"Référence {appointment.reference}."
                ),
                status="envoye",
                reference=f"DEM-{2400 + index:04d}",
                planned_at=moment - timedelta(days=1),
                sent_at=moment - timedelta(days=1),
            )
        )
    db.flush()


def _fiches(
    db: Session,
    org: Organization,
    lignes: list[Line],
    reponses: list[Answer],
    alea: random.Random,
) -> None:
    """Treize jours de standard, avec la répartition d'un accueil qui tourne."""
    maintenant = utcnow()
    model = [
        ("voix", "renseigne", "1", 0),
        ("voix", "renseigne", "3", 2),
        ("voix", "message", "5", None),
        ("voix", "rendezvous", "4", None),
        ("humain", "transfert", "2", None),
        ("voix", "transfert", "6", None),
        ("voix", "raccroche", "", None),
        ("messagerie", "hors_horaires", "", None),
    ]
    poids = [22, 18, 16, 12, 9, 7, 8, 8]
    sans_fiche = deque(QUESTIONS_SANS_FICHE * 2)
    for jour in range(12, -1, -1):
        cadence = 4 + (jour % 3) if jour else 3
        for _ in range(cadence):
            handled, outcome, digit, index = alea.choices(model, weights=poids)[0]
            moment = maintenant - timedelta(days=jour)
            heure = alea.randint(8, 16)
            if outcome == "hors_horaires":
                heure = alea.choice([6, 19, 21])
            moment = moment.replace(
                hour=heure, minute=alea.randint(0, 59), second=0, microsecond=0
            )
            if moment > maintenant:
                moment = maintenant - timedelta(minutes=alea.randint(4, 55))
            if digit:
                ligne = lignes[0]
            else:
                ligne = alea.choice(lignes)
            answer = reponses[index] if index is not None else None
            if answer:
                answer.hits += alea.choice([1, 1, 1, 2])
            question = ""
            if answer:
                question = answer.statement.lower()
            elif outcome in ("message", "raccroche") and sans_fiche:
                question = sans_fiche.popleft()
            db.add(
                Call(
                    organization_id=org.id,
                    line_id=ligne.id,
                    caller_phone=_numero(alea),
                    caller_name=alea.choice(NOM_APPELANTS),
                    started_at=moment,
                    duration_sec=alea.randint(28, 260),
                    handled=handled,
                    outcome=outcome,
                    digit=digit,
                    question=question,
                    answer_id=answer.id if answer else None,
                    transcript=_script(outcome, ligne, answer, org),
                )
            )
    db.flush()


def _script(outcome: str, ligne: Line, answer: Answer | None, org: Organization) -> str:
    entete = f"Voix : Bonjour, {org.name}, {ligne.label}. {org.agent_name} vous écoute."
    if outcome == "hors_horaires":
        return "\n".join(
            [
                f"Voix : Bonsoir, {org.name}, {ligne.label}. Le standard est fermé.",
                "Voix : Le poste reprend demain matin à 7 h 30.",
                "Bip. L'appelant a raccroché avant de parler sur la messagerie.",
            ]
        )
    if outcome == "raccroche":
        return "\n".join(
            [entete, "Téléphone : l'appelant a raccroché à la salutation."]
        )
    if outcome == "message":
        return "\n".join(
            [
                entete,
                "Voix : Dites votre message après le bip.",
                "Bip. Message reçu, rappel promis dans la fenêtre ouvrée.",
            ]
        )
    if outcome == "rendezvous":
        return "\n".join(
            [
                entete,
                "Voix : Retrait ou dépôt de dossier, c'est quinze minutes au guichet.",
                "Voix : C'est retenu, la référence part par SMS.",
                "SMS : confirmation envoyée, référence DEM.",
            ]
        )
    if outcome == "transfert":
        return "\n".join(
            [
                entete,
                f"Voix : Je vous passe {ligne.label}. Ne raccrochez pas, ça sonne.",
                "Poste : l'appel est arrivé au tableau, un conseiller a décroché.",
            ]
        )
    corps = answer.body if answer else "Le standard n'a pas trouvé la fiche."
    return "\n".join([entete, f"Voix : {corps}", "Téléphone : merci, c'est net."])


def _main_courante(db: Session, org: Organization, lignes: list[Line]) -> None:
    maintenant = utcnow()
    for index, (nom, tel, urgence, corps, minutes) in enumerate(MOTIFS_MESSAGES):
        arrive = maintenant - timedelta(minutes=minutes)
        if index < 2:
            statut, rappel = "rappelle", maintenant - timedelta(hours=3 - index)
            tenu = "Régine Eballe"
            note = "Rappel fait, dossier transmis à la caisse."
        elif index == 2:
            statut, rappel = "en_cours", None
            tenu = "Naëlle (voix)"
            note = "Transféré au responsable d'étage, pas de retour pour l'instant."
        else:
            statut, rappel, tenu, note = "nouveau", None, "", ""
        db.add(
            Message(
                organization_id=org.id,
                line_id=lignes[index % 2].id,
                from_name=nom,
                from_phone=normalize_phone(tel),
                body=corps,
                urgency=urgence,
                promised_at=arrive + timedelta(minutes=org.callback_minutes),
                status=statut,
                handled_by=tenu,
                handled_note=note,
                recalled_at=rappel,
                created_at=arrive,
            )
        )
        if statut == "nouveau" and index % 2:
            db.add(
                Dispatch(
                    organization_id=org.id,
                    channel="sms",
                    to_phone=normalize_phone(tel),
                    body=(
                        f"{org.name} : votre message est enregistré. "
                        "Un conseiller vous rappelle dans la journée."
                    ),
                    status="envoye",
                    reference=f"DEM-{3100 + index:04d}",
                    planned_at=arrive,
                    sent_at=arrive,
                )
            )
    db.flush()


if __name__ == "__main__":
    import argparse

    from ..database import Base, SessionLocal, engine, init_db

    parser = argparse.ArgumentParser(
        description="Réinitialise les données de CADC VOICE."
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
