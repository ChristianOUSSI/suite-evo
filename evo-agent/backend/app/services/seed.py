from __future__ import annotations

"""La démo de l'agent : des tâches dans chaque file - déterministe."""

import random
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Execution, Organisation, Tache, User
from ..security import hash_password
from ..services.agent import _resultat_de
from ..utils import maintenant

RESPONSABLE = {"email": "ada@agence.cm", "mot_de_passe": "Agent2026!"}
AGENT = {"email": "mbarga@agence.cm", "mot_de_passe": "Agent2026!"}

TACHES = [
    ("Résumer le rapport du mois", "Le rapport fait 12 pages : garde les chiffres et les décisions.", "resume", "haute", "terminee"),
    ("Chercher les fournisseurs d'emballage", "Liste les revendeurs connus à Douala et leur fiabilité.", "recherche", "normale", "terminee"),
    ("Rédiger le message WhatsApp de relance", "Ton cordial, court, avec le montant et la date.", "redaction", "normale", "terminee"),
    ("Analyser les ventes de la semaine", "Croise les tickets et les ruptures de stock.", "analyse", "haute", "en_cours"),
    ("Automatiser le suivi des livraisons", "Chaque matin : relire les commandes et notifier les retards.", "automatisation", "normale", "en_attente"),
    ("Préparer la présentation du dépôt", "Diapositives simples : chiffres, photos, prochain pas.", "redaction", "basse", "en_attente"),
    ("Vérifier les comptes du mois", "Recoupe les recettes et les dépenses notées.", "analyse", "haute", "en_attente"),
    ("Chercher une assurance pour la flotte", "Comparer trois offres locales, garanties et prix.", "recherche", "normale", "terminee"),
    ("Résumer les réclamations clients", "Regrouper par motif, proposer trois actions.", "resume", "normale", "echec"),
    ("Nettoyer le fichier des clients", "Supprimer les doublons par numéro, signaler les incohérences.", "automatisation", "basse", "annulee"),
]


def seed_database(db: Session) -> None:
    if db.scalar(select(User.id)) is not None:
        return

    organisation = Organisation(
        nom="Agence Digitale Bonanjo",
        ville="Douala",
        quartier="Bonanjo",
        telephone="+237233556677",
    )
    db.add(organisation)
    db.flush()

    responsable = User(
        organisation_id=organisation.id,
        nom="Ada Agence",
        email=RESPONSABLE["email"],
        mot_de_passe=hash_password(RESPONSABLE["mot_de_passe"]),
        role="responsable",
    )
    agent_user = User(
        organisation_id=organisation.id,
        nom="Mbarga Exploitation",
        email=AGENT["email"],
        mot_de_passe=hash_password(AGENT["mot_de_passe"]),
        role="agent",
    )
    db.add_all([responsable, agent_user])

    alea = random.Random(20261115)

    for titre, consigne, type_, priorite, statut in TACHES:
        tache = Tache(
            organisation_id=organisation.id,
            titre=titre,
            consigne=consigne,
            type=type_,
            priorite=priorite,
            statut=statut,
            cree_par="Ada Agence" if alea.random() < 0.7 else "Mbarga Exploitation",
            erreur="Le document source est illisible : scanner à refaire." if statut == "echec" else "",
        )
        db.add(tache)
        db.flush()

        if statut == "terminee":
            resultat, details = _resultat_de(tache)
            tache.resultat = resultat
            il_y_a = alea.randint(1, 20)
            debut = maintenant() - timedelta(days=il_y_a, minutes=alea.randint(1, 90))
            fin = debut + timedelta(seconds=alea.randint(8, 60))
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
            db.add(execution)
        elif statut == "echec":
            execution = Execution(
                organisation_id=organisation.id,
                tache_id=tache.id,
                statut="echec",
                debut_le=maintenant() - timedelta(days=alea.randint(1, 15)),
                fin_le=maintenant() - timedelta(days=alea.randint(1, 15)),
                duree_secondes=alea.randint(2, 9),
                resultat="",
                details="document source illisible",
            )
            db.add(execution)
        tache.maj_le = maintenant() - timedelta(days=alea.randint(0, 20), hours=alea.randint(0, 23))

    db.commit()
