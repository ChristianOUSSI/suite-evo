"""Les mots que l'API refuse de traduire toute seule."""

from __future__ import annotations

from fastapi import HTTPException

CODES: dict[str, dict[str, str]] = {
    "seance_expiree": {
        "fr": "Votre séance a expiré. Revenez à la caisse de l'école.",
        "en": "Your session has expired. Come back to the school office.",
    },
    "seance_invalide": {"fr": "Séance invalide.", "en": "Invalid session."},
    "identifiants": {
        "fr": "Cette adresse ou ce mot de passe ne passe pas.",
        "en": "That address or password does not work.",
    },
    "classe_inconnue": {
        "fr": "Cette classe n'est pas de l'école.",
        "en": "That class does not belong to this school.",
    },
    "eleve_inconnu": {
        "fr": "Cet élève n'est pas de l'école.",
        "en": "That student does not belong to this school.",
    },
    "versement_inconnu": {
        "fr": "Ce versement n'est pas de l'école.",
        "en": "That payment does not belong to this school.",
    },
    "versement_annule": {
        "fr": "Ce versement est déjà annulé.",
        "en": "That payment is already cancelled.",
    },
    "recu_inconnu": {
        "fr": "Ce reçu n'existe pas dans cette école.",
        "en": "That receipt does not exist in this school.",
    },
    "periode_inconnue": {
        "fr": "Mois invalide : format attendu 2026-11.",
        "en": "Invalid month: expected 2026-11.",
    },
    "adresse_prise": {
        "fr": "Cette adresse tient déjà un compte.",
        "en": "That address already holds an account.",
    },
    "nom_pris": {
        "fr": "Ce nom existe déjà dans l'école.",
        "en": "That name already exists in the school.",
    },
    "droits": {
        "fr": "Seul le responsable touche aux classes, aux frais et aux comptes.",
        "en": "Only the manager edits classes, fees and accounts.",
    },
    "saisie": {
        "fr": "La saisie n'est pas reçue telle quelle.",
        "en": "The input was not accepted as given.",
    },
    "demande_inconnue": {
        "fr": "Cette demande n'existe pas dans l'école.",
        "en": "That request does not exist in the school.",
    },
    "organisation_inconnue": {
        "fr": "Aucune école n'est encore ouverte ici.",
        "en": "No school is open here yet.",
    },
}


CHAMPS: dict[str, dict[str, str]] = {
    "email": {"fr": "l'adresse", "en": "the address"},
    "mot_de_passe": {"fr": "le mot de passe", "en": "the password"},
    "nom": {"fr": "le nom", "en": "the name"},
    "classe_id": {"fr": "la classe", "en": "the class"},
    "matricule": {"fr": "le matricule", "en": "the ID number"},
    "parent_nom": {"fr": "le nom du parent", "en": "the parent's name"},
    "parent_telephone": {"fr": "le numéro du parent", "en": "the parent's number"},
    "frais_attendu": {"fr": "le montant attendu", "en": "the expected amount"},
    "frais_annuels": {"fr": "les frais annuels", "en": "the yearly fees"},
    "montant": {"fr": "le montant", "en": "the amount"},
    "moyen": {"fr": "le moyen de paiement", "en": "the payment method"},
    "date": {"fr": "la date", "en": "the date"},
    "periode": {"fr": "le mois", "en": "the month"},
    "eleve_id": {"fr": "l'élève", "en": "the student"},
    "note": {"fr": "la note", "en": "the note"},
    "eleve_nom": {"fr": "le nom de l'enfant", "en": "the child's name"},
    "telephone": {"fr": "le numéro", "en": "the number"},
    "statut": {"fr": "le statut", "en": "the status"},
    "role": {"fr": "le rôle", "en": "the role"},
}


LISTES: dict[str, dict[str, str]] = {
    "moyen": {
        "fr": "espèces, mtn_money, orange_money, nexttel_money, virement ou autre.",
        "en": "especes, mtn_money, orange_money, nexttel_money, virement or autre.",
    },
    "role": {"fr": "responsable ou comptable.", "en": "responsable or comptable."},
    "periode": {"fr": "format 2026-11.", "en": "format 2026-11."},
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
