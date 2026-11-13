from __future__ import annotations

from datetime import date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import (
    Answer,
    Call,
    Contact,
    Line,
    MenuEntry,
    Message,
    Organization,
    Service,
)
from ..utils import (
    MOIS_EN,
    format_clock,
    format_clock_en,
    format_date_fr,
    format_day_en,
    format_day_fr,
    utcnow,
)
from . import contacts as annuaire
from . import dispatch, hours, scheduling

MOTS_VIDES = {
    "le", "la", "les", "un", "une", "des", "du", "au", "aux", "et", "en", "dans",
    "sur", "pour", "par", "avec", "sans", "que", "qui", "quoi", "dont", "ou",
    "est", "sont", "etre", "je", "tu", "vous", "il", "elle", "on", "nous", "ce",
    "cet", "cette", "mon", "ma", "mes", "votre", "nos", "ne", "pas", "plus",
    "comment", "combien", "quand", "pouvez", "moi", "aussi", "svp", "madame",
    "monsieur", "bonjour", "bonsoir", "merci", "plaît", "allo", "allô",
    "the", "a", "an", "is", "are", "what", "when", "where", "how", "for",
    "with", "can", "you", "do", "does", "please", "hello", "good", "day",
}

LONGUEUR_DICTEE = 260
TOUCHE_HUMAIN = "0"
TOUCHE_LANGUE = "9"
TAILLE_FENETRE = 4
FENETRE_OCCUPATION = 25


def dictee(texte: str) -> str:
    """Une phrase que la voix peut lire sans respirer trois fois."""
    net = " ".join(texte.split())
    if len(net) <= LONGUEUR_DICTEE:
        return net
    coupe = net[:LONGUEUR_DICTEE].rsplit(". ", 1)
    return coupe[0] if len(coupe) > 1 and len(coupe[0]) > 60 else f"{coupe[0]}."


def mots(texte: str) -> set[str]:
    propres = "".join(c if c.isalnum() else " " for c in texte.lower())
    return {mot for mot in propres.split() if len(mot) > 3 and mot not in MOTS_VIDES}


def code_langue(org: Organization, demande: str | None = None) -> str:
    if demande in ("fr", "en"):
        return demande
    return "en" if org.language == "en" else "fr"


def bilingue(org: Organization) -> bool:
    return org.language == "bilingue"


def orateur(code: str) -> str:
    return "Voice" if code == "en" else "Voix"


def dic(code: str, francais: str, anglais: str) -> str:
    """Une réplique de la voix, dans la langue de l'appelant."""
    texte = anglais if code == "en" else francais
    return f"{orateur(code)} : {dictee(texte)}"


def accroche(
    org: Organization,
    line: Line,
    moment: datetime,
    ouverte: bool,
    code: str = "fr",
    contact: Contact | None = None,
) -> str:
    """La première ligne de la dictée, avec celui qui parle comme les autres."""
    return f"{orateur(code)} : {salutation(org, line, moment, ouverte, code, contact)}"


def jour(moment: datetime, code: str) -> str:
    return format_day_en(moment.date()) if code == "en" else format_day_fr(
        moment.date()
    )


def horloge(moment: datetime, code: str) -> str:
    return format_clock_en(moment.time()) if code == "en" else format_clock(
        moment.time()
    )


def date_longue(value: date, code: str) -> str:
    if code == "en":
        return f"{value.day} {MOIS_EN[value.month - 1]} {value.year}"
    return format_date_fr(value)


