from __future__ import annotations

"""La démo du carnet : des notes dans chaque catégorie — déterministe."""

import random
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Note, Organisation, User
from ..security import hash_password
from ..utils import aujourdhui, maintenant

RESPONSABLE = {"email": "ada@carnet.cm", "mot_de_passe": "Carnet2026!"}
AGENT = {"email": "mbarga@carnet.cm", "mot_de_passe": "Carnet2026!"}

NOTES = [
    ("Recette du ndolé", "Mets le bétisème, ajoute le poisson fumé, sale, poivre. Le fils de madame Ngo le fait mieux que moi.", "perso", True),
    ("Numéro du plombier", "M. Essomba passe le mardi et le vendredi. 6 90 12 34 56. Toujours négocier avant.", "travail", True),
    ("Liste du marché", "Tomates, oignons, huile 5L, savon, allumettes. Le marché Mokolo le samedi matin.", "courses", False),
    ("Idée : dépôt de gaz", "Les clients commandent par WhatsApp. Un carnet des livraisons suffirait pour démarrer.", "idees", True),
    ("Tension à surveiller", "Maman prend ses cachets à 8h et 20h. Le pharmacien de Bonanjo est M. Fotso.", "sante", True),
    ("Dettes du mois", "M. Kamdem doit 45 000. Le cousin doit 20 000. Rappeler vendredi.", "argent", False),
    ("Mot de passe_wifi", "Nom du réseau : famille_nga. Le mot de passe est sur le routeur du salon.", "perso", False),
    ("Devis peinture", "Deux couches pour la façade : 150 000 FCFA. Les ouvriers viennent lundi.", "travail", False),
    ("Anniversaire de Junior", "15 décembre. Cadeau : un maillot du Canon. Appeler sa mère pour confirmer.", "perso", False),
    ("Numéro du médecin", "Dr. Mbarga, clinique de la Paix. Consultations le matin seulement.", "sante", False),
    ("Idée : tontine numérique", "Un cercle de 10, 50 000 par tour. Le tirage au sort doit être vérifiable.", "idees", False),
    ("Facture CIE à payer", "Facture d'électricité de novembre : 23 400 FCFA. Échéance le 25.", "argent", True),
]

CATEGORIES = ["perso", "travail", "courses", "idees", "sante", "argent", "autre"]


def seed_database(db: Session) -> None:
    if db.scalar(select(User.id)) is not None:
        return

    organisation = Organisation(
        nom="Carnet Famille Nga",
        ville="Douala",
        quartier="Bonanjo",
        telephone="+237677887766",
    )
    db.add(organisation)
    db.flush()

    responsable = User(
        organisation_id=organisation.id,
        nom="Ada Carnet",
        email=RESPONSABLE["email"],
        mot_de_passe=hash_password(RESPONSABLE["mot_de_passe"]),
        role="responsable",
    )
    agent = User(
        organisation_id=organisation.id,
        nom="Mbarga Carnet",
        email=AGENT["email"],
        mot_de_passe=hash_password(AGENT["mot_de_passe"]),
        role="agent",
    )
    db.add_all([responsable, agent])

    alea = random.Random(20261114)
    auj = aujourdhui()

    for titre, contenu, categorie, epinglee in NOTES:
        il_y_a = alea.randint(1, 30)
        note = Note(
            organisation_id=organisation.id,
            titre=titre,
            contenu=contenu,
            categorie=categorie,
            epinglee=epinglee,
            archivee=False,
        )
        db.add(note)
        db.flush()
        # Répartir les dates de création/modification sur le mois.
        base = maintenant() - timedelta(days=il_y_a)
        note.cree_le = base
        note.maj_le = base + timedelta(hours=alea.randint(0, 72))

    # Quelques notes archivées pour montrer le tri.
    for i in range(3):
        note = Note(
            organisation_id=organisation.id,
            titre=f"Vieux ticket {i + 1}",
            contenu="Note rangée au fond du tiroir.",
            categorie=alea.choice(CATEGORIES),
            archivee=True,
        )
        db.add(note)

    db.commit()
