"""Les jours où le Cameroun ferme, calculés ou relevés du calendrier officiel."""

from __future__ import annotations

from datetime import date, timedelta

from ..utils import JOURS_EN, MOIS_EN, format_day_fr

# Jours fixes du code du travail camerounais.
FIXES = [
    ((1, 1), "Jour de l'An", "New Year's Day"),
    ((2, 11), "Fête de la Jeunesse", "Youth Day"),
    ((3, 8), "Journée internationale de la femme", "International Women's Day"),
    ((5, 1), "Fête du Travail", "Labour Day"),
    ((5, 20), "Fête nationale", "National Day"),
    ((5, 25), "Journée de l'Afrique", "Africa Day"),
    ((8, 15), "Assomption", "Assumption"),
    ((11, 1), "Toussaint", "All Saints"),
    ((12, 25), "Noël", "Christmas"),
]

# Pâques se déplace, les jours qui la suivent aussi.
PAQUES_FIXES = [
    (-2, "Vendredi saint", "Good Friday"),
    (1, "Lundi de Pâques", "Easter Monday"),
    (39, "Ascension", "Ascension Day"),
    (50, "Lundi de Pentecôte", "Whit Monday"),
]

# Dates estimées des trois fêtes musulmanes. L'écart dépend de la lune,
# l'établissement confirme toujours avant d'enregistrer.
MUSULMANES = {
    2026: [
        ((3, 20), "Aïd el-Fitr", "Eid al-Fitr"),
        ((5, 27), "Tabaski", "Eid al-Adha"),
        ((8, 25), "Anniversaire du Prophète", "Mawlid"),
    ],
    2027: [
        ((3, 9), "Aïd el-Fitr", "Eid al-Fitr"),
        ((5, 16), "Tabaski", "Eid al-Adha"),
        ((8, 14), "Anniversaire du Prophète", "Mawlid"),
    ],
    2028: [
        ((2, 26), "Aïd el-Fitr", "Eid al-Fitr"),
        ((5, 5), "Tabaski", "Eid al-Adha"),
        ((8, 2), "Anniversaire du Prophète", "Mawlid"),
    ],
    2029: [
        ((2, 14), "Aïd el-Fitr", "Eid al-Fitr"),
        ((4, 24), "Tabaski", "Eid al-Adha"),
        ((7, 22), "Anniversaire du Prophète", "Mawlid"),
    ],
}

ANNEES_COUCERTES = tuple(sorted(MUSULMANES))
A_CONFIRMER = "date à confirmer"


def paques(annee: int) -> date:
    """Pâques par l'algorithme ecclésiastique, en grégorien."""
    a = annee % 19
    b = annee // 100
    c = annee % 100
    d = b // 4
    e = b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i = c // 4
    k = c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    mois = (h + l - 7 * m + 111) // 31
    jour = ((h + l - 7 * m + 111) % 31) + 1
    return date(annee, mois, jour)


def feries(annee: int) -> list[dict]:
    """Tous les jours fériés d'une année, dans l'ordre des calendrier."""
    lignes = [
        _ferie(date(annee, mois, jour), raison, reason_en)
        for (mois, jour), raison, reason_en in FIXES
    ]
    dimanche = paques(annee)
    lignes += [
        _ferie(dimanche + timedelta(days=delta), raison, reason_en)
        for delta, raison, reason_en in PAQUES_FIXES
    ]
    lignes += [
        _ferie(
            date(annee, mois, jour),
            raison,
            reason_en,
            estime=True,
        )
        for (mois, jour), raison, reason_en in MUSULMANES.get(annee, [])
    ]
    return sorted(lignes, key=lambda ligne: ligne["starts"])


def _ferie(day: date, raison: str, reason_en: str, *, estime: bool = False) -> dict:
    """La raison reste propre, le doute n'apparaît que dans la ligne affichée."""
    motif = f"{raison} ({A_CONFIRMER})" if estime else raison
    return {
        "starts": day,
        "ends": day,
        "reason": raison,
        "reason_en": reason_en,
        "kind": "ferie",
        "label": ecris_date(day, motif),
        "estimated": estime,
    }


def ecris_date(day: date, raison: str) -> str:
    return f"{format_day_fr(day)} {day.year}, {raison}"


def ecris_date_en(day: date, raison: str) -> str:
    jour = JOURS_EN[day.weekday()]
    return f"{jour} {day.day} {MOIS_EN[day.month - 1]} {day.year}, {raison}"


def prochain_jour_chome(
    today: date, deja: set[date] | None = None
) -> dict | None:
    """Le prochain férié encore devant nous, dans les deux langues."""
    deja = deja or set()
    candidates = feries(today.year) + feries(today.year + 1)
    for ligne in candidates:
        if ligne["starts"] > today and ligne["starts"] not in deja:
            motif = (
                f"{ligne['reason']} ({A_CONFIRMER})"
                if ligne["estimated"]
                else ligne["reason"]
            )
            return {
                "starts": ligne["starts"],
                "reason": ligne["reason"],
                "reason_en": ligne["reason_en"],
                "label": ecris_date(ligne["starts"], motif),
                "label_en": ecris_date_en(ligne["starts"], ligne["reason_en"]),
                "estimated": ligne["estimated"],
                "days_away": (ligne["starts"] - today).days,
            }
    return None
