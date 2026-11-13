from __future__ import annotations

"""Le pointage et le récap.

Deux règles, et elles sont toute la valeur du produit :

1. Une journée, un employé, une ligne. Le second pointage du même jour corrige
   le premier au lieu de s'ajouter : deux lignes le même jour doublent la
   présence.
2. Le récap se calcule à la lecture, jamais à l'écriture. Les heures se relisent
   sur les lignes, donc une correction après coup ne laisse pas un vieux
   document faux.
"""

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..messages import refus
from ..models import ETATS, Employe, Organisation, Presence, User
from ..security import code_de_controle
from ..schemas import FORME_PERIODE
from ..utils import aujourdhui, bornes_de, maintenant, periode_de

TOUS_STATUTS = tuple(ETATS)


def _periode_sure(periode: str) -> str:
    """Un mois mal écrit se refuse ici, pas dans `date()`."""
    if not FORME_PERIODE.match(periode or ""):
        raise refus("periode_inconnue")
    annee, mois = (int(un) for un in periode.split("-"))
    if not 1 <= mois <= 12:
        raise refus("periode_inconnue")
    return periode


def _heure_en_minutes(texte: str) -> int | None:
    """« 08:30 » en minutes depuis minuit ; vide rend None."""
    if not texte:
        return None
    heures, minutes = (int(un) for un in texte.split(":"))
    return heures * 60 + minutes


def heures_travaillees(arrivee: str, depart: str) -> float:
    """La journée compte en heures une fois les deux pointes posées."""
    debut = _heure_en_minutes(arrivee)
    fin = _heure_en_minutes(depart)
    if debut is None or fin is None or fin <= debut:
        return 0.0
    return round((fin - debut) / 60, 2)


def employe_de(db: Session, organisation: Organisation, employe_id: int) -> Employe:
    employe = db.get(Employe, employe_id)
    if employe is None or employe.organisation_id != organisation.id:
        raise refus("employe_inconnu", 404)
    return employe


def employes_actifs(db: Session, organisation: Organisation) -> list[Employe]:
    return list(
        db.scalars(
            select(Employe)
            .where(Employe.organisation_id == organisation.id, Employe.actif.is_(True))
            .order_by(Employe.nom)
        ).all()
    )


def presences_du_jour(db: Session, jour: date) -> dict[int, Presence]:
    """Toutes les lignes du jour, toutes entreprises : la clé est l'employé."""
    lignes = db.scalars(select(Presence).where(Presence.jour == jour)).all()
    return {un.employe_id: un for un in lignes}


def equipe_du_jour(
    db: Session, organisation: Organisation, jour: date
) -> list[dict]:
    """L'équipe du jour : chaque employé actif, avec ou sans sa ligne."""
    lignes = db.scalars(
        select(Presence).where(
            Presence.jour == jour,
            Presence.employe.has(Employe.organisation_id == organisation.id),
        )
    ).all()
    par_employe = {un.employe_id: un for un in lignes}
    rendu = []
    for employe in employes_actifs(db, organisation):
        pointe = par_employe.get(employe.id)
        rendu.append(
            {
                "employe_id": employe.id,
                "nom": employe.nom,
                "service": employe.service,
                "telephone": employe.telephone,
                "pointe": pointe is not None,
                "id": pointe.id if pointe else None,
                "statut": pointe.statut if pointe else None,
                "arrivee": pointe.arrivee if pointe else "",
                "depart": pointe.depart if pointe else "",
                "note": pointe.note if pointe else "",
            }
        )
    return rendu


def pointer(
    db: Session,
    organisation: Organisation,
    entree,
    compte: User,
) -> Presence:
    """La ligne du jour, créée ou corrigée."""
    jour = entree.jour
    if jour > aujourdhui():
        raise refus("date_futures")
    if entree.statut not in ETATS:
        raise refus("statut_inconnu")

    employe = employe_de(db, organisation, entree.employe_id)
    existant = db.scalar(
        select(Presence).where(
            Presence.employe_id == employe.id,
            Presence.jour == jour,
        )
    )
    if existant is not None:
        existant.statut = entree.statut
        existant.arrivee = entree.arrivee
        existant.depart = entree.depart
        existant.note = entree.note.strip()
        existant.pointe_par = compte.id
        existant.pointe_le = maintenant()
        db.commit()
        db.refresh(existant)
        return existant

    ligne = Presence(
        employe_id=employe.id,
        jour=jour,
        statut=entree.statut,
        arrivee=entree.arrivee,
        depart=entree.depart,
        note=entree.note.strip(),
        pointe_par=compte.id,
    )
    db.add(ligne)
    db.commit()
    db.refresh(ligne)
    return ligne