def salutation(
    org: Organization,
    line: Line,
    moment: datetime,
    ouverte: bool,
    code: str = "fr",
    contact: Contact | None = None,
) -> str:
    """L'accroche du standard, celle que l'appelant entend dans la première seconde."""
    consigne = (org.greeting_en if code == "en" else org.greeting) or ""
    if consigne.strip():
        base = consigne.strip().replace("{etablissement}", org.name)
        base = base.replace("{ligne}", line.label).replace("{agent}", org.agent_name)
        return dictee(base)
    qui = annuaire.dictee(contact)
    si_tard = moment.hour >= 18
    if code == "en":
        politesse = "Good evening" if si_tard else "Good morning"
        socle = f"{politesse}, {org.name}, {line.label}."
        if qui:
            socle = f"{politesse} {qui.title()}, {org.name}, {line.label}."
        base = (
            f"{socle} The standard is closed for now."
            if not ouverte
            else f"{socle} {org.agent_name} is listening."
        )
    else:
        politesse = "Bonsoir" if si_tard else "Bonjour"
        socle = f"{politesse}, {org.name}, {line.label}."
        if qui:
            socle = f"{politesse} {qui}, {org.name}, {line.label}."
        base = (
            f"{socle} Le standard est fermé pour l'instant."
            if not ouverte
            else f"{socle} {org.agent_name} vous écoute."
        )
    if bilingue(org) and ouverte:
        base += (
            " For French, press 9." if code == "en" else " Pour l'anglais, touche 9."
        )
    return dictee(base)


def touches(line: Line, ouverte: bool) -> list[MenuEntry]:
    """Les touches qui sonnent maintenant. Fermé, seule la demande de message tient."""
    entries = sorted(line.menu, key=lambda e: int(e.digit))
    if ouverte:
        return entries
    return [e for e in entries if e.action == "message"]


def libelle(entree: MenuEntry, code: str) -> str:
    if code == "en" and entree.label_en:
        return entree.label_en
    return entree.label


def trouve_reponse(
    db: Session, org_id: int, question: str, code: str = "fr"
) -> Answer | None:
    """Le fonds de réponse : la fiche qui colle le mieux à ce que dit l'appelant."""
    demande = mots(question)
    if not demande:
        return None
    meilleure: Answer | None = None
    score_max = 0
    for answer in db.scalars(select(Answer).where(Answer.organization_id == org_id)):
        terrain = _terrain(answer, code)
        score = len(demande & terrain)
        if score > score_max:
            meilleure, score_max = answer, score
    return meilleure if score_max >= 2 else None


def _terrain(answer: Answer, code: str) -> set[str]:
    if code == "en" and (answer.statement_en or answer.keywords_en):
        return mots(
            f"{answer.statement_en} {answer.keywords_en} {answer.area} {answer.body_en}"
        )
    return mots(f"{answer.statement} {answer.keywords} {answer.area} {answer.body}")


def heure_de_rappel(org: Organization, moment: datetime) -> datetime:
    """L'heure tenue quand on promet un rappel à l'appelant."""
    return moment + timedelta(minutes=org.callback_minutes)


def lire_menu(line: Line, code: str = "fr") -> str:
    """Le menu dicté, dans l'ordre des touches."""
    if not line.menu:
        return dic(
            code,
            "Aucune touche n'est réglée sur ce poste.",
            "No key is set on this desk yet.",
        )
    ordonnees = sorted(line.menu, key=lambda e: int(e.digit))
    parties = [f"{e.digit}, {libelle(e, code).lower()}" for e in ordonnees]
    suite = (
        "To speak to a person, press 0."
        if code == "en"
        else "Pour une personne, touche 0."
    )
    return f"{orateur(code)} : " + " ; ".join(parties) + f". {suite}"


def occupation(db: Session, line: Line, moment: datetime) -> int:
    """Les appels encore en cours sur ce poste, celui qui arrive non compris."""
    borne = moment - timedelta(minutes=FENETRE_OCCUPATION)
    fiches = db.scalars(
        select(Call)
        .where(
            Call.line_id == line.id,
            Call.started_at <= moment,
            Call.started_at >= borne,
        )
        .order_by(Call.started_at.desc())
    ).all()
    return sum(
        1
        for fiche in fiches
        if fiche.started_at + timedelta(seconds=fiche.duration_sec) > moment
    )


