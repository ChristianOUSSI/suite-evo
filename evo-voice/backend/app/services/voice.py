from __future__ import annotations

"""La voix : transcription, intention, exécution locale.

En mode démo, la transcription est tapée à la main (ce que la dictée a
entendu) et l'exécution produit un résultat déterministe - aucun SMS,
aucun appel, aucun message ne quitte la machine.
"""

import hashlib
import random
import re

from sqlalchemy import case, select
from sqlalchemy.orm import Session

from ..messages import refus
from ..models import CommandeVocale, Organisation, User
from ..schemas import CommandeCorrection, CommandeEntree
from ..utils import aujourdhui, maintenant, periode_de
from .present import commande_dict

# L'ordre compte : le premier motif trouvé gagne.
MOTIFS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("alerte", ("alerte", "attention", "urgent", "urgente", "danger", "prudence")),
    ("rappel", ("rappel", "rappelle", "rappelles", "souviens", "n'oublie", "n'oubliez")),
    ("message", ("message", "whatsapp", "sms", "envoie", "envoyer", "envois", "appelle", "téléphone", "telephone")),
    ("recherche", ("cherche", "cherches", "recherche", "trouve", "trouver", "renseigne", "compare", "comparaison")),
    ("note", ("note", "notes", "carnet", "prends note", "marque", "écris", "ecris")),
)

RESULTATS_PAR_INTENTION = {
    "rappel": "Rappel rangé : il ressortira à l'écran à l'heure dite.",
    "message": "Message préparé : texte relu et prêt à copier - rien n'est envoyé en démo.",
    "note": "Note rangée dans le carnet du jour, classée par intention.",
    "recherche": "Recherche menée dans les sources locales : les points clés sont listés.",
    "alerte": "Alerte notée : elle remontera tant qu'elle n'est pas acquittée.",
    "autre": "Commande comprise sans intention précise : journalisée pour relecture.",
}


def interpreter(texte: str) -> str:
    """Devine l'intention par des mots-clés : déterministe, local, honnête."""
    brut = texte.lower()
    for intention, motifs in MOTIFS:
        if any(motif in brut for motif in motifs):
            return intention
    return ""


def commande_de(db: Session, organisation: Organisation, commande_id: int) -> CommandeVocale:
    commande = db.get(CommandeVocale, commande_id)
    if commande is None or commande.organisation_id != organisation.id:
        raise refus("commande_inconnue", 404)
    return commande


def enregistrer_commande(
    db: Session, organisation: Organisation, entree: CommandeEntree, compte: User
) -> CommandeVocale:
    """Une dictée arrive : on transcrit, on devine l'intention tout de suite."""
    transcription = entree.transcription.strip()
    intention = interpreter(transcription)
    commande = CommandeVocale(
        organisation_id=organisation.id,
        transcription=transcription,
        intention=intention,
        statut="interpretee" if intention else "recue",
        auteur=compte.nom,
    )
    db.add(commande)
    db.commit()
    db.refresh(commande)
    return commande


def corriger_commande(
    db: Session, organisation: Organisation, commande_id: int, patch: dict
) -> CommandeVocale:
    commande = commande_de(db, organisation, commande_id)
    for cle, valeur in patch.items():
        if valeur is not None:
            setattr(commande, cle, valeur)
    if "transcription" in patch and patch["transcription"] is not None:
        commande.intention = interpreter(commande.transcription)
        if commande.statut == "recue" and commande.intention:
            commande.statut = "interpretee"
    commande.maj_le = maintenant()
    db.commit()
    db.refresh(commande)
    return commande


def _resultat_de(commande: CommandeVocale) -> tuple[str, str]:
    """Un résultat déterministe : la même phrase rend toujours le même texte."""
    graine = int(hashlib.sha256(commande.transcription.encode("utf-8")).hexdigest()[:8], 16)
    alea = random.Random(graine)
    base = RESULTATS_PAR_INTENTION.get(commande.intention or "autre", RESULTATS_PAR_INTENTION["autre"])
    mots = [
        "transcription vérifiée",
        "intention confirmée",
        "horodatage gardé",
        "journal mis à jour",
        "aucun envoi réseau",
    ]
    details = "; ".join(alea.sample(mots, 3))
    return base, details


