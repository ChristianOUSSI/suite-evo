"""Tout ce que l'API rend à la console, déjà écrit en français de comptoir."""

from __future__ import annotations

from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from ..models import (
    Classe,
    Echeance,
    Ecole,
    Eleve,
    Journee,
    Paiement,
    Recu,
    Relance,
    User,
)
from ..utils import (
    affiche_telephone,
    annee_label,
    depuis,
    ecole_annee_scolaire,
    fcfa,
    heure_fr,
    jour_court_fr,
    jour_fr,
    maintenant,
)
from . import caisse, encaissement, facturation, messagerie

STATUTS_ELEVE = {"suivi": "suivi", "suspendu": "suspendu", "parti": "parti"}
CANAL_LABELS = {"whatsapp": "WhatsApp", "sms": "SMS"}
RECU_LABELS = {
    "envoye": "remis au parent",
    "file": "en file",
    "coupé": "canal coupé",
    "annule": "annulé",
}


def annee_courante(ecole: Ecole) -> str:
    debut, fin = ecole_annee_scolaire(maintenant().date())
    return annee_label(debut, fin)


def ecole_dict(ecole: Ecole) -> dict:
    debut, fin = ecole_annee_scolaire(maintenant().date())
    return {
        "id": ecole.id,
        "nom": ecole.nom,
        "sigle": ecole.sigle,
        "genre": ecole.genre,
        "ville": ecole.ville,
        "quartier": ecole.quartier,
        "direction": ecole.direction,
        "comptable": ecole.comptable,
        "telephone": ecole.telephone,
        "telephone_display": affiche_telephone(ecole.telephone),
        "date_rentree": ecole.date_rentree.isoformat(),
        "fin_annee": ecole.fin_annee.isoformat(),
        "annee": annee_label(debut, fin),
        "relance_avance": ecole.relance_avance,
        "tolerance_retard": ecole.tolerance_retard,
        "ton": ecole.ton,
        "mention_recu": ecole.mention_recu,
        "abonnement": ecole.abonnement,
        "abonnement_label": fcfa(ecole.abonnement),
        "whatsapp_actif": ecole.whatsapp_actif,
        "sms_actif": ecole.sms_actif,
        "especes_actifs": ecole.especes_actifs,
        "momo_actif": ecole.momo_actif,
        "orange_actif": ecole.orange_actif,
    }


def user_dict(membre: User) -> dict:
    return {
        "id": membre.id,
        "nom": membre.nom,
        "email": membre.email,
        "role": membre.role,
        "role_label": membre.role.capitalize(),
    }


def classe_dict(classe: Classe, ecole: Ecole) -> dict:
    effectif = len(classe.eleves)
    attendu = sum(
        facturation.total_annuel(engagement)
        for eleve in classe.eleves
        for engagement in eleve.engagements
        if engagement.annee == classe.annee
    )
    rentre = sum(
        sum(ligne.impute for ligne in engagement.echeances)
        for eleve in classe.eleves
        for engagement in eleve.engagements
        if engagement.annee == classe.annee
    )
    return {
        "id": classe.id,
        "label": classe.label,
        "niveau": classe.niveau,
        "salle": classe.salle,
        "titulaire": classe.titulaire,
        "effectif_max": classe.effectif_max,
        "effectif": effectif,
        "annee": classe.annee,
        "scolarite": classe.scolarite,
        "cantine": classe.cantine,
        "transport": classe.transport,
        "autres": classe.autres,
        "tranches": classe.tranches,
        "total": classe.scolarite + classe.cantine + classe.transport + classe.autres,
        "total_label": fcfa(
            classe.scolarite + classe.cantine + classe.transport + classe.autres
        ),
        "rentre": rentre,
        "attendu": attendu,
        "part": round(100 * rentre / attendu) if attendu else 0,
    }


def echeance_dict(ligne: Echeance, jour: date) -> dict:
    libre = max(0, ligne.montant - ligne.impute)
    statut = facturation.statut_ligne(ligne, jour)
    return {
        "id": ligne.id,
        "rang": ligne.rang,
        "libelle": ligne.libelle,
        "due": ligne.due.isoformat(),
        "due_label": jour_fr(ligne.due),
        "due_court": jour_court_fr(ligne.due),
        "montant": ligne.montant,
        "montant_label": fcfa(ligne.montant),
        "impute": ligne.impute,
        "reste": libre,
        "reste_label": fcfa(libre),
        "statut": statut,
        "statut_label": {
            "solde": "réglée",
            "a_venir": "à venir",
            "aujourdhui": "attendue aujourd'hui",
            "retard": "en retard",
        }[statut],
    }