def file_d_attente(db: Session, line: Line, jour_vise: date) -> int:
    """Le nombre de fois où le poste a été pris d'assaut aujourd'hui."""
    debut = datetime.combine(jour_vise, datetime.min.time())
    fiches = db.scalars(
        select(Call).where(
            Call.line_id == line.id,
            Call.outcome == "sature",
            Call.started_at >= debut,
        )
    ).all()
    return len(fiches)


def _ecrire(
    db: Session,
    org: Organization,
    line: Line | None,
    *,
    caller_phone: str,
    caller_name: str,
    moment: datetime,
    handled: str,
    outcome: str,
    digit: str,
    script: list[str],
    answer: Answer | None = None,
    appointment_id: int | None = None,
    code: str = "fr",
    question: str = "",
) -> Call:
    """La fiche d'appel, posée dans la main courante au moment où elle se remplit."""
    fiche = Call(
        organization_id=org.id,
        line_id=line.id if line else None,
        caller_phone=caller_phone,
        caller_name=caller_name,
        started_at=moment,
        duration_sec=duree_dictee(script),
        handled=handled,
        outcome=outcome,
        language=code,
        digit=digit,
        question=question.strip()[:300],
        answer_id=answer.id if answer else None,
        appointment_id=appointment_id,
        transcript="\n".join(script),
    )
    db.add(fiche)
    db.flush()
    return fiche


def duree_dictee(script: list[str]) -> int:
    """Ce que la lecture a pris, au rythme d'une voix posée : trois mots par seconde."""
    if not script:
        return 0
    nb_mots = sum(len(ligne.split()) for ligne in script)
    return max(15, min(600, round(nb_mots / 3) + 4 * len(script)))


def laisser_message(
    db: Session,
    org: Organization,
    line: Line | None,
    *,
    caller_name: str,
    caller_phone: str,
    body: str,
    urgency: str,
    moment: datetime,
    script: list[str],
    code: str = "fr",
) -> Message:
    """Le mot laissé par l'appelant, avec l'heure du rappel promis."""
    promised_at = heure_de_rappel(org, moment)
    mot = Message(
        organization_id=org.id,
        line_id=line.id if line else None,
        from_name=caller_name or ("Caller without a name" if code == "en"
                                  else "Appelant sans nom"),
        from_phone=caller_phone,
        body=body.strip(),
        urgency=urgency,
        language=code,
        promised_at=promised_at,
    )
    db.add(mot)
    db.flush()
    avant = horloge(promised_at, code)
    quand = (
        "today" if promised_at.date() == moment.date() else jour(promised_at, code)
    )
    script.append(
        dic(
            code,
            f"C'est noté. Un conseiller vous rappelle {quand} avant {avant}.",
            f"Noted. An officer calls you back {quand} before {avant}.",
        )
    )
    dispatch.accuser_message(db, org, mot, code=code)
    return mot


def lire_fiche(
    db: Session, answer: Answer, script: list[str], code: str = "fr"
) -> None:
    """La fiche du fonds lue à voix haute, puis comptée."""
    texte = answer.body_en if code == "en" and answer.body_en else answer.body
    script.append(dic(code, texte, texte))
    if answer.follow_up:
        script.append(dic(code, answer.follow_up, answer.follow_up))
    answer.hits += 1


def dicte_place(start: datetime, code: str) -> str:
    """Le créneau dit comme sur le billet : jour, date, heure."""
    if code == "en":
        return (
            f"{format_day_en(start.date())} at {format_clock_en(start.time())}"
        )
    return f"{format_day_fr(start.date())} à {format_clock(start.time())}"