def executer_commande(
    db: Session, organisation: Organisation, commande_id: int
) -> CommandeVocale:
    """Exécute la commande en local : résultat déterministe, journalisé."""
    commande = commande_de(db, organisation, commande_id)
    if commande.statut not in ("recue", "interpretee"):
        raise refus("commande_pas_executable", 409)

    if not commande.intention:
        raise refus("commande_incomprise", 422)

    resultat, details = _resultat_de(commande)
    commande.statut = "executee"
    commande.resultat = f"{resultat} ({details})"
    commande.maj_le = maintenant()
    db.commit()
    db.refresh(commande)
    return commande


def etat(db: Session, organisation: Organisation) -> dict:
    commandes = db.scalars(
        select(CommandeVocale).where(CommandeVocale.organisation_id == organisation.id)
    ).all()
    return {
        "jour": aujourdhui().isoformat(),
        "periode": periode_de(aujourdhui()),
        "commandes": len(commandes),
        "recues": sum(1 for un in commandes if un.statut == "recue"),
        "interpretees": sum(1 for un in commandes if un.statut == "interpretee"),
        "executees": sum(1 for un in commandes if un.statut == "executee"),
        "echecs": sum(1 for un in commandes if un.statut == "echec"),
        "annulees": sum(1 for un in commandes if un.statut == "annulee"),
        "executees_mois": sum(
            1 for un in commandes
            if un.maj_le and un.statut == "executee" and periode_de(un.maj_le.date()) == periode_de(aujourdhui())
        ),
        "sans_intention": sum(1 for un in commandes if not un.intention and un.statut in ("recue", "interpretee")),
    }


def liste_commandes(
    db: Session,
    organisation: Organisation,
    statut: str | None = None,
    intention: str | None = None,
    recherche: str | None = None,
    limite: int = 500,
) -> list[dict]:
    commandes = list(
        db.scalars(
            select(CommandeVocale)
            .where(CommandeVocale.organisation_id == organisation.id)
            .order_by(
                case(
                    (CommandeVocale.statut == "interpretee", 0),
                    (CommandeVocale.statut == "recue", 1),
                    else_=2,
                ),
                CommandeVocale.maj_le.desc(),
            )
            .limit(limite)
        ).all()
    )
    if statut:
        commandes = [un for un in commandes if un.statut == statut]
    if intention:
        commandes = [un for un in commandes if un.intention == intention]
    if recherche:
        motif = recherche.strip().lower()
        commandes = [
            un
            for un in commandes
            if motif in un.transcription.lower()
            or motif in un.auteur.lower()
            or motif in un.resultat.lower()
        ]
    return [commande_dict(un) for un in commandes]


def recap(db: Session, organisation: Organisation, periode: str) -> dict:
    """Le mois de la voix : dictées reçues, exécutées, par intention."""
    if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", periode or ""):
        raise refus("periode_inconnue")

    commandes = db.scalars(
        select(CommandeVocale).where(CommandeVocale.organisation_id == organisation.id)
    ).all()

    recues = [
        un for un in commandes
        if un.cree_le and periode_de(un.cree_le.date()) == periode
    ]
    executees = [
        un for un in commandes
        if un.statut == "executee" and un.maj_le and periode_de(un.maj_le.date()) == periode
    ]
    par_statut: dict[str, int] = {}
    for un in commandes:
        par_statut[un.statut] = par_statut.get(un.statut, 0) + 1
    par_intention: dict[str, int] = {}
    for un in recues:
        cle = un.intention or "sans_intention"
        par_intention[cle] = par_intention.get(cle, 0) + 1

    return {
        "periode": periode,
        "commandes": len(commandes),
        "recues_mois": len(recues),
        "executees_mois": len(executees),
        "echecs_mois": sum(
            1 for un in commandes
            if un.statut == "echec" and un.maj_le and periode_de(un.maj_le.date()) == periode
        ),
        "en_attente": sum(1 for un in commandes if un.statut in ("recue", "interpretee")),
        "par_statut": par_statut,
        "par_intention": [
            {"intention": cle, "commandes": n}
            for cle, n in sorted(par_intention.items(), key=lambda un: -un[1])
        ],
    }
