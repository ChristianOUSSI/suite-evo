from __future__ import annotations

from datetime import date, datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Closure, Line
from ..utils import JOURS_FR, format_clock, format_day_fr

JOURS_SEMAINE = 7


def jour_ouvre(line: Line, weekday: int) -> list[tuple[time, time]]:
    """Les fenêtres d'un jour, dans l'ordre de la matinée."""
    return [(s.opens, s.closes) for s in line.schedules if s.weekday == weekday]


def fermeture_du_jour(day: date, closures: list[Closure]) -> Closure | None:
    for closure in closures:
        if closure.starts <= day <= closure.ends:
            return closure
    return None


def est_ouverte(line: Line, moment: datetime, closures: list[Closure] = ()) -> bool:
    """La ligne décroche-t-elle à cette seconde ?"""
    if fermeture_du_jour(moment.date(), closures):
        return False
    fenetres = jour_ouvre(line, moment.weekday())
    return any(opens <= moment.time() < closes for opens, closes in fenetres)


def prochaine_ouverture(
    line: Line, moment: datetime, closures: list[Closure] = ()
) -> datetime | None:
    """Le prochain instant où le standard sera là, None s'il n'y a plus d'horaire."""
    for pas in range(0, 60):  # deux mois de veille, au-delà rien n'est garanti
        jour = moment.date() + timedelta(days=pas)
        if fermeture_du_jour(jour, closures):
            continue
        for opens, _ in jour_ouvre(line, jour.weekday()):
            candidat = datetime.combine(jour, opens)
            if candidat > moment:
                return candidat
    return None


def dicte_horaires(line: Line, closures: list[Closure], moment: datetime) -> str:
    """La phrase d'horaires que la voix lit à l'appelant."""
    parties = []
    for weekday in range(JOURS_SEMAINE):
        fenetres = sorted(jour_ouvre(line, weekday))
        if not fenetres:
            continue
        creneaux = ", ".join(
            f"{format_clock(o)} à {format_clock(c)}" for o, c in fenetres
        )
        parties.append(f"{JOURS_FR[weekday]} {creneaux}")
    base = "; ".join(parties) if parties else "aucun horaire n'est enregistré"
    aujourdhui = fermeture_du_jour(moment.date(), list(closures))
    if aujourdhui:
        motif = aujourdhui.reason.lower()
        reprise = format_day_fr(aujourdhui.ends)
        return (
            f"Nous répondons du {base}. Aujourd'hui, le standard est fermé "
            f"pour {motif}. La reprise se fait {reprise}."
        )
    return f"Nous répondons du {base}."


def semaine_type(line: Line) -> list[dict]:
    """Le tableau d'horaires que l'établissement lit dans les réglages."""
    rows = []
    for weekday in range(JOURS_SEMAINE):
        fenetres = sorted(jour_ouvre(line, weekday))
        rows.append(
            {
                "weekday": weekday,
                "label": JOURS_FR[weekday],
                "windows": [
                    {"opens": format_clock(o), "closes": format_clock(c)}
                    for o, c in fenetres
                ],
            }
        )
    return rows


def resume_journee(line: Line, jour: date, closures: list[Closure]) -> str:
    """Le résumé d'une journée, tel qu'il sonne dans un message vocal."""
    fermeture = fermeture_du_jour(jour, closures)
    if fermeture:
        return f"fermé, {fermeture.reason.lower()}"
    fenetres = sorted(jour_ouvre(line, jour.weekday()))
    if not fenetres:
        return "fermé"
    return ", ".join(f"{format_clock(o)} à {format_clock(c)}" for o, c in fenetres)


def jours_fermes(db: Session, org_id: int) -> list[Closure]:
    return list(
        db.scalars(
            select(Closure)
            .where(Closure.organization_id == org_id)
            .order_by(Closure.starts)
        )
    )