def guichet(
    db: Session,
    org: Organization,
    service: Service,
    *,
    caller_name: str,
    caller_phone: str,
    moment: datetime,
    start: datetime | None,
    script: list[str],
    code: str = "fr",
) -> tuple[object | None, list[datetime]]:
    """Le guichet propose ses places, l'appelant en choisit une, la voix confirme."""
    places = scheduling.disponibilites(
        db, service, limit=TAILLE_FENETRE, maintenant=moment
    )
    if not places:
        horizon = date_longue(
            scheduling.dernier_jour(service, moment.date()), code
        )
        script.append(
            dic(
                code,
                f"{service.name} n'a plus de place avant le {horizon}. "
                "Laissez un message, le poste vous rappelle.",
                f"{service.name} has no slot before {horizon}. "
                "Leave a message and the desk will call you back.",
            )
        )
        return None, []
    if start is None:
        ecart = ", ".join(
            f"{jour(place, code)} at {horloge(place, code)}"
            if code == "en"
            else f"{jour(place, code)} à {horloge(place, code)}"
            for place in places[:3]
        )
        script.append(
            dic(
                code,
                f"{service.name}, c'est {service.duration_min} minutes. "
                f"Je peux vous poser {ecart}. Touchez la case qui vous arrange.",
                f"{service.name} takes {service.duration_min} minutes. "
                f"I can put you {ecart}. Press the slot that suits you.",
            )
        )
        return None, places
    try:
        rendez_vous = scheduling.reserver(
            db,
            org.id,
            service,
            caller_name or "Appelant sans nom",
            caller_phone,
            start,
            origin="voix",
            maintenant=moment,
        )
    except ValueError as erreur:
        script.append(dic(code, str(erreur), str(erreur)))
        nouvelles = scheduling.disponibilites(
            db, service, limit=TAILLE_FENETRE, maintenant=moment
        )
        return None, nouvelles
    rendez_vous.language = code
    salon = (
        f" It is in room {service.room}." if code == "en" and service.room
        else f" C'est salle {service.room}." if service.room else ""
    )
    place = dicte_place(rendez_vous.starts_at, code)
    script.append(
        dic(
            code,
            f"C'est retenu, {place}.{salon}",
            f"Booked, {place}.{salon}",
        )
    )
    dispatch.confirmer_rdv(db, org, rendez_vous, code=code)
    return rendez_vous, []


def passer_poste(
    db: Session,
    org: Organization,
    cible: Line,
    script: list[str],
    moment: datetime,
    code: str = "fr",
) -> str:
    """Le poste demandé décroche, ou la voix dit pourquoi il attend."""
    closures = hours.jours_fermes(db, org.id)
    if org.discretion:
        script.append(
            dic(
                code,
                "Ici on ne dit jamais qui se trouve dans l'établissement. "
                f"Je transmets votre demande à {cible.label}.",
                "We never confirm who is inside the building. "
                f"I will pass your request to {cible.label}.",
            )
        )
        return "voix"
    if hours.est_ouverte(cible, moment, closures):
        script.append(
            dic(
                code,
                f"Je vous passe {cible.label}. Ne raccrochez pas.",
                f"Putting you through to {cible.label}. Please hold.",
            )
        )
        return "humain"
    suite = hours.prochaine_ouverture(cible, moment, closures)
    if suite:
        script.append(
            dic(
                code,
                f"{cible.label} n'est pas là. Le poste reprend "
                f"{jour(suite, code)} à {horloge(suite, code)}. "
                "Laissez un message, il sera lu au retour.",
                f"{cible.label} is not in. The desk is back "
                f"{jour(suite, code)} at {horloge(suite, code)}. "
                "Leave a message, it is read on return.",
            )
        )
    else:
        script.append(
            dic(
                code,
                f"{cible.label} ne répond pas pour l'instant.",
                f"{cible.label} does not answer right now.",
            )
        )
    return "voix"


