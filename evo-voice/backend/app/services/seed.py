from __future__ import annotations

"""La démo de la voix : des commandes dans chaque file - déterministe."""

import random
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import CommandeVocale, Organisation, User
from ..security import hash_password
from ..services.voice import _resultat_de, interpreter
from ..utils import maintenant

RESPONSABLE = {"email": "ada@bureau.cm", "mot_de_passe": "Voice2026!"}
AGENT = {"email": "mbarga@bureau.cm", "mot_de_passe": "Voice2026!"}

COMMANDES = [
    ("Rappelle-moi d'appeler le fournisseur demain matin", "rappel", "executee"),
    ("Envoie un message WhatsApp à la comptable pour le solde", "message", "executee"),
    ("Note ça : le client préfère être livré le samedi", "note", "executee"),
    ("Cherche le prix du fret Douala-Bafoussam cette semaine", "recherche", "interpretee"),
    ("Alerte : le dépôt est presque vide, commande urgente", "alerte", "interpretee"),
    ("Rappelle au chef que la réunion est à quinze heures", "rappel", "recue"),
    ("Message pour la réception : la chambre 12 est prête", "message", "recue"),
    ("Note dans le carnet : formation le jeudi à huit heures", "note", "echec"),
    ("Compare les trois offres d'assurance habitation", "recherche", "annulee"),
    ("Bonjour, il fait beau aujourd'hui", "", "recue"),
]


def seed_database(db: Session) -> None:
    if db.scalar(select(User.id)) is not None:
        return

    organisation = Organisation(
        nom="Cabinet Vocal Akwa",
        ville="Douala",
        quartier="Akwa",
        telephone="+237233445566",
    )
    db.add(organisation)
    db.flush()

    responsable = User(
        organisation_id=organisation.id,
        nom="Ada Bureau",
        email=RESPONSABLE["email"],
        mot_de_passe=hash_password(RESPONSABLE["mot_de_passe"]),
        role="responsable",
    )
    agent_user = User(
        organisation_id=organisation.id,
        nom="Mbarga Accueil",
        email=AGENT["email"],
        mot_de_passe=hash_password(AGENT["mot_de_passe"]),
        role="agent",
    )
    db.add_all([responsable, agent_user])

    alea = random.Random(20261118)

    for transcription, intention, statut in COMMANDES:
        # L'intention affichée est celle que la règle aurait trouvée ;
        # on garde la colonne pour les cas où l'humain l'a corrigée.
        devinee = interpreter(transcription)
        intention_reelle = intention if intention else devinee
        commande = CommandeVocale(
            organisation_id=organisation.id,
            transcription=transcription,
            intention=intention_reelle,
            statut=statut,
            auteur="Ada Bureau" if alea.random() < 0.7 else "Mbarga Accueil",
            resultat="",
        )
        db.add(commande)
        db.flush()

        if statut == "executee" and intention_reelle:
            resultat, details = _resultat_de(commande)
            commande.resultat = f"{resultat} ({details})"
        elif statut == "echec":
            commande.resultat = ""
        il_y_a = alea.randint(0, 20)
        commande.maj_le = maintenant() - timedelta(days=il_y_a, hours=alea.randint(0, 23))
        if il_y_a == 0:
            commande.maj_le = maintenant() - timedelta(hours=alea.randint(1, 8))

    db.commit()