def eleve_dict(db: Session, eleve: Eleve, annee: str) -> dict:
    jour = maintenant().date()
    engagement = facturation.engagement_de(db, eleve, annee)
    lignes = list(engagement.echeances) if engagement else []
    due = facturation.en_retard(lignes, jour)
    suite = facturation.prochaine(lignes, jour)
    du = facturation.total_annuel(engagement) if engagement else 0
    rentre = sum(ligne.impute for ligne in lignes)
    return {
        "id": eleve.id,
        "matricule": eleve.matricule,
        "prenom": eleve.prenoms,
        "nom": eleve.nom,
        "nom_complet": f"{eleve.prenoms} {eleve.nom}",
        "sexe": eleve.sexe,
        "classe_id": eleve.classe_id,
        "classe": eleve.classe.label if eleve.classe else "sans classe",
        "tuteur_nom": eleve.tuteur_nom,
        "tuteur_telephone": eleve.tuteur_telephone,
        "tuteur_telephone_display": affiche_telephone(eleve.tuteur_telephone),
        "tuteur_second": eleve.tuteur_second,
        "tuteur_second_display": affiche_telephone(eleve.tuteur_second),
        "tuteur_lien": eleve.tuteur_lien,
        "quartier": eleve.quartier,
        "statut": eleve.statut,
        "statut_label": STATUTS_ELEVE.get(eleve.statut, eleve.statut),
        "motif_statut": eleve.motif_statut,
        "note": eleve.note,
        "date_entree": eleve.date_entree.isoformat(),
        "contactable": bool(eleve.tuteur_telephone),
        "engagement_id": engagement.id if engagement else None,
        "annee": annee,
        "du": du,
        "du_label": fcfa(du),
        "rentre": rentre,
        "rentre_label": fcfa(rentre),
        "reste": max(0, du - rentre),
        "reste_label": fcfa(max(0, du - rentre)),
        "remise": engagement.remise if engagement else 0,
        "motif_remise": engagement.motif_remise if engagement else "",
        "en_retard": bool(due),
        "retard_montant": sum(
            ligne.montant - ligne.impute for ligne in due
        ),
        "retard_montant_label": fcfa(
            sum(ligne.montant - ligne.impute for ligne in due)
        ),
        "jours_retard": (
            0
            if not due
            else (jour - min(ligne.due for ligne in due)).days
        ),
        "prochaine": echeance_dict(suite, jour) if suite else None,
        "echeances": [echeance_dict(ligne, jour) for ligne in lignes],
    }


def paiement_dict(paiement: Paiement) -> dict:
    jour = paiement.moment
    return {
        "id": paiement.id,
        "eleve_id": paiement.eleve_id,
        "eleve": f"{paiement.eleve.prenoms} {paiement.eleve.nom}",
        "matricule": paiement.eleve.matricule,
        "classe": paiement.eleve.classe.label if paiement.eleve.classe else "",
        "montant": paiement.montant,
        "montant_label": fcfa(paiement.montant),
        "mode": paiement.mode,
        "mode_label": encaissement.MODES.get(paiement.mode, paiement.mode),
        "reference": paiement.reference,
        "encaisse_par": paiement.encaisse_par,
        "note": paiement.note,
        "moment": jour.isoformat(),
        "day": jour_court_fr(jour.date()),
        "clock": heure_fr(jour),
        "ago": depuis(jour),
        "annule": paiement.annule,
        "motif_annulation": paiement.motif_annulation,
        "recu": recu_dict(paiement.recu) if paiement.recu else None,
        "imputations": [
            {
                "echeance_id": imputation.echeance_id,
                "libelle": imputation.echeance.libelle,
                "due_label": jour_fr(imputation.echeance.due),
                "montant": imputation.montant,
                "montant_label": fcfa(imputation.montant),
            }
            for imputation in paiement.imputations
        ],
    }


def recu_dict(recu: Recu) -> dict:
    paiement = recu.paiement
    return {
        "id": recu.id,
        "numero": recu.numero,
        "jeton": recu.jeton,
        "paiement_id": paiement.id,
        "eleve": f"{paiement.eleve.prenoms} {paiement.eleve.nom}",
        "eleve_id": paiement.eleve_id,
        "classe": paiement.eleve.classe.label if paiement.eleve.classe else "",
        "montant": paiement.montant,
        "montant_label": fcfa(paiement.montant),
        "mode": paiement.mode,
        "mode_label": encaissement.MODES.get(paiement.mode, paiement.mode),
        "emission": recu.emission.isoformat(),
        "day": jour_court_fr(recu.emission.date()),
        "clock": heure_fr(recu.emission),
        "ago": depuis(recu.emission),
        "canal": recu.canal,
        "canal_label": CANAL_LABELS.get(recu.canal, recu.canal),
        "statut": recu.statut,
        "statut_label": RECU_LABELS.get(recu.statut, recu.statut),
        "reference": recu.reference,
        "destinataire": recu.destinataire,
        "destinataire_display": affiche_telephone(recu.destinataire),
        "corps": recu.corps,
        "verif_url": f"/verif/{recu.jeton}",
    }


