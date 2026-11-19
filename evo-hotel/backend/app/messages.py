"""Les mots que l'API refuse de traduire toute seule."""

from __future__ import annotations

from fastapi import HTTPException

CODES: dict[str, dict[str, str]] = {
    "seance_expiree": {
        "fr": "Votre séance a expiré. Revenez à la réception.",
        "en": "Your session has expired. Come back to the desk.",
    },
    "seance_invalide": {"fr": "Séance invalide.", "en": "Invalid session."},
    "identifiants": {
        "fr": "Cette adresse ou ce mot de passe ne passe pas.",
        "en": "That address or password does not work.",
    },
    "chambre_inconnue": {
        "fr": "Cette chambre n'est pas de l'hôtel.",
        "en": "That room does not belong to this hotel.",
    },
    "chambre_occupee": {
        "fr": "Cette chambre est déjà louée sur ces dates.",
        "en": "That room is already booked on those dates.",
    },
    "numero_pris": {
        "fr": "Ce numéro de chambre est déjà pris.",
        "en": "That room number is already taken.",
    },
    "client_inconnu": {
        "fr": "Ce client n'est pas de l'hôtel.",
        "en": "That guest does not belong to this hotel.",
    },
    "sejour_inconnu": {
        "fr": "Ce séjour n'est pas de l'hôtel.",
        "en": "That stay does not belong to this hotel.",
    },
    "dates_invalides": {
        "fr": "Le départ doit être après l'arrivée, au moins une nuit.",
        "en": "Departure must be after arrival, at least one night.",
    },
    "sejour_termine": {
        "fr": "Ce séjour est clos : on ne le rouvre pas, on en fait un nouveau.",
        "en": "This stay is closed: do not reopen it, make a new one.",
    },
    "sejour_annule": {
        "fr": "Ce séjour est annulé : la chambre est libre à nouveau.",
        "en": "This stay is cancelled: the room is free again.",
    },
    "periode_inconnue": {
        "fr": "Mois invalide : format attendu 2026-11.",
        "en": "Invalid month: expected 2026-11.",
    },
    "adresse_prise": {
        "fr": "Cette adresse tient déjà un compte.",
        "en": "That address already holds an account.",
    },
    "droits": {
        "fr": "Seul le responsable touche aux chambres et aux comptes.",
        "en": "Only the manager edits rooms and accounts.",
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
    "numero": {"fr": "le numéro de chambre", "en": "the room number"},
    "type": {"fr": "le type de chambre", "en": "the room type"},
    "prix_par_nuit": {"fr": "le prix de la nuit", "en": "the nightly price"},
    "capacite": {"fr": "la capacité", "en": "the capacity"},
    "telephone": {"fr": "le numéro", "en": "the phone number"},
    "piece": {"fr": "la pièce", "en": "the ID reference"},
    "arrivee": {"fr": "la date d'arrivée", "en": "the arrival date"},
    "depart": {"fr": "la date de départ", "en": "the departure date"},
    "statut": {"fr": "le statut", "en": "the status"},
    "note": {"fr": "la note", "en": "the note"},
    "periode": {"fr": "le mois", "en": "the month"},
    "role": {"fr": "le rôle", "en": "the role"},
}


LISTES: dict[str, dict[str, str]] = {
    "type_chambre": {
        "fr": "standard, deluxe, suite ou familiale.",
        "en": "standard, deluxe, suite or familiale.",
    },
    "statut": {
        "fr": "demande, confirmee, en_cours, terminee ou annulee.",
        "en": "demande, confirmee, en_cours, terminee or annulee.",
    },
    "role": {"fr": "responsable ou receptionniste.", "en": "responsable or receptionniste."},
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
