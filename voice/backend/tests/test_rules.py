from datetime import date, datetime, time

from app.models import Closure, Line, Schedule, Service, ServiceDay
from app.services import hours, scheduling, switching
from app.utils import format_phone, normalize_phone

HUIT_HEURES = time(8, 0)
SEIZE_HEURES = time(16, 0)
LUNDI_26 = date(2026, 10, 26)


def une_ligne(avec_samedi: bool = False) -> Line:
    ligne = Line(id=1, organization_id=1, label="Standard", number="+237233425518")
    jours = [0, 1, 2, 3, 4] + ([5] if avec_samedi else [])
    ligne.schedules = [
        Schedule(weekday=jour, opens=HUIT_HEURES, closes=SEIZE_HEURES) for jour in jours
    ]
    ligne.menu = []
    return ligne


def un_guichet(lead: int = 1, horizon: int = 10) -> Service:
    service = Service(
        id=1,
        organization_id=1,
        name="retrait de dossier",
        room="bureau 3",
        duration_min=15,
        step_min=15,
        lead_days=lead,
        horizon_days=horizon,
    )
    service.days = []
    return service


def test_numeros_camerounais_se_canonisent():
    assert normalize_phone("6 77 08 41 96") == "+237677084196"
    assert normalize_phone("00237 699 30 77 24") == "+237699307724"
    assert normalize_phone("+237233425518") == "+237233425518"
    assert normalize_phone("677 08 41") is None
    assert normalize_phone("") is None


def test_numeros_se_relisent_au_rythme_local():
    assert format_phone("+237677084196") == "6 77 08 41 96"
    assert format_phone("+237233425518") == "2 33 42 55 18"
    assert format_phone(None) == ""


def test_le_standard_décroche_pendant_la_fenêtre():
    ligne = une_ligne()
    assert hours.est_ouverte(ligne, datetime(2026, 10, 26, 9, 15))
    assert not hours.est_ouverte(ligne, datetime(2026, 10, 26, 7, 15))
    assert not hours.est_ouverte(ligne, datetime(2026, 10, 26, 16, 0))
    assert not hours.est_ouverte(ligne, datetime(2026, 10, 25, 10, 0))


def test_la_fermeture_passe_avant_les_horaires():
    ligne = une_ligne()
    fermeture = Closure(
        starts=LUNDI_26, ends=date(2026, 10, 28), reason="journée pédagogique"
    )
    moment = datetime(2026, 10, 26, 10, 0)
    assert not hours.est_ouverte(ligne, moment, [fermeture])
    suite = hours.prochaine_ouverture(ligne, moment, [fermeture])
    assert suite == datetime(2026, 10, 29, 8, 0)


def test_la_voix_annonce_la_reprise_après_une_fermeture():
    ligne = une_ligne()
    fermeture = Closure(starts=LUNDI_26, ends=date(2026, 10, 28), reason="grève")
    texte = hours.dicte_horaires(ligne, [fermeture], datetime(2026, 10, 26, 10, 0))
    assert "lundi" in texte
    assert "08 h 00" in texte
    assert "grève" in texte
    assert "—" not in texte and "–" not in texte


def test_un_samedi_se_résume_en_une_ligne():
    ligne = une_ligne()
    ligne.schedules.append(Schedule(weekday=5, opens=time(9, 0), closes=time(9, 45)))
    assert hours.resume_journee(ligne, date(2026, 10, 31), []) == "09 h 00 à 09 h 45"
    assert hours.resume_journee(ligne, date(2026, 11, 1), []) == "fermé"


def test_un_guichet_sans_jour_noffre_aucune_place():
    assert scheduling.fenetres(un_guichet(), 0) == []


def test_les_places_suivent_le_pas_du_guichet():
    service = un_guichet(lead=0, horizon=7)
    service.days = [ServiceDay(weekday=0, opens=time(9, 0), closes=time(9, 45))]
    places = scheduling.creneaux_jour(
        service, LUNDI_26, [], set(), datetime(2026, 10, 26, 7, 0)
    )
    assert [p.strftime("%H:%M") for p in places] == ["09:00", "09:15", "09:30"]


def test_une_place_prise_disparaît_de_la_file():
    service = un_guichet(lead=0, horizon=7)
    service.days = [ServiceDay(weekday=0, opens=time(9, 0), closes=time(9, 30))]
    occupee = datetime(2026, 10, 26, 9, 0)
    places = scheduling.creneaux_jour(
        service, occupee.date(), [], {occupee}, datetime(2026, 10, 26, 7, 0)
    )
    assert places == [datetime(2026, 10, 26, 9, 15)]


def test_le_passé_et_le_hors_grille_sont_refusés():
    service = un_guichet(lead=0, horizon=7)
    service.days = [ServiceDay(weekday=0, opens=time(9, 0), closes=time(10, 0))]
    assert (
        scheduling.est_praticable(
            service, datetime(2026, 10, 26, 8, 0), datetime(2026, 10, 26, 9, 0)
        )
        == "Ce créneau est déjà passé."
    )
    assert (
        scheduling.est_praticable(
            service, datetime(2026, 10, 26, 9, 7), datetime(2026, 10, 26, 8, 0)
        )
        == "Ce créneau ne tombe pas sur l'horloge du guichet."
    )
    assert (
        scheduling.est_praticable(
            service, datetime(2026, 10, 26, 9, 50), datetime(2026, 10, 26, 8, 0)
        )
        == "Ce créneau ne tombe pas sur l'horloge du guichet."
    )


def test_la_veille_d_une_fermeture_se_refuse_aussi():
    service = un_guichet(lead=0, horizon=7)
    service.days = [ServiceDay(weekday=0, opens=time(9, 0), closes=time(10, 0))]
    fermeture = Closure(starts=LUNDI_26, ends=LUNDI_26, reason="rentrée décalée")
    refus = scheduling.est_praticable(
        service, datetime(2026, 10, 26, 9, 0), datetime(2026, 10, 23, 8, 0), [fermeture]
    )
    assert refus == "Établissement fermé, rentrée décalée."


def test_la_référence_se_dict_au_téléphone():
    valeur = scheduling.reference(datetime(2026, 11, 12, 9, 0))
    assert valeur.startswith("RDV1211-")
    assert len(valeur) == 12
    assert valeur[8:].isalpha()


def test_le_répertoire_ne_garde_que_les_mots_qui_comptent():
    selection = switching.mots("combien coûte la scolarité et comment payer")
    assert {"coûte", "scolarité", "payer"} <= selection
    assert "scolarité" in switching.mots("les frais de scolarité, c'est quand")
    assert switching.mots("bonjour, s'il vous plaît") == set()


def test_la_dictee_ne_dépasse_pas_trois_phrases():
    longue = ". ".join(["Ceci est une phrase de test assez longue pour la voix"] * 12)
    courte = switching.dictee(longue)
    assert len(courte) <= 260
    assert courte.count(".") < 12


def test_la_salutation_tient_en_une_respiration():
    class Etablissement:
        name = "Institut Supérieur du Wouri"
        greeting = ""
        agent_name = "Naëlle"
        language = "fr"

    texte = switching.salutation(
        Etablissement(), une_ligne(), datetime(2026, 10, 26, 9, 0), True
    )
    assert texte.startswith("Bonjour")
    assert "Institut Supérieur du Wouri" in texte
    assert "—" not in texte and "–" not in texte

    soir = switching.salutation(
        Etablissement(), une_ligne(), datetime(2026, 10, 26, 20, 0), False
    )
    assert soir.startswith("Bonsoir")
    assert "fermé" in soir
