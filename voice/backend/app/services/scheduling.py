from __future__ import annotations

import secrets
from datetime import date, datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Appointment, Closure, Service
from ..utils import JOURS_FR, format_clock, format_day_fr, utcnow

LETTRES = "ABCDEFGHJKLMNPQRSTUVWXYZ"
JETONS = 4
MAX_ECRANS = 40


def fenetres(service: Service, weekday: int) -> list[tuple[time, time]]:
    return sorted((d.opens, d.closes) for d in service.days if d.weekday == weekday)


def premier_jour(service: Service, ref: date | None = None) -> date:
    return (ref or utcnow().date()) + timedelta(days=service.lead_days)


def dernier_jour(service: Service, ref: date | None = None) -> date:
    return (ref or utcnow().date()) + timedelta(days=service.horizon_days)


def ferme_ce_jour(day: date, closures: list[Closure]) -> Closure | None:
    for closure in closures:
        if closure.starts <= day <= closure.ends:
            return closure
    return None


def creneaux_jour(
    service: Service,
    day: date,
    closures: list[Closure],
    occupees: set[datetime],
    maintenant: datetime,
) -> list[datetime]:
    """Les cases vides d'une journée, posées sur le pas du guichet."""
    if ferme_ce_jour(day, closures):
        return []
    resultat = []
    for opens, closes in fenetres(service, day.weekday()):
        borne = datetime.combine(day, closes)
        curseur = datetime.combine(day, opens)
        while curseur + timedelta(minutes=service.duration_min) <= borne:
            if curseur > maintenant and curseur not in occupees:
                resultat.append(curseur)
            curseur += timedelta(minutes=service.step_min)
    return resultat


def occupees_db(db: Session, service_id: int, debut: date, fin: date) -> set[datetime]:
    """Les places déjà tenues sur une plage, d'un seul trait."""
    lignes = db.scalars(
        select(Appointment.starts_at).where(
            Appointment.service_id == service_id,
            Appointment.status != "annule",
            Appointment.starts_at >= datetime.combine(debut, time.min),
            Appointment.starts_at < datetime.combine(fin + timedelta(days=1), time.min),
        )
    )
    return set(lignes)


def disponibilites(
    db: Session,
    service: Service,
    *,
    a_partir_de: date | None = None,
    limit: int = 12,
    maintenant: datetime | None = None,
) -> list[datetime]:
    """La file des prochains créneaux libres, jour après jour."""
    maintenant = maintenant or utcnow()
    closures = _fermetures(db, service.organization_id)
    seuil = premier_jour(service, maintenant.date())
    debut = max(a_partir_de or seuil, seuil)
    fin = dernier_jour(service, maintenant.date())
    if debut > fin:
        return []
    horizon = min(fin, debut + timedelta(days=MAX_ECRANS))
    occupees = occupees_db(db, service.id, debut, horizon)
    sortie: list[datetime] = []
    jour = debut
    for _ in range(min(MAX_ECRANS, (fin - debut).days + 1)):
        sortie.extend(creneaux_jour(service, jour, closures, occupees, maintenant))
        if len(sortie) >= limit:
            break
        jour += timedelta(days=1)
    return sortie[:limit]


def semaines(db: Session, service: Service, jours: int = 10) -> list[dict]:
    """Le calendrier de la console : une ligne par jour, avec les places restantes."""
    maintenant = utcnow()
    closures = _fermetures(db, service.organization_id)
    debut = maintenant.date()
    fin = debut + timedelta(days=jours - 1)
    occupees = occupees_db(db, service.id, debut, fin)
    seuil = premier_jour(service, debut)
    lignes = []
    for pas in range(jours):
        jour = debut + timedelta(days=pas)
        if jour < seuil:
            continue
        places = creneaux_jour(service, jour, closures, occupees, maintenant)
        lignes.append(
            {
                "day": jour.isoformat(),
                "label": format_day_fr(jour),
                "closed": ferme_ce_jour(jour, closures) is not None,
                "free": len(places),
                "first": places[0].isoformat() if places else None,
            }
        )
    return lignes


def est_praticable(
    service: Service,
    start: datetime,
    maintenant: datetime | None = None,
    closures: list[Closure] = (),
) -> str | None:
    """None si le créneau tient debout, sinon la raison française de son refus."""
    maintenant = maintenant or utcnow()
    if start <= maintenant:
        return "Ce créneau est déjà passé."
    if start.date() < premier_jour(service, maintenant.date()):
        return f"Ce guichet se réserve {service.lead_days} jours à l'avance."
    if start.date() > dernier_jour(service, maintenant.date()):
        return "Au-delà de l'horizon du guichet, l'appelant est rappelé au comptoir."
    if not fenetres(service, start.weekday()):
        return f"Le guichet n'ouvre pas le {JOURS_FR[start.weekday()]}."
    fermeture = ferme_ce_jour(start.date(), closures)
    if fermeture:
        return f"Établissement fermé, {fermeture.reason.lower()}."
    for opens, closes in fenetres(service, start.weekday()):
        debut = datetime.combine(start.date(), opens)
        if debut > start:
            continue
        decalage = start - debut
        if decalage % timedelta(minutes=service.step_min):
            continue
        if start + timedelta(minutes=service.duration_min) <= datetime.combine(
            start.date(), closes
        ):
            return None
    return "Ce créneau ne tombe pas sur l'horloge du guichet."


def dejas_pris(db: Session, service_id: int, start: datetime) -> bool:
    return (
        db.scalar(
            select(Appointment.id).where(
                Appointment.service_id == service_id,
                Appointment.starts_at == start,
                Appointment.status != "annule",
            )
        )
        is not None
    )


def reserver(
    db: Session,
    organization_id: int,
    service: Service,
    caller_name: str,
    caller_phone: str,
    start: datetime,
    *,
    origin: str = "voix",
    note: str = "",
    maintenant: datetime | None = None,
) -> Appointment:
    """Pose le rendez-vous dans l'agenda. Lève ValueError si la place n'existe pas."""
    refuse = est_praticable(
        service, start, maintenant, _fermetures(db, organization_id)
    )
    if refuse:
        raise ValueError(refuse)
    if dejas_pris(db, service.id, start):
        raise ValueError("Un autre appelant a pris cette place entre-temps.")
    rendez_vous = Appointment(
        organization_id=organization_id,
        service_id=service.id,
        reference=reference(start),
        caller_name=caller_name,
        caller_phone=caller_phone,
        starts_at=start,
        duration_min=service.duration_min,
        origin=origin,
        note=note,
    )
    db.add(rendez_vous)
    db.flush()
    return rendez_vous


def reference(start: datetime) -> str:
    """Une référence courte, dictable au téléphone : RDV1211-KMPQ."""
    corps = "".join(secrets.choice(LETTRES) for _ in range(JETONS))
    return f"RDV{start.strftime('%d%m')}-{corps}"


def dicte_rendez_vous(appointment: Appointment) -> str:
    """Comment la voix annonce une place posée."""
    jour = format_day_fr(appointment.starts_at.date())
    heure = format_clock(appointment.starts_at.time())
    return f"{jour} à {heure}, référence {appointment.reference}."


def _fermetures(db: Session, org_id: int) -> list[Closure]:
    return list(
        db.scalars(
            select(Closure)
            .where(Closure.organization_id == org_id)
            .order_by(Closure.starts)
        )
    )
