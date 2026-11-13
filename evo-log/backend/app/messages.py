"""Les mots que l'API refuse de traduire toute seule."""

from __future__ import annotations

from fastapi import HTTPException

CODES: dict[str, dict[str, str]] = {
    "seance_expiree": {
        "fr": "Votre séance a expiré. Revenez à l'agence.",
        "en": "Your session has expired. Come back to the agency.",
    },
    "seance_invalide": {"fr": "Séance invalide.", "en": "Invalid session."},
    "identifiants": {
        "fr": "Cette adresse ou ce mot de passe ne passe pas.",
        "en": "That address or password does not work.",
    },
    "colis_inconnu": {
        "fr": "Ce colis n'est pas du transporteur.",
        "en": "That parcel does not belong to this carrier.",
    },
    "numero_pris": {
        "fr": "Ce numéro de suivi est déjà pris.",
        "en": "That tracking number is already taken.",
    },
    "adresse_prise": {
        "fr": "Cette adresse tient déjà un compte.",
        "en": "That address already holds an account.",
    },
    "droits": {
        "fr": "Seul le responsable touche aux comptes et aux réglages.",
        "en": "Only the manager edits accounts and settings.",
    },
    "saisie": {
        "fr": "La saisie n'est pas reçue telle quelle.",
        "en": "The input was not accepted as given.",
    },
    "periode_inconnue": {
        "fr": "Cette période n'existe pas.",
        "en": "That period does not exist.",
    },
}


CHAMPS: dict[str, dict[str, str]] = {
    "email": {"fr": "l'adresse", "en": "the address"},
    "mot_de_passe": {"fr": "le mot de passe", "en": "the password"},
    "nom": {"fr": "le nom", "en": "the name"},
    "genre": {"fr": "le genre", "en": "the kind"},
    "description": {"fr": "la description", "en": "the description"},
    "poids_kg": {"fr": "le poids", "en": "the weight"},
    "expediteur_nom": {"fr": "le nom de l'expéditeur", "en": "the sender's name"},
    "destinataire_nom": {"fr": "le nom du destinataire", "en": "the recipient's name"},
    "depart": {"fr": "la ville de départ", "en": "the departure city"},
    "arrivee": {"fr": "la ville d'arrivée", "en": "the arrival city"},
    "frais": {"fr": "les frais", "en": "the fee"},
    "moyen": {"fr": "le moyen de paiement", "en": "the payment method"},
    "statut": {"fr": "le statut", "en": "the status"},
    "date_depot": {"fr": "la date de dépôt", "en": "the drop-off date"},
    "date_livraison": {"fr": "la date de livraison", "en": "the delivery date"},
    "telephone": {"fr": "le numéro", "en": "the number"},
    "expediteur_telephone": {"fr": "le numéro de l'expéditeur", "en": "the sender's number"},
    "destinataire_telephone": {"fr": "le numéro du destinataire", "en": "the recipient's number"},
    "note": {"fr": "la note", "en": "the note"},
    "ville": {"fr": "la ville", "en": "the city"},
    "role": {"fr": "le rôle", "en": "the role"},
}


LISTES: dict[str, dict[str, str]] = {
    "genre": {
        "fr": "document, colis, valise, electromenager, palette ou autre.",
        "en": "document, colis, valise, electromenager, palette or autre.",
    },
    "statut": {
        "fr": "recu, en_transit, arrive, distribue, retourne ou annule.",
        "en": "recu, en_transit, arrive, distribue, retourne or annule.",
    },
    "moyen": {
        "fr": "especes, mtn_money, orange_money, nexttel_money, virement, a_payer ou autre.",
        "en": "especes, mtn_money, orange_money, nexttel_money, virement, a_payer or autre.",
    },
    "ville": {
        "fr": "une des villes desservies : Douala, Yaoundé, Bafoussam, Bamenda, Garoua, Maroua, Ngaoundéré, Bertoua, Ebolowa, Kribi, Limbe, Buea.",
        "en": "one of the served cities: Douala, Yaoundé, Bafoussam, Bamenda, Garoua, Maroua, Ngaoundéré, Bertoua, Ebolowa, Kribi, Limbe, Buea.",
    },
    "role": {"fr": "responsable ou agent.", "en": "responsable or agent."},
    "telephone": {
        "fr": "un numéro camerounais, par exemple 6 77 12 34 56 ou +237 6 77 12 34 56.",
        "en": "a Cameroonian number, for example 6 77 12 34 56 or +237 6 77 12 34 56.",
    },
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
