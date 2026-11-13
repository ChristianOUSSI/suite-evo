"""Les mots que l'API refuse de traduire toute seule."""

from __future__ import annotations

from fastapi import HTTPException

CODES: dict[str, dict[str, str]] = {
    "seance_expiree": {
        "fr": "Votre séance a expiré. Revenez à la boutique.",
        "en": "Your session has expired. Come back to the shop.",
    },
    "seance_invalide": {"fr": "Séance invalide.", "en": "Invalid session."},
    "identifiants": {
        "fr": "Cette adresse ou ce mot de passe ne passe pas.",
        "en": "That address or password does not work.",
    },
    "annonce_inconnue": {
        "fr": "Cette annonce n'est pas de la boutique.",
        "en": "That listing does not belong to this shop.",
    },
    "commande_inconnue": {
        "fr": "Cette commande n'est pas de la boutique.",
        "en": "That order does not belong to this shop.",
    },
    "rupture": {
        "fr": "Le stock de cette annonce est épuisé.",
        "en": "That listing is out of stock.",
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
    "titre": {"fr": "le titre", "en": "the title"},
    "categorie": {"fr": "la catégorie", "en": "the category"},
    "prix": {"fr": "le prix", "en": "the price"},
    "stock": {"fr": "le stock", "en": "the stock"},
    "quantite": {"fr": "la quantité", "en": "the quantity"},
    "montant": {"fr": "le montant", "en": "the amount"},
    "acheteur_nom": {"fr": "le nom de l'acheteur", "en": "the buyer's name"},
    "telephone": {"fr": "le numéro", "en": "the number"},
    "acheteur_telephone": {"fr": "le numéro de l'acheteur", "en": "the buyer's number"},
    "vendeur_telephone": {"fr": "le numéro du vendeur", "en": "the seller's number"},
    "moyen": {"fr": "le moyen de paiement", "en": "the payment method"},
    "statut": {"fr": "le statut", "en": "the status"},
    "date": {"fr": "la date", "en": "the date"},
    "note": {"fr": "la note", "en": "the note"},
    "ville": {"fr": "la ville", "en": "the city"},
    "quartier": {"fr": "le quartier", "en": "the area"},
    "description": {"fr": "la description", "en": "the description"},
    "role": {"fr": "le rôle", "en": "the role"},
    "annonce_id": {"fr": "l'annonce", "en": "the listing"},
}


LISTES: dict[str, dict[str, str]] = {
    "categorie": {
        "fr": "alimentation, vetements, electronique, maison, beaute, telephone, auto ou autre.",
        "en": "alimentation, vetements, electronique, maison, beaute, telephone, auto or autre.",
    },
    "statut_annonce": {
        "fr": "en_ligne, vendu ou retire.",
        "en": "en_ligne, vendu or retire.",
    },
    "statut_commande": {
        "fr": "nouvelle, confirmee, livree ou annulee.",
        "en": "nouvelle, confirmee, livree or annulee.",
    },
    "moyen": {
        "fr": "especes, mtn_money, orange_money, nexttel_money, virement ou autre.",
        "en": "especes, mtn_money, orange_money, nexttel_money, virement or autre.",
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
