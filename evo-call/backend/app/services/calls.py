from __future__ import annotations

"""Le registre du standard : les appels et la file.

Un appel entre en file ; un agent le prend (en_cours), le termine ou le
rend sans réponse ; le rappel porte sa date et revient. Le passé ne se
réécrit pas : on change de statut.
"""

import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..messages import refus
from ..models import Appel, Organisation, User
from ..schemas import AppelEntree
from ..utils import aujourdhui, maintenant, periode_de


def appel_de(db: Session, organisation: Organisation, appel_id: int) -> Appel:
    appel = db.get(Appel, appel_id)
    if appel is None or appel.organisation_id != organisation.id:
        raise refus("appel_inconnu", 404)
    return appel


def _verifier_jour(jour, champ: str) -> None:
    if jour and jour > aujourdhui():
        raise refus("saisie", **{champ: "le jour"})


def enregistrer_appel(
    db: Session, organisation: Organisation, entree: AppelEntree, compte: User
) -> Appel:
    jour = entree.date or aujourdhui()
    _verifier_jour(jour, "date")
    if entree.date_rappel and entree.date_rappel < jour:
        raise refus("saisie", **{"date_rappel": "avant l'appel"})

    appel = Appel(
        organisation_id=organisation.id,
        client_nom=entree.client_nom.strip(),
        client_telephone=entree.client_telephone,
        sens=entree.sens,
        motif=entree.motif,
        statut="en_file",
        duree_secondes=entree.duree_secondes,
        date=jour,
        date_rappel=entree.date_rappel,
        note=entree.note.strip(),
        cree_par=compte.id,
    )
    db.add(appel)
    db.commit()
    db.refresh(appel)
    return appel


def _agent_valide(db: Session, organisation: Organisation, agent_id: int | None) -> User | None:
    if agent_id is None:
        return None
    agent = db.get(User, agent_id)
    if agent is None or agent.organisation_id != organisation.id:
        raise refus("saisie", **{"agent_id": "le standard"})
    return agent


def corriger_appel(
    db: Session, organisation: Organisation, appel_id: int, patch: dict, compte: User
) -> Appel:
    """Le statut pilote l'agent : prendre, rendre, terminer, rappeler."""
    appel = appel_de(db, organisation, appel_id)
    statut = patch.get("statut")
    if statut is not None:
        if statut in ("en_cours", "termine"):
            agent_id = patch.get("agent_id") or appel.agent_id or compte.id
            patch["agent_id"] = agent_id
            _agent_valide(db, organisation, agent_id)
        if statut == "termine" and appel.statut != "termine":
            patch.setdefault("heure_appel", maintenant())
        if statut == "rappel":
            if not patch.get("date_rappel") and not appel.date_rappel:
                raise refus("saisie", **{"date_rappel": "le rappel"})
        if statut != "rappel" and "date_rappel" in patch and patch["date_rappel"] is None:
            pass
    for cle, valeur in patch.items():
        if valeur is not None:
            setattr(appel, cle, valeur)
    if statut == "en_file":
        appel.agent_id = None
        appel.heure_appel = None
    db.commit()
    db.refresh(appel)
    return appel


def etat(db: Session, organisation: Organisation) -> dict:
    """La vitre du standard : la file, les appels du jour, les agents."""
    aujourdhui_d = aujourdhui()
    appels = db.scalars(
        select(Appel).where(Appel.organisation_id == organisation.id)
    ).all()
    du_jour = [un for un in appels if un.date == aujourdhui_d]
    en_file = [un for un in appels if un.statut == "en_file"]
    en_cours = [un for un in appels if un.statut == "en_cours"]
    rappels = [un for un in appels if un.statut == "rappel"]
    return {
        "jour": aujourdhui_d.isoformat(),
        "periode": periode_de(aujourdhui_d),
        "appels": len(appels),
        "en_file": len(en_file),
        "en_cours": len(en_cours),
        "rappels": len(rappels),
        "du_jour": len(du_jour),
        "termines_jour": sum(1 for un in du_jour if un.statut == "termine"),
        "sans_reponse_jour": sum(1 for un in du_jour if un.statut == "sans_reponse"),
        "duree_moyenne_jour": (
            sum(un.duree_secondes for un in du_jour) // max(1, sum(1 for un in du_jour if un.duree_secondes > 0))
            if any(un.duree_secondes > 0 for un in du_jour) else 0
        ),
    }


