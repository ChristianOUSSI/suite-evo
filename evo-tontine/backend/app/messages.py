"""Les mots que l'API refuse de traduire toute seule.

Un message d'erreur renvoyé en français à un utilisateur anglais n'est pas
traduit, il est imposé. Ici l'API renvoie un code stable et les deux textes :
l'écran choisit la langue, et retomble sur le français si un code inconnu
traverse.
"""

from __future__ import annotations

from fastapi import HTTPException

# Les codes du produit, écrits une seule fois.
CODES: dict[str, dict[str, str]] = {
    "seance_expiree": {
        "fr": "Votre séance a expiré. Revenez au cercle.",
        "en": "Your session has expired. Come back to the circle.",
    },
    "seance_invalide": {"fr": "Séance invalide.", "en": "Invalid session."},
    "identifiants": {
        "fr": "Cette adresse ou ce mot de passe ne passe pas.",
        "en": "That address or password does not work.",
    },
    "sans_membre": {
        "fr": "Aucun membre actif dans le cercle : personne ne cotise.",
        "en": "No active member in the circle: nobody is contributing.",
    },
    "deux_membres": {
        "fr": "Il faut au moins deux membres actifs pour tirer un ordre.",
        "en": "At least two active members are needed to draw an order.",
    },
    "deja_tire": {
        "fr": "Ce tour est déjà tiré. L'ordre ne se refait pas en arrière.",
        "en": "This round is already drawn. The order cannot be undone.",
    },
    "tour_inconnu": {
        "fr": "Tour inconnu du cercle.",
        "en": "Round unknown to the circle.",
    },
    "membre_inconnu": {
        "fr": "Ce membre n'est pas du cercle.",
        "en": "That member is not part of the circle.",
    },
    "membre_absent": {
        "fr": "Ce membre n'était pas appelé à cotiser sur ce tour.",
        "en": "That member was not due to contribute in this round.",
    },
    "part_deja_rentree": {
        "fr": "La part de ce membre est déjà rentrée.",
        "en": "That member's share has already been paid.",
    },
    "rail_inconnu": {
        "fr": "Rail inconnu : espèces, MTN MoMo ou Orange Money.",
        "en": "Unknown rail: cash, MTN MoMo or Orange Money.",
    },
    "rail_coupe": {
        "fr": "Ce rail est coupé dans le cercle.",
        "en": "This rail is turned off in the circle.",
    },
    "tirage_d_abord": {
        "fr": "Le tirage doit être fait avant de remettre le pot.",
        "en": "The draw must happen before handing over the pool.",
    },
    "deja_remis": {
        "fr": "Ce pot a déjà été remis.",
        "en": "This pool has already been handed over.",
    },
    "pot_incomplet": {
        "fr": "Le pot n'est pas complet.",
        "en": "The pool is not complete.",
    },
    "pot_non_tire": {
        "fr": "Le tirage doit être fait avant de passer au tour suivant.",
        "en": "The draw must happen before opening the next round.",
    },
    "pot_non_remis": {
        "fr": "Le pot n'a pas encore été remis. Rien à clôturer.",
        "en": "The pool has not been handed over yet. Nothing to close.",
    },
    "aucun_tour": {"fr": "Aucun tour à clôturer.", "en": "No round to close."},
    "meme_nom": {
        "fr": "Ce nom tient déjà une part dans le cercle.",
        "en": "That name already holds a share in the circle.",
    },
    "adresse_prise": {
        "fr": "Cette adresse tient déjà un compte.",
        "en": "That address already holds an account.",
    },
    "droits": {
        "fr": "Seul le responsable ou la trésorière fait ce geste.",
        "en": "Only the leader or the treasurer can do this.",
    },
    "jeton_inconnu": {
        "fr": "Ce code ne correspond à aucune remise.",
        "en": "That code matches no handover.",
    },
    "saisie": {
        "fr": "La saisie n'est pas reçue telle quelle.",
        "en": "The input was not accepted as given.",
    },
}


