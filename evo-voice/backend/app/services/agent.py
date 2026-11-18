from __future__ import annotations

"""L'agent autonome : les tâches, leurs exécutions, le journal.

En mode démo, « lancer » produit une exécution déterministe : le
résultat dépend du titre et du type, rien ne part sur le réseau.
"""

import hashlib
import random
import re
from datetime import timedelta

from sqlalchemy import case, select
from sqlalchemy.orm import Session

from ..messages import refus
from ..models import Execution, Organisation, Tache, User
from ..schemas import CompletionEntree, TacheCorrection, TacheEntree
from ..utils import aujourdhui, maintenant, periode_de
from .present import execution_dict, tache_dict

RESULTATS_PAR_TYPE = {
    "recherche": "Recherche menée : les sources locales ont été croisées. Les points clés sont listés dans les détails.",
    "redaction": "Texte rédigé : plan, introduction, développement, conclusion — prêt à relire.",
    "resume": "Résumé produit : les faits essentiels en une page, sans perte du sens.",
    "analyse": "Analyse rendue : forces, faiblesses, opportunités et risques identifiés.",
    "automatisation": "Automatisation préparée : les étapes sont séquencées et vérifiables une par une.",
    "autre": "Traitement effectué : la consigne a été exécutée pas à pas.",
}


def tache_de(db: Session, organisation: Organisation, tache_id: int) -> Tache:
    tache = db.get(Tache, tache_id)
    if tache is None or tache.organisation_id != organisation.id:
        raise refus("tache_inconnue", 404)
    return tache


def enregistrer_tache(
    db: Session, organisation: Organisation, entree: TacheEntree, compte: User
) -> Tache:
    tache = Tache(
        organisation_id=organisation.id,
        titre=entree.titre.strip(),
        consigne=entree.consigne.strip(),
        type=entree.type,
        priorite=entree.priorite,
        statut="en_attente",
        cree_par=compte.nom,
    )
    db.add(tache)
    db.commit()
    db.refresh(tache)
    return tache


def corriger_tache(
    db: Session, organisation: Organisation, tache_id: int, patch: dict
) -> Tache:
    tache = tache_de(db, organisation, tache_id)
    for cle, valeur in patch.items():
        if valeur is not None:
            setattr(tache, cle, valeur)
    db.commit()
    db.refresh(tache)
    return tache


def _resultat_de(tache: Tache) -> tuple[str, str]:
    """Un résultat déterministe : le même titre rend toujours le même texte."""
    graine = int(hashlib.sha256(tache.titre.encode("utf-8")).hexdigest()[:8], 16)
    alea = random.Random(graine)
    base = RESULTATS_PAR_TYPE.get(tache.type, RESULTATS_PAR_TYPE["autre"])
    mots = [
        "points clés identifiés",
        "hypothèses explicites",
        "prochaines étapes proposées",
        "vérifications recommandées",
        "sources à confirmer",
    ]
    details = "; ".join(alea.sample(mots, 3))
    return base, details


def executer_tache(
    db: Session, organisation: Organisation, tache_id: int
) -> Execution:
    """Lance l'agent : la tâche passe en cours, l'exécution est journalisée."""
    tache = tache_de(db, organisation, tache_id)
    if tache.statut not in ("en_attente", "en_cours"):
        raise refus("tache_pas_lancable", 409)

    tache.statut = "en_cours"
    db.flush()

    debut = maintenant()
    resultat, details = _resultat_de(tache)
    fin = debut + timedelta(seconds=alea_secondes(tache.id))

    execution = Execution(
        organisation_id=organisation.id,
        tache_id=tache.id,
        statut="terminee",
        debut_le=debut,
        fin_le=fin,
        duree_secondes=max(1, int((fin - debut).total_seconds())),
        resultat=resultat,
        details=details,
    )
    tache.statut = "terminee"
    tache.resultat = resultat
    tache.erreur = ""
    tache.maj_le = fin
    db.add(execution)
    db.commit()
    db.refresh(execution)
    return execution


def alea_secondes(tache_id: int) -> int:
    return 8 + (tache_id * 37) % 45


def terminer_tache(
    db: Session, organisation: Organisation, tache_id: int, entree: CompletionEntree
) -> Tache:
    """La main humaine clôt : résultat ou erreur, avec une exécution au journal."""
    tache = tache_de(db, organisation, tache_id)
    if entree.erreur.strip():
        tache.statut = "echec"
        tache.erreur = entree.erreur.strip()
    else:
        tache.statut = "terminee"
        tache.resultat = entree.resultat.strip()
        tache.erreur = ""
    debut = maintenant()
    execution = Execution(
        organisation_id=organisation.id,
        tache_id=tache.id,
        statut="echec" if tache.statut == "echec" else "terminee",
        debut_le=debut,
        fin_le=debut,
        duree_secondes=0,
        resultat=tache.resultat,
        details="saisie manuelle",
    )
    db.add(execution)
    db.commit()
    db.refresh(tache)
    return tache


