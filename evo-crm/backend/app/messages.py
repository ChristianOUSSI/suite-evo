"""Les mots que l'API refuse de traduire toute seule.

Un refus renvoyé en français à un vendeur anglophone n'est pas traduit, il est
imposé. Chaque refus porte un code stable et les deux textes ; l'écran choisit.
"""

from __future__ import annotations

from fastapi import HTTPException

CODES: dict[str, dict[str, str]] = {
    "seance_expiree": {
        "fr": "Votre séance a expiré. Revenez au carnet.",
        "en": "Your session has expired. Come back to the book.",
    },
    "seance_invalide": {"fr": "Séance invalide.", "en": "Invalid session."},
    "identifiants": {
        "fr": "Cette adresse ou ce mot de passe ne passe pas.",
        "en": "That address or password does not work.",
    },
    "client_inconnu": {
        "fr": "Ce client n'est pas du carnet.",
        "en": "That customer is not in the book.",
    },
    "meme_telephone": {
        "fr": "Ce numéro tient déjà une fiche dans le carnet.",
        "en": "That number already holds a card in the book.",
    },
    "numero_invalide": {
        "fr": "Numéro camerounais attendu : 9 chiffres après +237.",
        "en": "Cameroonian number expected: 9 digits after +237.",
    },
    "client_sans_numero": {
        "fr": "Ce client n'a pas de numéro : rien à rappeler.",
        "en": "That customer has no number: nothing to remind.",
    },
    "client_sorti": {
        "fr": "Ce client est sorti du carnet.",
        "en": "That customer is out of the book.",
    },
    "segment_inconnu": {
        "fr": "Segment inconnu : particulier, revendeur, grossiste ou institution.",
        "en": "Unknown segment: particulier, revendeur, grossiste or institution.",
    },
    "echange_inconnu": {
        "fr": "Échange inconnu pour ce client.",
        "en": "Unknown log entry for that customer.",
    },
    "type_inconnu": {
        "fr": "Type d'échange inconnu : appel, WhatsApp, visite, SMS, devis, commande ou réclamation.",
        "en": "Unknown log type: appel, whatsapp, visite, sms, devis, commande or reclamation.",
    },
    "relance_inconnue": {
        "fr": "Cette relance n'existe pas dans le carnet.",
        "en": "That reminder does not exist in the book.",
    },
    "relance_deja_faite": {
        "fr": "Cette relance est déjà marquée faite.",
        "en": "That reminder is already marked done.",
    },
    "relance_sans_motif": {
        "fr": "Dis pourquoi tu rappelles : une relance sans motif ne se fait pas.",
        "en": "Say why you are calling back: a reminder without a reason never gets done.",
    },
    "entreprise_inconnue": {
        "fr": "Carnet inconnu.",
        "en": "Unknown book.",
    },
    "adresse_prise": {
        "fr": "Cette adresse tient déjà un compte.",
        "en": "That address already holds an account.",
    },
    "dernier_responsable": {
        "fr": "Le carnet ne reste pas sans responsable : change le rôle au lieu de le supprimer.",
        "en": "The book cannot lose its last leader: change the role instead of removing it.",
    },
    "droits": {
        "fr": "Seul le responsable fait ce geste.",
        "en": "Only the owner can do this.",
    },
    "vide": {
        "fr": "Le carnet est vide : ajoute d'abord un client.",
        "en": "The book is empty: add a customer first.",
    },
    "saisie": {
        "fr": "La saisie n'est pas reçue telle quelle.",
        "en": "The input was not accepted as given.",
    },
}


# Le nom technique d'un champ ne doit jamais paraître à l'écran : un vendeur
# lit « le numéro », pas « telephone ».
CHAMPS: dict[str, dict[str, str]] = {
    "email": {"fr": "l'adresse", "en": "the address"},
    "mot_de_passe": {"fr": "le mot de passe", "en": "the password"},
    "nom": {"fr": "le nom", "en": "the name"},
    "telephone": {"fr": "le numéro", "en": "the phone number"},
    "quartier": {"fr": "le quartier", "en": "the area"},
    "segment": {"fr": "le segment", "en": "the segment"},
    "type": {"fr": "le type d'échange", "en": "the log type"},
    "note": {"fr": "la note", "en": "the note"},
    "motif": {"fr": "le motif", "en": "the reason"},
    "due_le": {"fr": "la date de relance", "en": "the reminder date"},
    "montant": {"fr": "le montant", "en": "the amount"},
    "silence_jours": {"fr": "le délai de silence", "en": "the silence window"},
    "rappel_jours": {"fr": "le délai de rappel", "en": "the recall delay"},
    "client_id": {"fr": "le client", "en": "the customer"},
    "ville": {"fr": "la ville", "en": "the city"},
    "secteur": {"fr": "le secteur", "en": "the trade"},
    "role": {"fr": "le rôle", "en": "the role"},
    "actif": {"fr": "dans le carnet", "en": "in the book"},
}


# Ce que les validateurs Pydantic renvoient. Ils ne portent aucune phrase :
# une chaîne levée par un validateur arrive dans les deux corps à la fois, donc
# elle ne doit être ni française ni anglaise.
LISTES: dict[str, dict[str, str]] = {
    "segment": {
        "fr": "particulier, revendeur, grossiste ou institution.",
        "en": "particulier, revendeur, grossiste or institution.",
    },
    "type": {
        "fr": "appel, whatsapp, visite, sms, devis, commande ou réclamation.",
        "en": "appel, whatsapp, visite, sms, devis, commande or réclamation.",
    },
    "role": {"fr": "responsable ou vendeur.", "en": "responsable or vendeur."},
}

# Les phrases complètes, rendues telles quelles : elles nomment déjà le champ.
FORMATS: dict[str, dict[str, str]] = {
    "telephone": {
        "fr": "Numéro camerounais attendu : 9 chiffres après +237.",
        "en": "Cameroonian number expected: 9 digits after +237.",
    },
    "relance_passee": {
        "fr": "Une relance ne se pose pas dans le passé.",
        "en": "A reminder cannot be set in the past.",
    },
}


def _nom_humain(champ: str, langue: str) -> str:
    entree = CHAMPS.get(champ)
    if entree:
        return entree[langue]
    return champ.replace("_", " ")


def _corps(code: str, surcharge: dict[str, str] | None) -> dict:
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
    return {
        "code": f"saisie.{motif}",
        "fr": fr,
        "en": en,
        "vars": {"champ": champ, "motif": motif},
    }


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
            if cle in FORMATS:
                return (FORMATS[cle]["fr"], FORMATS[cle]["en"])
            entree = LISTES.get(cle)
            if entree:
                return (
                    f"{_nom_humain(cle, 'fr')} : {entree['fr']}",
                    f"{_nom_humain(cle, 'en')}: {entree['en']}",
                )
        if message:
            return (f"{francais} : {message}", f"{anglais}: {message}")
        return (
            f"{francais} n'est pas reçu tel quel.",
            f"{anglais} was not accepted as given.",
        )
    return (CODES["saisie"]["fr"], CODES["saisie"]["en"])
