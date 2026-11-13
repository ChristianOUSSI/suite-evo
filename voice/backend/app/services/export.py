"""Ce que la secrétaire emporte au cybercafé : un CSV qui s'ouvre tel quel."""

from __future__ import annotations

import unicodedata
from datetime import date

SEPARATEUR = ";"
BOM = "\ufeff"


def _echappe(valeur: object) -> str:
    texte = "" if valeur is None else str(valeur)
    texte = texte.replace("\r\n", " ").replace("\n", " ").replace(";", " ")
    if texte.startswith(("=", "+", "-", "@")):
        texte = f"'{texte}"
    return texte


def tableau(entetes: list[str], lignes: list[list[object]]) -> str:
    rangees = [SEPARATEUR.join(_echappe(entete) for entete in entetes)]
    rangees += [
        SEPARATEUR.join(_echappe(champ) for champ in ligne) for ligne in lignes
    ]
    return BOM + "\r\n".join(rangees) + "\r\n"


def journal(calls: list[dict]) -> str:
    entetes = [
        "Date",
        "Heure",
        "Poste",
        "Num\u00e9ro",
        "Nom",
        "Dur\u00e9e",
        "Tenu par",
        "R\u00e9sultat",
        "Touche",
        "Question pos\u00e9e",
        "Dict\u00e9e",
    ]
    lignes = [
        [
            fiche["day"],
            fiche["clock"],
            fiche["line_label"],
            fiche["caller_phone_display"],
            fiche["caller_name"],
            fiche["duration_label"],
            fiche["handled_label"],
            fiche["outcome_label"],
            fiche["digit"],
            fiche.get("question", ""),
            " | ".join(fiche["script"]),
        ]
        for fiche in calls
    ]
    return tableau(entetes, lignes)


def main_courante(messages: list[dict]) -> str:
    entetes = [
        "R\u00e9f\u00e9rence",
        "Poste",
        "De qui",
        "Num\u00e9ro",
        "Message",
        "Urgence",
        "Rappel promis",
        "Statut",
        "Traite par",
        "Note de fin",
        "Retard",
    ]
    lignes = [
        [
            mot["id"],
            mot["line_label"],
            mot["from_name"],
            mot["from_phone_display"],
            mot["body"],
            mot["urgency"],
            mot["promised_label"],
            mot["status_label"],
            mot["handled_by"],
            mot["handled_note"],
            "oui" if mot["overdue"] else "non",
        ]
        for mot in messages
    ]
    return tableau(entetes, lignes)


def agenda(rendez_vous: list[dict]) -> str:
    entetes = [
        "R\u00e9f\u00e9rence",
        "Jour",
        "Heure",
        "Guichet",
        "Salle",
        "Nom",
        "Num\u00e9ro",
        "Dur\u00e9e",
        "Statut",
        "Origine",
        "Rappel envoy\u00e9",
        "Note",
    ]
    lignes = [
        [
            place["reference"],
            place["day"],
            place["clock"],
            place["service_name"],
            place["room"],
            place["caller_name"],
            place["caller_phone_display"],
            f"{place['duration_min']} min",
            place["status_label"],
            place["origin"],
            "oui" if place["reminded"] else "non",
            place["note"],
        ]
        for place in rendez_vous
    ]
    return tableau(entetes, lignes)


def annuaire(contacts: list[dict]) -> str:
    entetes = [
        "Nom",
        "Num\u00e9ro",
        "Qualit\u00e9",
        "Note",
        "Appels",
        "Vu pour la derni\u00e8re fois",
    ]
    lignes = [
        [
            contact["name"],
            contact["phone_display"],
            contact["tag_label"],
            contact["note"],
            contact["call_count"],
            contact["last_label"],
        ]
        for contact in contacts
    ]
    return tableau(entetes, lignes)


def slug(texte: str) -> str:
    propre = unicodedata.normalize("NFKD", texte)
    propre = "".join(ch for ch in propre if not unicodedata.combining(ch))
    mots = "".join(ch if ch.isalnum() else "-" for ch in propre.lower()).split("-")
    return "-".join(mot for mot in mots if mot)[:40] or "standard"


def nom_fichier(org_name: str, base: str, today: date | None = None) -> str:
    jour = (today or date.today()).isoformat()
    return f"{slug(org_name)}-{base}-{jour}.csv"
