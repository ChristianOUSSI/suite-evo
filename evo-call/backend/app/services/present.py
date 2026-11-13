from __future__ import annotations

"""Ce que l'API rend à l'écran : des nombres, des dates ISO, des clés stables."""

from ..models import Appel, Organisation, User
from ..utils import affiche_telephone, canonise_telephone, operateur


def organisation_dict(organisation: Organisation) -> dict:
    return {
        "id": organisation.id,
        "nom": organisation.nom,
        "ville": organisation.ville,
        "quartier": organisation.quartier,
        "telephone": organisation.telephone,
        "telephone_display": affiche_telephone(organisation.telephone),
    }


def compte_dict(compte: User) -> dict:
    return {"id": compte.id, "nom": compte.nom, "email": compte.email, "role": compte.role}


def duree_lisible(secondes: int) -> str:
    """« 4 min 32 s » : la durée qu'on lit au téléphone."""
    minutes, reste = divmod(secondes, 60)
    if minutes == 0:
        return f"{reste} s"
    return f"{minutes} min {reste:02d} s" if reste else f"{minutes} min"


def appel_dict(appel: Appel) -> dict:
    return {
        "id": appel.id,
        "client_nom": appel.client_nom,
        "client_telephone": appel.client_telephone,
        "client_telephone_display": affiche_telephone(appel.client_telephone),
        "client_joignable": canonise_telephone(appel.client_telephone) is not None,
        "client_operateur": operateur(appel.client_telephone),
        "sens": appel.sens,
        "motif": appel.motif,
        "statut": appel.statut,
        "agent_id": appel.agent_id,
        "agent": appel.agent.nom if appel.agent else "",
        "duree_secondes": appel.duree_secondes,
        "duree_lisible": duree_lisible(appel.duree_secondes),
        "date": appel.date.isoformat(),
        "date_rappel": appel.date_rappel.isoformat() if appel.date_rappel else None,
        "note": appel.note,
        "cree_par": appel.auteur.nom if appel.auteur else "",
        "cree_le": appel.cree_le.isoformat(timespec="seconds"),
    }
