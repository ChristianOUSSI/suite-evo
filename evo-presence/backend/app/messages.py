"""Les mots que l'API refuse de traduire toute seule."""

from __future__ import annotations

from fastapi import HTTPException

CODES: dict[str, dict[str, str]] = {
    "seance_expiree": {
        "fr": "Votre séance a expiré. Revenez au pointage.",
        "en": "Your session has expired. Come back to the roll.",
    },
    "seance_invalide": {"fr": "Séance invalide.", "en": "Invalid session."},
    "identifiants": {
        "fr": "Cette adresse ou ce mot de passe ne passe pas.",
        "en": "That address or password does not work.",
    },
    "employe_inconnu": {
        "fr": "Cet employé n'est pas de l'entreprise.",
        "en": "That employee does not belong to this company.",
    },
    "meme_telephone": {
        "fr": "Ce numéro tient déjà une fiche d'employé.",
        "en": "That number already holds an employee card.",
    },
    "numero_invalide": {
        "fr": "Numéro camerounais attendu : 9 chiffres après +237.",
        "en": "Cameroonian number expected: 9 digits after +237.",
    },
    "presence_inconnue": {
        "fr": "Ligne de présence inconnue.",
        "en": "Unknown presence line.",
    },
    "statut_inconnu": {
        "fr": "Statut inconnu : présent, retard ou absent.",
        "en": "Unknown status: present, retard or absent.",
    },
    "heure_inconnue": {
        "fr": "Heure attendue au format 08:30.",
        "en": "Time expected as 08:30.",
    },
    "date_futures": {
        "fr": "On ne pointe pas un jour qui n'est pas encore passé.",
        "en": "You cannot log a day that has not happened yet.",
    },
    "sans_employe": {
        "fr": "Aucun employé actif : rien à pointer.",
        "en": "No active employee: nothing to log.",
    },
    "periode_inconnue": {
        "fr": "Mois invalide : format attendu 2026-11.",
        "en": "Invalid month: expected 2026-11.",
    },
    "code_inconnu": {
        "fr": "Ce code ne correspond à aucun mois de présence.",
        "en": "That code matches no presence month.",
    },
    "adresse_prise": {
        "fr": "Cette adresse tient déjà un compte.",
        "en": "That address already holds an account.",
    },
    "droits": {
        "fr": "Seul le responsable change les fiches ou les comptes.",
        "en": "Only the manager edits cards or accounts.",
    },
    "saisie": {
        "fr": "La saisie n'est pas reçue telle quelle.",
        "en": "The input was not accepted as given.",
    },
}


CHAMPS: dict[str, dict[str, str]] = {
    "email": {"fr": "l'adresse", "en": "the address"},
    "mot_de_passe": {"fr": "le mot de passe", "en": "the password"},
    "nom": {"fr": "le nom", "en": "the name"},
    "telephone": {"fr": "le numéro", "en": "the phone number"},
    "service": {"fr": "le service", "en": "the department"},
    "jour": {"fr": "le jour pointé", "en": "the logged day"},
    "statut": {"fr": "le statut", "en": "the status"},
    "arrivee": {"fr": "l'heure d'arrivée", "en": "the arrival time"},
    "depart": {"fr": "l'heure de départ", "en": "the departure time"},
    "note": {"fr": "la note", "en": "the note"},
    "periode": {"fr": "le mois", "en": "the month"},
    "code": {"fr": "le code de contrôle", "en": "the check code"},
    "employe_id": {"fr": "l'employé", "en": "the employee"},
    "role": {"fr": "le rôle", "en": "the role"},
}


# Les listes et les formats que les validateurs Pydantic renvoient. Ils ne
# portent aucune phrase : une chaîne levée par un validateur arrive dans les
# deux corps à la fois, donc elle ne doit être ni française ni anglaise.
LISTES: dict[str, dict[str, str]] = {
    "statut": {
        "fr": "présent, retard ou absent.",
        "en": "present, retard or absent.",
    },
    "heure": {
        "fr": "au format 08:30, entre 00:00 et 23:59.",
        "en": "as 08:30, between 00:00 and 23:59.",
    },
    "telephone": {
        "fr": "9 chiffres après +237, ou rien.",
        "en": "9 digits after +237, or nothing.",
    },
    "role": {"fr": "responsable ou agent.", "en": "responsable or agent."},
}


def _nom_humain(champ: str, langue: str) -> str:
    entree = CHAMPS.get(champ)
    if entree:
        return entree[langue]
    return champ.replace("_", " ")


def _corps(code: str, surcharge: dict | None) -> dict:
    base = CODES.get(code, {"fr": code, "en": code})
    corps = {"code": code, "fr": base["fr"], "en": base["en"]}
    if surcharge:
        for cle, valeur in surcharge.items():
            corps[cle] = valeur
    return corps


def refus(code: str, statut: int = 422, **surcharge) -> HTTPException:
    """Un refus qui garde son code : l'écran le traduira dans la langue choisie."""
    return HTTPException(status_code=statut, detail=_corps(code, surcharge or None))


def refus_de_validation(errors: list[dict]) -> dict:
    """Un 422 de Pydantic traduit dans la même forme que nos refus."""
    if not errors:
        return {"code": "saisie", "fr": CODES["saisie"]["fr"], "en": CODES["saisie"]["en"]}

    premiere = errors[0]
    brut = [un for un in premiere.get("loc", ()) if un not in ("body",)]
    champ = ".".join(str(un) for un in brut)
    motif = premiere.get("type", "")
    ctx = premiere.get("ctx", {}) or {}
    borne = ctx.get("min_length") or ctx.get("max_length") or ctx.get("le") or ctx.get("ge")

    fr, en = _forme(motif, champ, borne, ctx)
    return {"code": f"saisie.{motif}", "fr": fr, "en": en, "vars": {"champ": champ, "motif": motif}}


def _forme(motif: str, champ: str, borne, ctx: dict) -> tuple[str, str]:
    francais = _nom_humain(champ, "fr")
    anglais = _nom_humain(champ, "en")
    if motif.startswith("string_too_short"):
        return (f"{francais} est trop court.", f"{anglais} is too short.")
    if motif.startswith("string_too_long"):
        return (f"{francais} est trop long.", f"{anglais} is too long.")
    if motif in ("greater_than_equal", "less_than_equal", "less_than", "greater_than"):
        chiffre = f" ({borne})" if borne is not None else ""
        return (
            f"{francais} sort des bornes acceptées{chiffre}.",
            f"{anglais} is outside the allowed range{chiffre}.",
        )
    if motif in ("int_parsing", "type", "date_parsing"):
        return (f"{francais} attend une valeur valide.", f"{anglais} must be a valid value.")
    if motif == "value_error":
        message = str(ctx.get("error", ""))
        if message.startswith("liste:"):
            cle = message.split(":", 1)[1]
            entree = LISTES.get(cle)
            if entree:
                return (
                    f"{_nom_humain(cle, 'fr')} : {entree['fr']}",
                    f"{_nom_humain(cle, 'en')}: {entree['en']}",
                )
        if message:
            return (f"{francais} : {message}", f"{anglais}: {message}")
        return (f"{francais} n'est pas reçu tel quel.", f"{anglais} was not accepted as given.")
    return (CODES["saisie"]["fr"], CODES["saisie"]["en"])
