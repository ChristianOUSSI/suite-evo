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
    "bien_inconnu": {
        "fr": "Ce bien n'est pas de l'agence.",
        "en": "That property does not belong to this agency.",
    },
    "demande_inconnue": {
        "fr": "Cette demande n'est pas de l'agence.",
        "en": "That request does not belong to this agency.",
    },
    "visite_inconnue": {
        "fr": "Cette visite n'est pas de l'agence.",
        "en": "That visit does not belong to this agency.",
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
    "organisation_inconnue": {
        "fr": "Aucune agence n'est encore ouverte ici.",
        "en": "No agency is open here yet.",
    },
}


CHAMPS: dict[str, dict[str, str]] = {
    "email": {"fr": "l'adresse", "en": "the address"},
    "mot_de_passe": {"fr": "le mot de passe", "en": "the password"},
    "nom": {"fr": "le nom", "en": "the name"},
    "titre": {"fr": "le titre", "en": "the title"},
    "type": {"fr": "le type de bien", "en": "the property type"},
    "prix": {"fr": "le prix", "en": "the price"},
    "surface_m2": {"fr": "la surface", "en": "the surface"},
    "chambres": {"fr": "les chambres", "en": "the bedrooms"},
    "telephone": {"fr": "le numéro", "en": "the number"},
    "client_telephone": {"fr": "le numéro du client", "en": "the client's number"},
    "proprietaire_telephone": {"fr": "le numéro du propriétaire", "en": "the owner's number"},
    "date": {"fr": "la date", "en": "the date"},
    "heure": {"fr": "l'heure", "en": "the time"},
    "bien_id": {"fr": "le bien", "en": "the property"},
    "canal": {"fr": "le canal", "en": "the channel"},
    "statut": {"fr": "le statut", "en": "the status"},
    "issue": {"fr": "l'issue", "en": "the outcome"},
    "note": {"fr": "la note", "en": "the note"},
    "role": {"fr": "le rôle", "en": "the role"},
}


LISTES: dict[str, dict[str, str]] = {
    "type": {
        "fr": "maison, appartement, chambre, terrain, bureau ou commercial.",
        "en": "maison, appartement, chambre, terrain, bureau or commercial.",
    },
    "statut": {
        "fr": "disponible, negociation, loue, vendu ou retire.",
        "en": "disponible, negociation, loue, vendu or retire.",
    },
    "canal": {
        "fr": "telephone, whatsapp, visite, panneau, bouche_a_oreille ou autre.",
        "en": "telephone, whatsapp, visite, panneau, bouche_a_oreille or autre.",
    },
    "statut_demande": {
        "fr": "nouvelle, contactee, visite, convertie ou perdue.",
        "en": "nouvelle, contactee, visite, convertie or perdue.",
    },
    "issue": {
        "fr": "a_venir, ok, absent ou refusee.",
        "en": "a_venir, ok, absent or refusee.",
    },
    "role": {"fr": "responsable ou agent.", "en": "responsable or agent."},
    "heure": {"fr": "format 14:30.", "en": "format 14:30."},
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
