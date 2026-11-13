"""Les questions que le répertoire ne sait pas encore répondre, et qui reviennent."""

from __future__ import annotations

import re
from collections import Counter
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Call, Organization
from ..utils import utcnow

FENETRE_JOURS = 45
MINI = 2
PHRASE_TAILLE = 72
MOTS_VIDES = {
    "est",
    "ce",
    "que",
    "qui",
    "pour",
    "dans",
    "les",
    "des",
    "une",
    "sur",
    "avec",
    "pourquoi",
    "comment",
    "quand",
    "ou",
    "the",
    "is",
    "are",
    "what",
    "when",
    "how",
    "for",
    "and",
    "with",
    "can",
    "you",
    "do",
    "does",
}
TAILLE_MIN_MOT = 4


def net(texte: str) -> str:
    """Minuscules, sans ponctuation : ce qui reste quand l'appelant a fini de parler."""
    propre = re.sub(r"[^a-zà-ÿ0-9 ]", " ", texte.lower())
    return re.sub(r"\s+", " ", propre).strip()


def normalise(question: str) -> str:
    return net(question)[:PHRASE_TAILLE]


def _mots(texte: str) -> list[str]:
    return [
        mot
        for mot in texte.split()
        if len(mot) >= TAILLE_MIN_MOT and mot not in MOTS_VIDES
    ]


def trous(db: Session, org: Organization, *, jours: int = FENETRE_JOURS) -> list[dict]:
    """Les questions restées sans fiche, regroupées par famille."""
    borne = utcnow() - timedelta(days=jours)
    fiches = db.scalars(
        select(Call)
        .where(
            Call.organization_id == org.id,
            Call.started_at >= borne,
            Call.answer_id.is_(None),
            Call.question != "",
        )
        .order_by(Call.started_at.desc())
    ).all()

    familles: dict[str, dict] = {}
    for fiche in fiches:
        question = fiche.question.strip()
        cle = normalise(question)
        racine = " ".join(_mots(cle)[:3]) or cle
        ligne = familles.get(racine)
        if ligne is None:
            familles[racine] = {
                "racine": racine,
                "count": 1,
                "example": question[:240],
                "last_seen": fiche.started_at,
            }
            continue
        ligne["count"] += 1
        if len(question) > len(ligne["example"]):
            ligne["example"] = question[:240]

    ranges = sorted(
        familles.values(), key=lambda ligne: (-ligne["count"], ligne["last_seen"])
    )
    return [
        {
            "racine": ligne["racine"],
            "count": ligne["count"],
            "example": ligne["example"],
            "last_seen": ligne["last_seen"],
            "keywords": ", ".join(
                mot for mot, _ in Counter(_mots(net(ligne["example"]))).most_common(5)
            ),
            "repeated": ligne["count"] >= MINI,
        }
        for ligne in ranges
    ]


def suggestiaire(trou: dict) -> dict:
    """De quoi remplir une fiche à partir d'un trou, sans repartir de zéro."""
    return {
        "statement": f"À proposer : {trou['example'][:120]}",
        "keywords": trou["keywords"],
        "area": "Accueil",
    }