# Le nom technique d'un champ ne doit jamais paraître à l'écran : une
# trésorière de soixante ans lit « le mot de passe », pas « mot_de_passe ».
CHAMPS: dict[str, dict[str, str]] = {
    "email": {"fr": "l'adresse", "en": "the address"},
    "mot_de_passe": {"fr": "le mot de passe", "en": "the password"},
    "nom": {"fr": "le nom", "en": "the name"},
    "telephone": {"fr": "le numéro", "en": "the phone number"},
    "cotisation": {"fr": "la cotisation", "en": "the contribution"},
    "penalite": {"fr": "la pénalité", "en": "the penalty"},
    "jour_ancre": {"fr": "le jour du mois", "en": "the day of the month"},
    "montant": {"fr": "le montant", "en": "the amount"},
    "membre_id": {"fr": "le membre", "en": "the member"},
    "tour_id": {"fr": "le tour", "en": "the round"},
    "part": {"fr": "la part", "en": "the share"},
    "role": {"fr": "le rôle", "en": "the role"},
    "frequence": {"fr": "le rythme", "en": "the frequency"},
    "mode": {"fr": "le rail de paiement", "en": "the payment rail"},
    "temoin": {"fr": "le témoin", "en": "the witness"},
    "graine": {"fr": "la graine du tirage", "en": "the draw seed"},
    "note": {"fr": "la note", "en": "the note"},
    "mot_du_groupe": {"fr": "le mot du cercle", "en": "the circle motto"},
    "date_prevue": {"fr": "la date du tour", "en": "the round date"},
    "jour": {"fr": "la date", "en": "the date"},
}


# Ce que les validateurs Pydantic renvoient. Ils ne portent aucune phrase :
# une chaîne levée par un validateur arrive dans les deux corps à la fois, donc
# elle ne doit être ni française ni anglaise.
LISTES: dict[str, dict[str, str]] = {
    "frequence": {
        "fr": "hebdo, quinzaine ou mensuel.",
        "en": "hebdo, quinzaine or mensuel.",
    },
    "role": {
        "fr": "responsable, tresorier ou membre.",
        "en": "responsable, tresorier or membre.",
    },
}

# Les phrases complètes, rendues telles quelles : elles nomment déjà le champ.
FORMATS: dict[str, dict[str, str]] = {
    "telephone": {
        "fr": "Numéro camerounais attendu : 9 chiffres après +237.",
        "en": "Cameroonian number expected: 9 digits after +237.",
    },
}


def _nom_humain(champ: str, langue: str) -> str:
    entree = CHAMPS.get(champ)
    if entree:
        return entree[langue]
    return champ.replace("_", " ") if langue == "en" else champ.replace("_", " ")


def refus_de_validation(errors: list[dict]) -> dict:
    """Un 422 de Pydantic traduit dans la même forme que nos refus.

    Sans ce pont, un écran anglais afficherait « Input should be a valid
    integer » à une trésorière de Ndokoti. La validation est la voix la plus
    fréquente de l'API : elle devait passer par les mêmes deux langues.
    """
    if not errors:
        return {"code": "saisie", "fr": CODES["saisie"]["fr"], "en": CODES["saisie"]["en"]}

    premiere = errors[0]
    brut = [un for un in premiere.get("loc", ()) if un not in ("body",)]
    champ = ".".join(str(un) for un in brut)
    motif = premiere.get("type", "")
    ctx = premiere.get("ctx", {}) or {}
    borne = ctx.get("min_length") or ctx.get("le")

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
        # La borne se lit entre parenthèses, elle ne se montre pas nue.
        chiffre = f" ({borne})" if borne is not None else ""
        return (
            f"{francais} sort des bornes acceptées{chiffre}.",
            f"{anglais} is outside the allowed range{chiffre}.",
        )
    if motif in ("int_parsing", "type"):
        return (f"{francais} attend un nombre.", f"{anglais} must be a number.")
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


def _corps(code: str, surcharge: dict[str, str] | None) -> dict:
    base = CODES.get(code, {"fr": code, "en": code})
    corps = {"code": code, "fr": base["fr"], "en": base["en"]}
    if surcharge:
        for cle, valeur in surcharge.items():
            corps[cle] = valeur
            if cle in ("fr", "en"):
                corps[cle] = valeur
    return corps


def refus(code: str, statut: int = 422, **surcharge) -> HTTPException:
    """Un refus qui garde son code : l'écran le traduira dans la langue choisie."""
    return HTTPException(status_code=statut, detail=_corps(code, surcharge or None))
