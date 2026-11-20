from fastapi import APIRouter

from ..deps import DbSession
from ..messages import refus
from ..models import Remise
from ..services import present, tontine
from ..utils import date_longue, fcfa

router = APIRouter(tags=["public"])


@router.get("/public/remises/{jeton}")
def verifier(jeton: str, db: DbSession) -> dict:
    """Le reçu de remise, vérifiable sans compte.

    Le membre qui a reçu le pot peut montrer son code à n'importe qui, même à
    un parent qui n'a pas le téléphone de la trésorière. Rien d'autre que cette
    remise n'est exposé : ni les autres noms, ni les montants du cercle.
    """
    remise = db.query(Remise).filter(Remise.jeton == jeton.strip().upper()).first()
    if remise is None:
        raise refus("jeton_inconnu", 404)

    groupe = remise.tour.groupe
    return {
        "valide": True,
        "groupe": groupe.nom,
        "ville": groupe.ville,
        "quartier": groupe.quartier,
        "numero_tour": remise.tour.numero,
        "jour": remise.tour.date_prevue.isoformat(),
        "jour_label": date_longue(remise.tour.date_prevue),
        "membre": remise.membre.nom,
        "montant": remise.montant,
        "montant_label": fcfa(remise.montant),
        "mode": remise.mode,
        "temoin": remise.temoin,
        "note": remise.note,
        "moment": remise.moment.isoformat(),
        "abonnement": groupe.abonnement_mensuel,
    }


@router.get("/public/membre/{code}")
def fiche_membre(code: str, db: DbSession) -> dict:
    """La fiche du membre, vérifiable sans compte avec son code personnel.

    Le membre qui doute de sa cagnotte montre son code : il voit ce qu'il
    a cotisé et ce qu'il a reçu, sans déranger la trésorière.
    """
    fiche = tontine.fiche_membre_publique(db, code)
    if fiche is None:
        raise refus("code_inconnu", 404)
    return fiche
