"""Les quatre avis qui encadrent une échéance, puis la suspension."""

from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Echeance, Ecole, Eleve, Engagement, Relance
from ..utils import jour_fr, maintenant
from . import facturation, messagerie

PALIERS = {
    0: "rappel avant",
    1: "jour dit",
    2: "premier retard",
    3: "dernier avis",
}


def dates_programme(ecole: Ecole, due: date) -> dict[int, date]:
    """Les quatre dates, posées depuis les réglages de l'école."""
    milieu = max(1, ecole.tolerance_retard // 2)
    decalages = {
        0: -ecole.relance_avance,
        1: 0,
        2: milieu,
        3: ecole.tolerance_retard,
    }
    return {
        palier: due + timedelta(days=decalage)
        for palier, decalage in decalages.items()
    }


def programme(db: Session, ecole: Ecole, annee: str) -> int:
    """Pose les avis qui manquent, sans jamais en doubles."""
    today = maintenant().date()
    lignes = db.scalars(
        select(Echeance)
        .join(Engagement, Echeance.engagement_id == Engagement.id)
        .where(Engagement.annee == annee, Engagement.ecole_id == ecole.id)
    ).all()
    deja = {
        (relance.echeance_id, relance.palier)
        for relance in db.scalars(
            select(Relance).where(Relance.ecole_id == ecole.id)
        )
    }
    canal = "whatsapp" if ecole.whatsapp_actif else "sms"
    ajoutees = 0
    for ligne in lignes:
        if ligne.montant - ligne.impute <= 0:
            continue
        eleve = db.get(Eleve, ligne.engagement.eleve_id)
        for palier, date_envoi in dates_programme(ecole, ligne.due).items():
            if (ligne.id, palier) in deja or date_envoi < today:
                continue
            db.add(
                Relance(
                    ecole_id=ecole.id,
                    eleve_id=eleve.id,
                    echeance_id=ligne.id,
                    palier=palier,
                    libelle=PALIERS[palier],
                    programme=date_envoi,
                    canal=canal,
                    corps=corps(ecole, eleve, ligne, palier),
                )
            )
            ajoutees += 1
    db.commit()
    return ajoutees


def corps(ecole: Ecole, eleve: Eleve, ligne: Echeance, palier: int) -> str:
    """Le texte de l'avis, plus sec à mesure que le retard s'installe."""
    reste = ligne.montant - ligne.impute
    texte = messagerie.relance_texte(
        ecole,
        f"{eleve.prenoms} {eleve.nom}",
        ligne.libelle,
        jour_fr(ligne.due),
        reste,
        ecole.ton,
    )
    if palier == 3:
        terme = ligne.due + timedelta(days=ecole.tolerance_retard)
        texte += (
            f" Passé le {jour_fr(terme)}, l'élève est suspendu de cours "
            "jusqu'à régularisation."
        )
    return texte


def relancer(db: Session, ecole: Ecole, jour: date | None = None) -> dict:
    """Envoie les avis dus, annule ceux devenus inutiles, suspend qui traîne."""
    today = jour or maintenant().date()
    dues = db.scalars(
        select(Relance)
        .where(
            Relance.ecole_id == ecole.id,
            Relance.envoyee.is_(False),
            Relance.annulee.is_(False),
            Relance.programme <= today,
        )
        .order_by(Relance.programme)
    ).all()
    envoyees = 0
    suspendus = 0
    for relance in dues:
        ligne = db.get(Echeance, relance.echeance_id)
        eleve = db.get(Eleve, relance.eleve_id)
        if not ligne or ligne.montant - ligne.impute <= 0 or not eleve:
            relance.annulee = True
            continue
        trace = messagerie.envoyer(
            ecole, relance.canal, eleve.tuteur_telephone or "", relance.corps
        )
        relance.envoyee = True
        relance.envoyee_le = maintenant()
        relance.reference = trace["reference"]
        relance.corps = trace["corps"]
        envoyees += 1
        if relance.palier == 3 and eleve.statut == "suivi":
            eleve.statut = "suspendu"
            eleve.motif_statut = (
                f"{ligne.libelle} non réglée depuis le {jour_fr(ligne.due)}"
            )
            suspendus += 1

    annulees = annuler_inutiles(db, ecole)
    db.commit()
    return {
        "envoyees": envoyees,
        "annulees": annulees,
        "suspendus": suspendus,
        "jour": today.isoformat(),
    }


def annuler_inutiles(db: Session, ecole: Ecole) -> int:
    """Un avis qui ne sert plus tombe, même s'il est encore programmé."""
    sommeilleuses = db.scalars(
        select(Relance).where(
            Relance.ecole_id == ecole.id,
            Relance.envoyee.is_(False),
            Relance.annulee.is_(False),
        )
    ).all()
    tombees = 0
    for relance in sommeilleuses:
        ligne = db.get(Echeance, relance.echeance_id)
        if not ligne or ligne.montant - ligne.impute <= 0:
            relance.annulee = True
            tombees += 1
    return tombees


def regulariser(db: Session, ecole: Ecole, eleve: Eleve, annee: str) -> None:
    """Une famille qui paie repasse en suivi, les avis restants tombent."""
    engagement = facturation.engagement_de(db, eleve, annee)
    if not engagement:
        return
    retards = facturation.en_retard(
        list(engagement.echeances), maintenant().date()
    )
    if eleve.statut == "suspendu" and not retards:
        eleve.statut = "suivi"
        eleve.motif_statut = ""
    for relance in db.scalars(
        select(Relance).where(
            Relance.ecole_id == ecole.id,
            Relance.eleve_id == eleve.id,
            Relance.envoyee.is_(False),
        )
    ).all():
        ligne = db.get(Echeance, relance.echeance_id)
        if not ligne or ligne.montant - ligne.impute <= 0:
            relance.annulee = True
    db.commit()