def relance_dict(relance: Relance) -> dict:
    eleve = relance.eleve
    ligne = relance.echeance
    statut = (
        "annulée"
        if relance.annulee
        else "envoyée"
        if relance.envoyee
        else "programmée"
    )
    return {
        "id": relance.id,
        "eleve_id": relance.eleve_id,
        "eleve": f"{eleve.prenoms} {eleve.nom}",
        "classe": eleve.classe.label if eleve.classe else "",
        "tuteur": eleve.tuteur_nom,
        "telephone_display": affiche_telephone(eleve.tuteur_telephone),
        "echeance_id": relance.echeance_id,
        "libelle": relance.libelle,
        "due_label": jour_fr(ligne.due) if ligne else "",
        "programme": relance.programme.isoformat(),
        "programme_label": jour_court_fr(relance.programme),
        "canal": relance.canal,
        "canal_label": CANAL_LABELS.get(relance.canal, relance.canal),
        "corps": relance.corps,
        "reference": relance.reference,
        "envoyee": relance.envoyee,
        "annulee": relance.annulee,
        "statut_label": statut,
        "envoyee_le": relance.envoyee_le.isoformat() if relance.envoyee_le else None,
    }


def journee_dict(ouverte: Journee, ecole: Ecole, db: Session) -> dict:
    etat = caisse.etat(db, ecole, ouverte.jour)
    return {
        "jour": ouverte.jour.isoformat(),
        "jour_label": jour_court_fr(ouverte.jour),
        "fond": ouverte.fond,
        "fond_label": fcfa(ouverte.fond),
        "comptage": ouverte.comptage,
        "comptage_label": fcfa(ouverte.comptage),
        "attendu": etat["attendu"],
        "attendu_label": fcfa(etat["attendu"]),
        "ecart": etat["ecart"],
        "ecart_label": fcfa(etat["ecart"]) if etat["ecart"] is not None else "",
        "declaree": ouverte.declaree,
        "tenu_par": ouverte.tenu_par,
        "note": ouverte.note,
        "total": etat["total"],
        "total_label": fcfa(etat["total"]),
        "nb_entries": etat["nb_entries"],
    }


def tableau_bord(db: Session, ecole: Ecole) -> dict:
    """Ce que la directrice regarde en premier, le matin."""
    jour = maintenant().date()
    annee = annee_courante(ecole)
    eleves = db.scalars(
        select(Eleve)
        .where(Eleve.ecole_id == ecole.id)
        .options(joinedload(Eleve.classe))
    ).all()
    fiches = [eleve_dict(db, eleve, annee) for eleve in eleves]
    retards = [fiche for fiche in fiches if fiche["en_retard"]]
    suspendus = [fiche for fiche in fiches if fiche["statut"] == "suspendu"]
    dues = db.scalars(
        select(Relance)
        .where(
            Relance.ecole_id == ecole.id,
            Relance.programme <= jour,
            Relance.envoyee.is_(False),
            Relance.annulee.is_(False),
        )
        .order_by(Relance.programme)
    ).all()
    recus = db.scalars(
        select(Recu)
        .join(Paiement, Recu.paiement_id == Paiement.id)
        .where(Recu.ecole_id == ecole.id, Paiement.annule.is_(False))
        .order_by(Recu.emission.desc())
        .limit(6)
    ).all()
    classes = db.scalars(
        select(Classe)
        .where(Classe.ecole_id == ecole.id, Classe.annee == annee)
        .order_by(Classe.niveau)
    ).all()
    return {
        "day": jour_court_fr(jour),
        "annee": annee,
        "ecole": ecole_dict(ecole),
        "caisse": caisse.etat(db, ecole, jour),
        "serie": caisse.serie(db, ecole),
        "recouvrement": caisse.recouvrement(db, ecole),
        "effectif": len(fiches),
        "en_retard": len(retards),
        "suspendus": len(suspendus),
        "relances_dues": len(dues),
        "classes": [classe_dict(classe, ecole) for classe in classes],
        "derniers_recus": [recu_dict(recu) for recu in recus],
        "fiches_en_retard": sorted(
            retards, key=lambda fiche: -fiche["retard_montant"]
        )[:6],
        "prochaines_echeances": [
            {
                **fiche["prochaine"],
                "eleve": fiche["nom_complet"],
                "classe": fiche["classe"],
            }
            for fiche in fiches
            if fiche["prochaine"]
        ][:6],
    }


def apercu_recu(ecole: Ecole, eleve: Eleve, montant: int) -> dict:
    """Ce que le parent va recevoir, sans rien envoyer."""
    canal = "whatsapp" if ecole.whatsapp_actif else "sms"
    texte = messagerie.recu_texte(
        ecole,
        f"{eleve.prenoms} {eleve.nom}",
        montant,
        encaissement.MODES["especes"],
        "REC-" + date.today().strftime("%y%m") + "-0000",
    )
    return messagerie.envoyer(ecole, canal, eleve.tuteur_telephone or "", texte)
