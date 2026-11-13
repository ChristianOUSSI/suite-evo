"""Ce qui part vers un téléphone. En démo, rien ne quitte la machine."""

from __future__ import annotations

import secrets

from ..models import Ecole
from ..utils import affiche_telephone, canonise_telephone, fcfa

CANAUX = {"whatsapp": "WhatsApp", "sms": "SMS"}


def reference() -> str:
    return f"DEM-{secrets.token_hex(3).upper()}"


def actif(ecole: Ecole, canal: str) -> bool:
    if canal == "whatsapp":
        return ecole.whatsapp_actif
    return ecole.sms_actif


def envoyer(ecole: Ecole, canal: str, vers: str, texte: str) -> dict:
    """La trace de l'envoi, avec sa référence et son état."""
    numero = canonise_telephone(vers)
    if not numero:
        raise ValueError("Le numéro du parent ne suit pas le plan camerounais.")
    statut = "envoye" if actif(ecole, canal) else "coupé"
    corps = texte
    if statut == "coupé":
        coupure = (
            "Canal coupé dans les réglages de l'école."
            if canal == "whatsapp"
            else "Les SMS sont coupés dans les réglages de l'école."
        )
        corps = f"{texte}\n({coupure})"
    return {
        "canal": canal,
        "canal_label": CANAUX.get(canal, canal),
        "vers": numero,
        "vers_display": affiche_telephone(numero),
        "corps": corps,
        "statut": statut,
        "reference": reference(),
    }


def recu_texte(
    ecole: Ecole, eleve_nom: str, montant: int, mode_label: str, numero: str
) -> str:
    """Le message que le parent reçoit dans la minute qui suit le paiement."""
    return (
        f"{ecole.nom} : reçu {numero} pour {eleve_nom}. "
        f"{fcfa(montant)} réglés ({mode_label}). "
        "Merci de votre confiance."
    )


def relance_texte(
    ecole: Ecole, eleve_nom: str, libelle: str, due: str, reste: int, ton: str
) -> str:
    """Le rappel, posé en deux phrases, sans menacer."""
    reste_texte = fcfa(reste)
    if ton == "ferme":
        return (
            f"{ecole.nom} : {libelle} de {eleve_nom} était attendue le {due}. "
            f"Il reste {reste_texte}. Présentez-vous à la caisse avant la "
            "prochaine réunion."
        )
    return (
        f"{ecole.nom} : bonjour, la {libelle} de {eleve_nom} court jusqu'au "
        f"{due}. Il reste {reste_texte} à régler. La caisse vous reçoit "
        "du lundi au vendredi, de 7 h 30 à 15 h."
    )