def etat(db: Session, organisation: Organisation) -> dict:
    taches = db.scalars(
        select(Tache).where(Tache.organisation_id == organisation.id)
    ).all()
    executions = db.scalars(
        select(Execution).where(Execution.organisation_id == organisation.id)
    ).all()
    periode = periode_de(aujourdhui())
    return {
        "jour": aujourdhui().isoformat(),
        "periode": periode,
        "taches": len(taches),
        "en_attente": sum(1 for un in taches if un.statut == "en_attente"),
        "en_cours": sum(1 for un in taches if un.statut == "en_cours"),
        "terminees": sum(1 for un in taches if un.statut == "terminee"),
        "echecs": sum(1 for un in taches if un.statut == "echec"),
        "annulees": sum(1 for un in taches if un.statut == "annulee"),
        "executions": len(executions),
        "executions_mois": sum(
            1 for un in executions
            if un.fin_le and periode_de(un.fin_le.date()) == periode
        ),
        "haute_priorite": sum(
            1 for un in taches if un.priorite == "haute" and un.statut in ("en_attente", "en_cours")
        ),
    }


def liste_taches(
    db: Session,
    organisation: Organisation,
    statut: str | None = None,
    type_: str | None = None,
    recherche: str | None = None,
    limite: int = 500,
) -> list[dict]:
    taches = list(
        db.scalars(
            select(Tache)
            .where(Tache.organisation_id == organisation.id)
            .order_by(
                case(
                    (Tache.priorite == "haute", 0),
                    (Tache.priorite == "normale", 1),
                    else_=2,
                ),
                Tache.maj_le.desc(),
            )
            .limit(limite)
        ).all()
    )
    if statut:
        taches = [un for un in taches if un.statut == statut]
    if type_:
        taches = [un for un in taches if un.type == type_]
    if recherche:
        motif = recherche.strip().lower()
        taches = [
            un
            for un in taches
            if motif in un.titre.lower()
            or motif in un.consigne.lower()
            or motif in un.cree_par.lower()
            or motif in un.resultat.lower()
        ]
    return [tache_dict(un) for un in taches]


def liste_executions(
    db: Session,
    organisation: Organisation,
    tache_id: int | None = None,
    limite: int = 500,
) -> list[dict]:
    executions = list(
        db.scalars(
            select(Execution)
            .where(Execution.organisation_id == organisation.id)
            .order_by(Execution.fin_le.desc())
            .limit(limite)
        ).all()
    )
    if tache_id:
        executions = [un for un in executions if un.tache_id == tache_id]
    return [execution_dict(un) for un in executions]


def recap(db: Session, organisation: Organisation, periode: str) -> dict:
    """Le mois de l'agent : tâches confiées, exécutées, par type."""
    if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", periode or ""):
        raise refus("periode_inconnue")

    taches = db.scalars(
        select(Tache).where(Tache.organisation_id == organisation.id)
    ).all()
    executions = db.scalars(
        select(Execution).where(Execution.organisation_id == organisation.id)
    ).all()

    creees = [
        un for un in taches
        if un.cree_le and periode_de(un.cree_le.date()) == periode
    ]
    terminees = [
        un for un in taches
        if un.statut == "terminee" and un.maj_le and periode_de(un.maj_le.date()) == periode
    ]
    exec_mois = [
        un for un in executions
        if un.fin_le and periode_de(un.fin_le.date()) == periode
    ]
    par_statut: dict[str, int] = {}
    for un in taches:
        par_statut[un.statut] = par_statut.get(un.statut, 0) + 1
    par_type: dict[str, int] = {}
    for un in creees:
        par_type[un.type] = par_type.get(un.type, 0) + 1

    return {
        "periode": periode,
        "taches": len(taches),
        "creees_mois": len(creees),
        "terminees_mois": len(terminees),
        "echecs_mois": sum(1 for un in taches if un.statut == "echec" and un.maj_le and periode_de(un.maj_le.date()) == periode),
        "executions_mois": len(exec_mois),
        "secondes_mois": sum(un.duree_secondes for un in exec_mois),
        "en_cours": sum(1 for un in taches if un.statut in ("en_attente", "en_cours")),
        "par_statut": par_statut,
        "par_type": [
            {"type": cle, "taches": n}
            for cle, n in sorted(par_type.items(), key=lambda un: -un[1])
        ],
    }
