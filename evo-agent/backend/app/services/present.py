from __future__ import annotations

"""Ce que l'API rend à l'écran : des nombres, des dates ISO, des clés stables."""

from ..models import Execution, Organisation, Tache, User
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


def tache_dict(tache: Tache) -> dict:
    executions = len(tache.executions) if tache.executions else 0
    return {
        "id": tache.id,
        "titre": tache.titre,
        "consigne": tache.consigne,
        "type": tache.type,
        "priorite": tache.priorite,
        "statut": tache.statut,
        "resultat": tache.resultat,
        "erreur": tache.erreur,
        "cree_par": tache.cree_par,
        "executions": executions,
        "cree_le": tache.cree_le.isoformat(timespec="seconds"),
        "maj_le": tache.maj_le.isoformat(timespec="seconds") if tache.maj_le else None,
    }


def execution_dict(execution: Execution) -> dict:
    return {
        "id": execution.id,
        "tache_id": execution.tache_id,
        "tache": execution.tache.titre if execution.tache else "",
        "statut": execution.statut,
        "debut_le": execution.debut_le.isoformat(timespec="seconds") if execution.debut_le else None,
        "fin_le": execution.fin_le.isoformat(timespec="seconds") if execution.fin_le else None,
        "duree_secondes": execution.duree_secondes,
        "resultat": execution.resultat,
        "details": execution.details,
    }
