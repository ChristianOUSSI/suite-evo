"""L'encaissement au guichet : le reçu part dès que l'argent touche la caisse."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Ecole, Echeance, Eleve, Engagement, Paiement, Recu
from ..security import jeton_verif
from ..utils import maintenant
from . import facturation, messagerie

MODES = {
    "especes": "espèces",
    "momo_mtn": "MoMo MTN",
    "momo_orange": "Orange Money",
    "cheque": "chèque",
    "virement": "virement",
}


def mode_accepte(ecole: Ecole, mode: str) -> bool:
    if mode == "especes":
        return ecole.especes_actifs
    if mode == "momo_mtn":
        return ecole.momo_actif
    if mode == "momo_orange":
        return ecole.orange_actif
    return True


def engagement_courant(db: Session, eleve: Eleve, annee: str) -> Engagement:
    engagement = facturation.engagement_de(db, eleve, annee)
    if not engagement:
        raise ValueError(
            "Aucun engagement pour cette année. Ouvrez l'année de la classe d'abord."
        )
    return engagement


def numero_recu(db: Session, ecole_id: int, moment) -> str:
    total = (
        db.scalar(select(func.count(Recu.id)).where(Recu.ecole_id == ecole_id)) or 0
    )
    return f"REC-{moment:%y%m}-{total + 1:04d}"


def encaisser(
    db: Session,
    ecole: Ecole,
    eleve: Eleve,
    annee: str,
    montant: int,
    mode: str,
    reference: str,
    teneur: str,
    note: str = "",
    moment=None,
) -> tuple[Paiement, Recu]:
    """Le paiement, ses imputations, son reçu et son message au parent."""
    if not mode_accepte(ecole, mode):
        raise ValueError("Ce mode de règlement est coupé dans les réglages.")
    engagement = engagement_courant(db, eleve, annee)
    reste = facturation.rester(engagement.echeances)
    if montant > reste:
        raise ValueError(
            f"Le versement dépasse ce qui reste dû ({reste - montant} de trop)."
        )

    paiement = Paiement(
        ecole_id=ecole.id,
        eleve_id=eleve.id,
        montant=montant,
        mode=mode,
        reference=reference.strip(),
        encaisse_par=teneur,
        moment=moment or maintenant(),
        note=note.strip(),
    )
    db.add(paiement)
    db.flush()
    facturation.imputer(db, paiement)

    lignes = db.scalars(
        select(Echeance)
        .where(Echeance.engagement_id == engagement.id)
        .order_by(Echeance.due, Echeance.rang)
    ).all()
    engagement.solde_compte = sum(ligne.impute for ligne in lignes)
    if eleve.statut == "suspendu" and not facturation.en_retard(
        list(lignes), maintenant().date()
    ):
        eleve.statut = "suivi"
        eleve.motif_statut = ""

    numero = numero_recu(db, ecole.id, paiement.moment)
    recu = Recu(
        ecole_id=ecole.id,
        paiement_id=paiement.id,
        numero=numero,
        jeton=jeton_verif(),
        emission=paiement.moment,
        destinataire=eleve.tuteur_telephone,
        canal="whatsapp" if ecole.whatsapp_actif else "sms",
        corps="",
    )
    db.add(recu)
    db.flush()

    trace = messagerie.envoyer(
        ecole,
        recu.canal,
        eleve.tuteur_telephone or "",
        messagerie.recu_texte(
            ecole,
            f"{eleve.prenoms} {eleve.nom}",
            paiement.montant,
            MODES.get(mode, mode),
            numero,
        ),
    )
    recu.corps = trace["corps"]
    recu.statut = trace["statut"]
    recu.reference = trace["reference"]
    db.commit()
    return paiement, recu


def annuler(db: Session, ecole: Ecole, paiement: Paiement, motif: str) -> Recu | None:
    """Le guichet s'est trompé : on défait l'imputation, le reçu reste au journal."""
    paiement.annule = True
    paiement.motif_annulation = motif.strip()
    facturation.retirer_imputations(db, paiement)
    recu = db.scalar(select(Recu).where(Recu.paiement_id == paiement.id))
    if recu:
        recu.statut = "annule"
    engagement = db.scalar(
        select(Engagement).where(Engagement.eleve_id == paiement.eleve_id)
    )
    if engagement:
        lignes = db.scalars(
            select(Echeance).where(Echeance.engagement_id == engagement.id)
        ).all()
        engagement.solde_compte = sum(ligne.impute for ligne in lignes)
    db.commit()
    return recu