def corriger_presence(
    db: Session, organisation: Organisation, presence_id: int, entree, compte: User
) -> Presence:
    ligne = db.get(Presence, presence_id)
    if ligne is None or ligne.employe.organisation_id != organisation.id:
        raise refus("presence_inconnue", 404)
    if entree.statut is not None:
        if entree.statut not in ETATS:
            raise refus("statut_inconnu")
        ligne.statut = entree.statut
    if entree.arrivee is not None:
        ligne.arrivee = entree.arrivee
    if entree.depart is not None:
        ligne.depart = entree.depart
    if entree.note is not None:
        ligne.note = entree.note.strip()
    ligne.pointe_par = compte.id
    ligne.pointe_le = maintenant()
    db.commit()
    db.refresh(ligne)
    return ligne


def recap(
    db: Session,
    organisation: Organisation,
    periode: str,
    tous: bool = False,
) -> dict:
    """Le mois de chacun, recalculé à la demande."""
    periode = _periode_sure(periode)
    debut, fin = bornes_de(periode)
    rangees = []
    for employe in db.scalars(
        select(Employe)
        .where(Employe.organisation_id == organisation.id)
        .order_by(Employe.nom)
    ).all():
        if not tous and not employe.actif:
            continue
        lignes = list(
            db.scalars(
                select(Presence).where(
                    Presence.employe_id == employe.id,
                    Presence.jour >= debut,
                    Presence.jour <= fin,
                )
            ).all()
        )
        presents = sum(1 for un in lignes if un.statut == "present")
        retards = sum(1 for un in lignes if un.statut == "retard")
        absents = sum(1 for un in lignes if un.statut == "absent")
        heures = round(sum(heures_travaillees(un.arrivee, un.depart) for un in lignes), 1)
        rangees.append(
            {
                "employe_id": employe.id,
                "nom": employe.nom,
                "service": employe.service,
                "telephone": employe.telephone,
                "presents": presents,
                "retards": retards,
                "absents": absents,
                "jours": len(lignes),
                "heures": heures,
                "code": code_de_controle(organisation.id, employe.id, periode),
            }
        )
    return {
        "organisation_id": organisation.id,
        "periode": periode,
        "lignes": rangees,
        "effectif": len(rangees),
        "total_heures": round(sum(un["heures"] for un in rangees), 1),
        "total_presents": sum(un["presents"] for un in rangees),
        "total_retards": sum(un["retards"] for un in rangees),
        "total_absents": sum(un["absents"] for un in rangees),
    }


def bulletin(
    db: Session, organisation: Organisation, employe_id: int, periode: str
) -> dict:
    """Le mois d'un employé, avec son code."""
    periode = _periode_sure(periode)
    employe = employe_de(db, organisation, employe_id)
    resume = next(
        (
            un
            for un in recap(db, organisation, periode, tous=True)["lignes"]
            if un["employe_id"] == employe.id
        ),
        None,
    )
    debut, fin = bornes_de(periode)
    lignes = list(
        db.scalars(
            select(Presence)
            .where(
                Presence.employe_id == employe.id,
                Presence.jour >= debut,
                Presence.jour <= fin,
            )
            .order_by(Presence.jour)
        ).all()
    )
    return {
        "employe_id": employe.id,
        "nom": employe.nom,
        "service": employe.service,
        "telephone": employe.telephone,
        "periode": periode,
        "presents": resume["presents"] if resume else 0,
        "retards": resume["retards"] if resume else 0,
        "absents": resume["absents"] if resume else 0,
        "jours": resume["jours"] if resume else 0,
        "heures": resume["heures"] if resume else 0.0,
        "code": code_de_controle(organisation.id, employe.id, periode),
        "jours_detailles": [
            {
                "jour": un.jour.isoformat(),
                "statut": un.statut,
                "arrivee": un.arrivee,
                "depart": un.depart,
                "note": un.note,
            }
            for un in lignes
        ],
    }


def retrouver_code(db: Session, code: str) -> tuple[Organisation, int, str] | None:
    """Le code porte l'employé et le mois ; on le retrouve sans base inversée.

    Il est dérivé d'un secret serveur, donc on ne peut pas le forger, mais il
    faut le recalculer pour retrouver son propriétaire : on balaie les fiches,
    et le balayage est borné par le nombre d'employés de la maison.
    """
    code_propre = (code or "").strip().upper()
    if len(code_propre) != 10:
        return None
    periode = periode_de(aujourdhui())
    mois = [periode, _mois_precedent(periode)]
    organisations = db.scalars(select(Organisation)).all()
    for organisation in organisations:
        for employe in db.scalars(
            select(Employe).where(Employe.organisation_id == organisation.id)
        ).all():
            for un in mois:
                if code_de_controle(organisation.id, employe.id, un) == code_propre:
                    return organisation, employe.id, un
    return None


def _mois_precedent(periode: str) -> str:
    annee, mois = (int(un) for un in periode.split("-"))
    return f"{annee:04d}-12" if mois == 1 else f"{annee:04d}-{mois - 1:02d}"