def demander_humain(
    db: Session,
    org: Organization,
    line: Line,
    script: list[str],
    moment: datetime,
    code: str = "fr",
) -> str:
    """La touche 0. Vrai humain si le poste est tenu, sinon la voix assume."""
    closures = hours.jours_fermes(db, org.id)
    if line.answered_by_human and hours.est_ouverte(line, moment, closures):
        script.append(
            dic(
                code,
                f"Je vous passe une personne. {org.agent_name} arrive.",
                f"Putting you to a person. {org.agent_name} is coming.",
            )
        )
        return "humain"
    suite = hours.prochaine_ouverture(line, moment, closures)
    quand = f" {jour(suite, code)} at {horloge(suite, code)}" if suite else ""
    quand_fr = f" {jour(suite, code)} à {horloge(suite, code)}" if suite else ""
    script.append(
        dic(
            code,
            f"Personne ne décroche en ce moment{quand_fr}. "
            "Votre message arrive directement dans leur carnet.",
            f"No one is picking up right now{quand}. "
            "Your message goes straight into their notebook.",
        )
    )
    return "voix"


def ouvrir(
    db: Session,
    org: Organization,
    line: Line,
    moment: datetime,
    code: str = "fr",
    caller_phone: str = "",
) -> dict:
    """Ce que la voix dit avant toute touche : salutation, menu ou message d'absence."""
    closures = hours.jours_fermes(db, org.id)
    ouverte = hours.est_ouverte(line, moment, closures)
    contact = annuaire.trouve(db, org.id, caller_phone)
    script = [accroche(org, line, moment, ouverte, code, contact)]
    suite = hours.prochaine_ouverture(line, moment, closures)
    if not ouverte:
        if suite:
            script.append(
                dic(
                    code,
                    f"Le standard reprend {jour(suite, code)} "
                    f"à {horloge(suite, code)}. Votre message est bien arrivé.",
                    f"The standard is back {jour(suite, code)} "
                    f"at {horloge(suite, code)}. Your message was received.",
                )
            )
        else:
            script.append(
                dic(
                    code,
                    "Les horaires du poste ne sont pas encore réglés. "
                    "Laissez un message, un conseiller vous reprendra.",
                    "This desk has no hours set yet. "
                    "Leave a message and an officer will get back to you.",
                )
            )
    return {
        "open": ouverte,
        "language": code,
        "script": script,
        "menu": [
            {"digit": e.digit, "label": libelle(e, code), "action": e.action}
            for e in touches(line, ouverte)
        ],
        "next_open": suite.isoformat() if suite else None,
    }


