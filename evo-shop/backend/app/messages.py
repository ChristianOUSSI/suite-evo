"""Les mots que l'API refuse de traduire toute seule."""

from __future__ import annotations

from fastapi import HTTPException

CODES: dict[str, dict[str, str]] = {
    "seance_expiree": {
        "fr": "Votre séance a expiré. Revenez à la caisse.",
        "en": "Your session has expired. Come back to the counter.",
    },
    "seance_invalide": {"fr": "Séance invalide.", "en": "Invalid session."},
    "identifiants": {
        "fr": "Cette adresse ou ce mot de passe ne passe pas.",
        "en": "That address or password does not work.",
    },
    "produit_inconnu": {
        "fr": "Cet article n'est pas de la boutique.",
        "en": "That item does not belong to this shop.",
    },
    "produit_epuise": {
        "fr": "Cet article n'a plus de stock.",
        "en": "That item is out of stock.",
    },
    "stock_insuffisant": {
        "fr": "Pas assez de stock pour cette quantité.",
        "en": "Not enough stock for that quantity.",
    },
    "vente_inconnue": {
        "fr": "Ce ticket n'est pas de la boutique.",
        "en": "That receipt does not belong to this shop.",
    },
    "vente_deja_annulee": {
        "fr": "Ce ticket est déjà annulé.",
        "en": "That receipt is already cancelled.",
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
        "fr": "Cet article existe déjà dans la boutique.",
        "en": "That item already exists in the shop.",
    },
    "droits": {
        "fr": "Seul le responsable touche aux prix, au stock et aux comptes.",
        "en": "Only the manager edits prices, stock and accounts.",
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
    "unite": {"fr": "l'unité", "en": "the unit"},
    "prix_achat": {"fr": "le prix d'achat", "en": "the purchase price"},
    "prix_vente": {"fr": "le prix de vente", "en": "the sale price"},
    "stock": {"fr": "le stock", "en": "the stock"},
    "seuil_alerte": {"fr": "le seuil d'alerte", "en": "the alert threshold"},
    "quantite": {"fr": "la quantité", "en": "the quantity"},
    "periode": {"fr": "le mois", "en": "the month"},
    "statut": {"fr": "le statut", "en": "the status"},
    "note": {"fr": "la note", "en": "the note"},
    "role": {"fr": "le rôle", "en": "the role"},
    "lignes": {"fr": "les lignes du ticket", "en": "the receipt lines"},
}


LISTES: dict[str, dict[str, str]] = {
    "unite": {
        "fr": "pièce, sac, kilo, litre, carton ou paquet.",
        "en": "piece, sac, kg, litre, carton or paquet.",
    },
    "statut": {
        "fr": "seul « annulee » se décide ici.",
        "en": "only « annulee » is decided here.",
    },
    "role": {"fr": "responsable ou caissier.", "en": "responsable or caissier."},
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
    if motif in ("int_parsing", "type", "list_type"):
        return (f"{francais} attend une valeur valide.", f"{anglais} must be a valid value.")
    if motif == "too_short":
        return (f"{francais} attend au moins une ligne.", f"{anglais} needs at least one line.")
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