def liste_appels(
    db: Session,
    organisation: Organisation,
    statut: str | None = None,
    agent_id: int | None = None,
    periode: str | None = None,
    sens: str | None = None,
    recherche: str | None = None,
    limite: int = 500,
) -> list[dict]:
    from .present import appel_dict

    requete = (
        select(Appel)
        .where(Appel.organisation_id == organisation.id)
        .order_by(Appel.date.desc(), Appel.id.desc())
        .limit(limite)
    )
    appels = list(db.scalars(requete).all())
    if statut:
        appels = [un for un in appels if un.statut == statut]
    if agent_id is not None:
        appels = [un for un in appels if un.agent_id == agent_id]
    if sens:
        appels = [un for un in appels if un.sens == sens]
    if periode:
        appels = [un for un in appels if periode_de(un.date) == periode]
    if recherche:
        motif = recherche.strip().lower()
        appels = [
            un
            for un in appels
            if motif in un.client_nom.lower()
            or motif in un.client_telephone.replace("+237", "").replace(" ", "")
            or motif in un.note.lower()
        ]
    return [appel_dict(un) for un in appels]


def fiche_appel(db: Session, organisation: Organisation, appel_id: int) -> dict:
    from .present import appel_dict

    return appel_dict(appel_de(db, organisation, appel_id))


def recap(db: Session, organisation: Organisation, periode: str) -> dict:
    """Le mois du standard : appels, durées, par agent et par motif."""
    if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", periode or ""):
        raise refus("periode_inconnue")

    appels = db.scalars(
        select(Appel).where(Appel.organisation_id == organisation.id)
    ).all()
    du_mois = [un for un in appels if periode_de(un.date) == periode]
    par_statut: dict[str, int] = {}
    for un in du_mois:
        par_statut[un.statut] = par_statut.get(un.statut, 0) + 1
    par_agent: dict[str, dict] = {}
    for un in du_mois:
        nom = un.agent.nom if un.agent else "-"
        if nom not in par_agent:
            par_agent[nom] = {"agent": nom, "appels": 0, "duree": 0}
        par_agent[nom]["appels"] += 1
        par_agent[nom]["duree"] += un.duree_secondes
    par_motif: dict[str, int] = {}
    for un in du_mois:
        par_motif[un.motif] = par_motif.get(un.motif, 0) + 1
    durees = [un.duree_secondes for un in du_mois if un.duree_secondes > 0]

    return {
        "periode": periode,
        "appels": len(appels),
        "appels_mois": len(du_mois),
        "par_statut": par_statut,
        "par_agent": sorted(par_agent.values(), key=lambda un: -un["appels"]),
        "par_motif": [
            {"motif": cle, "appels": n}
            for cle, n in sorted(par_motif.items(), key=lambda un: -un[1])
        ],
        "duree_totale": sum(durees),
        "duree_moyenne": sum(durees) // len(durees) if durees else 0,
    }


def rappel_public(db: Session, organisation: Organisation, entree) -> Appel:
    """Le client qui écrit sans compte : il demande à être rappelé.

    L'appel entre directement dans la case « rappel » de la file - le
    standard le voit comme un rappel programmé, pas comme un appel perdu.
    Le compte auteur est celui du responsable : la machine a parlé, pas
    une personne.
    """
    auteur = db.scalar(
        select(User)
        .where(User.organisation_id == organisation.id)
        .order_by(User.role != "responsable", User.id)
        .limit(1)
    )
    if auteur is None:
        raise refus("saisie", **{"centre": "sans agent"})

    note = f"[formulaire] {entree.note.strip()}".strip()
    appel = Appel(
        organisation_id=organisation.id,
        client_nom=entree.nom.strip(),
        client_telephone=entree.telephone,
        sens="entrant",
        motif=entree.motif,
        statut="rappel",
        date=aujourdhui(),
        date_rappel=entree.creneau or aujourdhui(),
        note=note,
        cree_par=auteur.id,
    )
    db.add(appel)
    db.commit()
    db.refresh(appel)
    return appel