def traiter(
    db: Session,
    org: Organization,
    line: Line,
    *,
    caller_phone: str,
    caller_name: str = "",
    moment: datetime | None = None,
    digit: str | None = None,
    question: str = "",
    service_id: int | None = None,
    appointment_start: datetime | None = None,
    message_body: str = "",
    urgency: str = "simple",
    asks_human: bool = False,
    hang_up: bool = False,
    asked_for: str = "",
    langue: str | None = None,
) -> dict:
    """Un appel complet : la voix répond, agit, laisse la fiche à la main courante."""
    moment = moment or utcnow()
    code = code_langue(org, langue)
    closures = hours.jours_fermes(db, org.id)
    ouverte = hours.est_ouverte(line, moment, closures)
    contact = annuaire.enregistre(db, org, caller_phone, caller_name, moment=moment)
    if contact and not caller_name.strip():
        caller_name = contact.name
    script: list[str] = [accroche(org, line, moment, ouverte, code, contact)]
    choix = [
        {"digit": e.digit, "label": libelle(e, code), "action": e.action}
        for e in touches(line, ouverte)
    ]
    handled = "voix"
    outcome = "renseigne"
    answer: Answer | None = None
    appointment = None
    message = None
    places: list[datetime] = []

    if hang_up and not digit and not question:
        script.append(
            dic(
                code,
                "Téléphone : l'appelant a raccroché pendant la salutation.",
                "Phone: the caller hung up during the greeting.",
            )
        )
        fiche = _ecrire(
            db, org, line, caller_phone=caller_phone, caller_name=caller_name,
            moment=moment, handled="voix", outcome="raccroche", digit="",
            script=script, code=code,
        )
        return _bilan(fiche, script, ouverte, choix, places, code=code)

    if not ouverte:
        suite = hours.prochaine_ouverture(line, moment, closures)
        if suite:
            script.append(
                dic(
                    code,
                    f"Le standard reprend {jour(suite, code)} "
                    f"à {horloge(suite, code)}.",
                    f"The standard is back {jour(suite, code)} "
                    f"at {horloge(suite, code)}.",
                )
            )
        if message_body.strip():
            message = laisser_message(
                db, org, line, caller_name=caller_name, caller_phone=caller_phone,
                body=message_body, urgency=urgency, moment=moment, script=script,
                code=code,
            )
            outcome, handled = "message", "messagerie"
        else:
            outcome, handled = "hors_horaires", "messagerie"
            script.append(
                dic(
                    code,
                    "Bip. Silence sur la messagerie, l'appelant n'a rien laissé.",
                    "Beep. Silence on the voicemail, nothing was left.",
                )
            )
        fiche = _ecrire(
            db, org, line, caller_phone=caller_phone, caller_name=caller_name,
            moment=moment, handled=handled, outcome=outcome, digit=digit or "",
            script=script, code=code, question=question,
        )
        return _bilan(fiche, script, ouverte, choix, places, None, None, message,
                      code=code)

    if bilingue(org) and digit == TOUCHE_LANGUE and _touche(line, digit) is None:
        autre = "en" if code == "fr" else "fr"
        script.append(
            dic(
                autre,
                "Vous êtes passé en français.",
                "You have been switched to English.",
            )
        )
        script.append(lire_menu(line, autre))
        fiche = _ecrire(
            db, org, line, caller_phone=caller_phone, caller_name=caller_name,
            moment=moment, handled="voix", outcome="renseigne", digit=digit,
            script=script, code=autre,
        )
        return _bilan(fiche, script, ouverte, choix, places, code=autre)

    prises = occupation(db, line, moment)
    if line.capacity and prises >= line.capacity:
        rang = file_d_attente(db, line, moment.date()) + 1
        script.append(
            dic(
                code,
                f"Toutes les lignes de {line.label} sont prises, vous êtes en "
                f"file au rang {rang}. Gardez votre numéro ouvert, on vous "
                "rappelle dès qu'une place se libère.",
                f"All lines at {line.label} are busy, you are number {rang} "
                "in the queue. Keep your line open, we call back as soon as "
                "one frees up.",
            )
        )
        message = laisser_message(
            db, org, line, caller_name=caller_name, caller_phone=caller_phone,
            body=(
                f"Rappel file d'attente, rang {rang}, "
                f"{jour(moment, 'fr')}."
                if code == "fr"
                else f"Queue callback, number {rang}, "
                f"{jour(moment, 'en')}."
            ),
            urgency="simple",
            moment=moment,
            script=script,
            code=code,
        )
        outcome, handled = "sature", "voix"
        fiche = _ecrire(
            db, org, line, caller_phone=caller_phone, caller_name=caller_name,
            moment=moment, handled=handled, outcome=outcome, digit=digit or "",
            script=script, code=code, question=question,
        )
        return _bilan(fiche, script, ouverte, choix, places, None, None, message,
                      code=code)

    if asked_for.strip() and org.discretion:
        script.append(
            dic(
                code,
                f"Nous ne confirmons jamais la présence de {asked_for.strip()[:60]} "
                "ici. Je note votre demande et le poste s'occupera de la réponse.",
                f"We never confirm whether {asked_for.strip()[:60]} is here. "
                "I am noting your request and the desk will answer it.",
            )
        )
        message = laisser_message(
            db, org, line, caller_name=caller_name, caller_phone=caller_phone,
            body=(
                f"Demande de contact pour {asked_for.strip()[:120]}"
                if code == "fr"
                else f"Contact request for {asked_for.strip()[:120]}"
            ),
            urgency=urgency,
            moment=moment,
            script=script,
            code=code,
        )
        outcome = "message"
        fiche = _ecrire(
            db, org, line, caller_phone=caller_phone, caller_name=caller_name,
            moment=moment, handled="voix", outcome=outcome, digit=digit or "",
            script=script, code=code,
        )
        return _bilan(fiche, script, ouverte, choix, places, None, None, message,
                      code=code)

    if asks_human or digit == TOUCHE_HUMAIN:
        handled = demander_humain(db, org, line, script, moment, code)
        if handled == "humain":
            outcome = "transfert"
        elif message_body.strip():
            script.append(
                dic(
                    code,
                    "Bip. L'appelant laisse son mot.",
                    "Beep. The caller leaves a note.",
                )
            )
            message = laisser_message(
                db, org, line, caller_name=caller_name, caller_phone=caller_phone,
                body=message_body, urgency=urgency, moment=moment, script=script,
                code=code,
            )
            outcome = "message"
        else:
            outcome = "raccroche"
        fiche = _ecrire(
            db, org, line, caller_phone=caller_phone, caller_name=caller_name,
            moment=moment, handled=handled, outcome=outcome,
            digit=digit or TOUCHE_HUMAIN,
            script=script, code=code,
        )
        return _bilan(fiche, script, ouverte, choix, places, None, None, message,
                      code=code)

    if question.strip() and not digit:
        answer = trouve_reponse(db, org.id, question, code)
        if answer:
            lire_fiche(db, answer, script, code)
            outcome = "renseigne"
        else:
            script.append(
                dic(
                    code,
                    f"Je ne trouve pas dans le répertoire. {org.agent_name} note "
                    "la question et vous rappelle.",
                    "I cannot find that in the directory. "
                    f"{org.agent_name} is noting the question and will call back.",
                )
            )
            message = laisser_message(
                db, org, line, caller_name=caller_name, caller_phone=caller_phone,
                body=(
                    f"Question hors répertoire : {question.strip()}"
                    if code == "fr"
                    else f"Question outside the directory: {question.strip()}"
                ),
                urgency="note",
                moment=moment,
                script=script,
                code=code,
            )
            outcome = "message"
        fiche = _ecrire(
            db, org, line, caller_phone=caller_phone, caller_name=caller_name,
            moment=moment, handled="voix", outcome=outcome, digit="", script=script,
            answer=answer, code=code, question=question,
        )
        return _bilan(
            fiche, script, ouverte, choix, places, answer, None, message, code=code
        )

    entree = _touche(line, digit)
    if entree is None:
        script.append(
            dic(
                code,
                f"La touche {digit} n'existe pas sur ce poste.",
                f"Key {digit} does not exist on this desk.",
            )
        )
        script.append(lire_menu(line, code))
        script.append(
            dic(
                code,
                "Téléphone : l'appelant a raccroché sans choisir.",
                "Phone: the caller hung up without choosing.",
            )
        )
        fiche = _ecrire(
            db, org, line, caller_phone=caller_phone, caller_name=caller_name,
            moment=moment, handled="voix", outcome="raccroche", digit=digit or "",
            script=script, code=code,
        )
        return _bilan(fiche, script, ouverte, choix, places, code=code)

    if entree.action == "reponse":
        answer = db.get(Answer, entree.answer_id) if entree.answer_id else None
        if answer:
            lire_fiche(db, answer, script, code)
            outcome = "renseigne"
        else:
            script.append(
                dic(
                    code,
                    f"{libelle(entree, code)}, la réponse est en cours de rédaction. "
                    "Un conseiller vous rappelle.",
                    f"{libelle(entree, code)}, the answer is still being written. "
                    "An officer will call you back.",
                )
            )
            outcome = "message"
    elif entree.action == "rendezvous":
        service = db.get(Service, service_id or entree.service_id)
        if service is None or service.organization_id != org.id:
            script.append(
                dic(
                    code,
                    f"{libelle(entree, code)}, le guichet n'est pas encore ouvert. "
                    "Laissez un message.",
                    f"{libelle(entree, code)}, the desk is not open yet. "
                    "Leave a message.",
                )
            )
            outcome = "message"
        else:
            titre = libelle(entree, code)
            script.append(dic(code, f"{titre}.", f"{titre}."))
            appointment, places = guichet(
                db, org, service, caller_name=caller_name, caller_phone=caller_phone,
                moment=moment, start=appointment_start, script=script, code=code,
            )
            if appointment:
                outcome = "rendezvous"
            else:
                outcome = "raccroche" if hang_up else "renseigne"
    elif entree.action == "message":
        if message_body.strip():
            script.append(
                dic(
                    code,
                    "Bip. L'appelant laisse son mot.",
                    "Beep. The caller leaves a note.",
                )
            )
            message = laisser_message(
                db, org, line, caller_name=caller_name, caller_phone=caller_phone,
                body=message_body, urgency=urgency, moment=moment, script=script,
                code=code,
            )
            outcome = "message"
        else:
            script.append(
                dic(
                    code,
                    "Dites votre message après le bip.",
                    "Please record your message after the beep.",
                )
            )
            script.append(
                dic(
                    code,
                    "Bip. L'appelant a raccroché avant de parler.",
                    "Beep. The caller hung up before speaking.",
                )
            )
            outcome = "raccroche"
    else:
        cible = db.get(Line, entree.target_line_id) if entree.target_line_id else None
        if cible and cible.organization_id == org.id:
            titre = libelle(entree, code)
            script.append(dic(code, f"{titre}.", f"{titre}."))
            handled = passer_poste(db, org, cible, script, moment, code)
            outcome = "transfert"
            if handled == "voix" and message_body.strip():
                message = laisser_message(
                    db, org, cible, caller_name=caller_name, caller_phone=caller_phone,
                    body=message_body, urgency=urgency, moment=moment, script=script,
                    code=code,
                )
        else:
            script.append(
                dic(
                    code,
                    f"{libelle(entree, code)}, le poste demandé n'est pas joignable. "
                    "Je garde un message.",
                    f"{libelle(entree, code)}, that desk cannot be reached. "
                    "I will keep a message.",
                )
            )
            outcome = "message"

    fiche = _ecrire(
        db, org, line, caller_phone=caller_phone, caller_name=caller_name,
        moment=moment, handled=handled, outcome=outcome, digit=entree.digit,
        script=script, answer=answer,
        appointment_id=appointment.id if appointment else None,
        code=code, question=question,
    )
    return _bilan(
        fiche, script, ouverte, choix, places, answer, appointment, message, code=code
    )


def _touche(line: Line, digit: str | None) -> MenuEntry | None:
    if not digit:
        return None
    for entry in line.menu:
        if entry.digit == digit:
            return entry
    return None


def _bilan(
    fiche: Call,
    script: list[str],
    ouverte: bool,
    choix: list[dict],
    places: list[datetime],
    answer: Answer | None = None,
    appointment=None,
    message: Message | None = None,
    code: str = "fr",
) -> dict:
    """Le retour de la console : ce qui s'est dit, ce qui s'est posé."""
    return {
        "call_id": fiche.id,
        "moment": fiche.started_at.isoformat(),
        "open": ouverte,
        "language": code,
        "handled": fiche.handled,
        "outcome": fiche.outcome,
        "duration_sec": fiche.duration_sec,
        "script": script,
        "menu": choix,
        "slots": [p.isoformat() for p in places],
        "answer_id": answer.id if answer else None,
        "appointment_id": appointment.id if appointment else None,
        "message_id": message.id if message else None,
    }
