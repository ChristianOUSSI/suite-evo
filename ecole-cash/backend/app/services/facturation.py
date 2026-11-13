"""Le calendrier de ce qu'une famille doit, et ce qui l'éteint."""

from __future__ import annotations

from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Echeance, Eleve, Engagement, Imputation, Paiement
from ..utils import ajoute_mois

PAS_TRANCHES = {
    1: [9],
    2: [1, 5],
    3: [1, 5, 9],
    4: [1, 3, 6, 9],
}

LIBELLES = {
    1: "première tranche",
    2: "deuxième tranche",
    3: "troisième tranche",
    4: "quatrième tranche",
}


def total_annuel(engagement: Engagement) -> int:
    """Ce que l'année coûte, remise déduite."""
    brut = (
        engagement.scolarite
        + engagement.cantine
        + engagement.transport
        + engagement.autres
    )
    return max(0, brut - engagement.remise)


def part(du: int, tranches: int, rang: int) -> int:
    """Le partage en tranches égales, le reste pour la dernière."""
    base = du // tranches
    if rang == tranches:
        return du - base * (tranches - 1)
    return base


def echeancier(rentree: date, tranches: int) -> list[date]:
    """Les dates des termes, posées sur le calendrier scolaire."""
    pas = PAS_TRANCHES.get(tranches, PAS_TRANCHES[3])
    return [ajoute_mois(rentree, mois).replace(day=25) for mois in pas]


def echeancier_depuis(premiere: date, tranches: int) -> list[date]:
    """Le même rythme de tranches, mais ancoré sur une date choisie par l'école."""
    pas = PAS_TRANCHES.get(tranches, PAS_TRANCHES[3])
    return [ajoute_mois(premiere, mois - pas[0]) for mois in pas]


def poser_echeances(
    db: Session,
    engagement: Engagement,
    rentree: date,
    premiere: date | None = None,
) -> list[Echeance]:
    """Une ligne par tranche, du déjà payé imputé sur la première."""
    db.query(Echeance).filter(Echeance.engagement_id == engagement.id).delete()
    db.flush()
    dates = (
        echeancier_depuis(premiere, engagement.tranches)
        if premiere
        else echeancier(rentree, engagement.tranches)
    )
    lignes: list[Echeance] = []
    for rang, due in enumerate(dates, start=1):
        lignes.append(
            Echeance(
                ecole_id=engagement.ecole_id,
                engagement_id=engagement.id,
                rang=rang,
                libelle=LIBELLES.get(rang, f"tranche {rang}"),
                due=due,
                montant=part(total_annuel(engagement), engagement.tranches, rang),
            )
        )
    db.add_all(lignes)
    db.flush()
    debrayage(db, engagement, imputer_deja=engagement.solde_compte)
    return lignes


def debrayage(db: Session, engagement: Engagement, imputer_deja: int) -> None:
    """Réimpute ce qui a déjà été encaissé, terme par terme, du plus ancien."""
    for ligne in engagement.echeances:
        ligne.impute = 0
    db.flush()
    reste = imputer_deja
    for ligne in triees(engagement.echeances):
        if reste <= 0:
            break
        ligne.impute = min(reste, ligne.montant)
        reste -= ligne.impute
    db.flush()


def triees(lignes: list[Echeance]) -> list[Echeance]:
    return sorted(lignes, key=lambda ligne: (ligne.due, ligne.rang))


def rester(lignes: list[Echeance]) -> int:
    return max(0, sum(ligne.montant - ligne.impute for ligne in lignes))


def engagement_de(db: Session, eleve: Eleve, annee: str) -> Engagement | None:
    return db.scalar(
        select(Engagement).where(
            Engagement.eleve_id == eleve.id, Engagement.annee == annee
        )
    )


def imputer(db: Session, paiement: Paiement) -> list[Imputation]:
    """Un encaissement éteint les termes du plus ancien au plus récent."""
    lignes = db.scalars(
        select(Echeance)
        .join(Engagement, Echeance.engagement_id == Engagement.id)
        .where(Engagement.eleve_id == paiement.eleve_id)
        .order_by(Echeance.due, Echeance.rang)
    ).all()
    reste = paiement.montant
    gardees: list[Imputation] = []
    for ligne in lignes:
        libre = ligne.montant - ligne.impute
        if libre <= 0 or reste <= 0:
            continue
        prise = min(libre, reste)
        ligne.impute += prise
        reste -= prise
        gardees.append(
            Imputation(
                ecole_id=paiement.ecole_id,
                paiement_id=paiement.id,
                echeance_id=ligne.id,
                montant=prise,
            )
        )
    db.add_all(gardees)
    db.flush()
    return gardees


def retirer_imputations(db: Session, paiement: Paiement) -> None:
    """Une annulation replace chaque terme là où il était."""
    for imputation in list(paiement.imputations):
        ligne = imputation.echeance
        ligne.impute = max(0, ligne.impute - imputation.montant)
        db.delete(imputation)
    db.flush()


def prochaine(lignes: list[Echeance], jour: date) -> Echeance | None:
    for ligne in triees(lignes):
        if ligne.montant - ligne.impute > 0:
            return ligne
    return None


def en_retard(lignes: list[Echeance], jour: date) -> list[Echeance]:
    return [
        ligne
        for ligne in triees(lignes)
        if ligne.montant - ligne.impute > 0 and ligne.due < jour
    ]


def statut_ligne(ligne: Echeance, jour: date) -> str:
    libre = ligne.montant - ligne.impute
    if libre <= 0:
        return "solde"
    if ligne.due > jour:
        return "a_venir"
    if ligne.due == jour:
        return "aujourdhui"
    return "retard"


def statut_famille(engagement: Engagement | None, jour: date) -> str:
    if not engagement:
        return "aucun"
    lignes = engagement.echeances
    if rester(lignes) == 0:
        return "solde"
    if en_retard(lignes, jour):
        return "retard"
    return "a_venir"
