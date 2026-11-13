from __future__ import annotations

import random
from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Document, Organisation, User
from ..security import hash_password
from ..utils import aujourdhui, maintenant, periode_de

RESPONSABLE = {"email": "ada@docs.cm", "mot_de_passe": "Docs2026!"}
AGENT = {"email": "mbarga@docs.cm", "mot_de_passe": "Docs2026!"}

MAISON = {
    "nom": "Cabinet Horizon",
    "ville": "Douala",
    "quartier": "Bonapriso",
    "telephone": "+237233445566",
}

DOCUMENTS = {
    "facture": ("Facture fournisseur IT", "Facture électricité ENEO", "Facture loyer boutique", "Facture matériel de bureau", "Facture impression flyers", "Facture transporteur"),
    "contrat": ("Contrat bail commercial", "Contrat employé comptable", "Contrat maintenance climatisation", "Contrat prestataire web", "Contrat assurance", "Contrat fournisseur riz"),
    "courrier": ("Lettre de relance client", "Courrier officiel préfecture", "Lettre recommandée banque", "Notification fournisseur", "Réponse demande de prix", "Courrier partenaire"),
    "pv": ("PV réunion équipe", "PV assemblée copropriété", "PV contrôle hygiène", "PV réception travaux", "PV négociation client", "PV audit interne"),
    "identite": ("Carte nationale CNI", "Passeport", "Carte contribuable", "RCCM extrait", "Registre de commerce", "Carte professionnelle"),
    "autorisation": ("Autorisation d'exercice", "Licence d'import", "Permis d'exploitation", "Autorisation affichage", "Agrément CNPS", "Visa consulaire"),
    "autre": ("Attestation de stage", "Diplôme certifié", "Reçu de caution", "Garantie bancaire", "Acte de naissance", "Attestation de domicile"),
}
EMETTEURS = ("ENEO", "Camwater", "Banque Afriland", "SGBC", "Mairie de Douala", "CNPS", "Ministère du Commerce", "Client Payeur", "Fournisseur Local", "Notaire")
DESTINATAIRES = ("Cabinet Horizon", "Banque Afriland", "Fournisseur Local", "Client Payeur", "Mairie de Douala", "Ministère du Commerce", "Employé", "Partenaire", "Administration", "Banque")
NOTES = ("À renouveler avant expiration.", "Copie certifiée conforme.", "Original dans le coffre.", "", "", "Numérisé, original archivé.")


def seed_database(db: Session) -> bool:
    if db.scalar(select(func.count(Organisation.id))):
        return False

    alea = random.Random(20_261_113)
    organisation = Organisation(**MAISON)
    db.add(organisation)
    db.flush()

    responsable = User(
        organisation_id=organisation.id,
        nom="Clarisse Ada",
        email=RESPONSABLE["email"],
        mot_de_passe=hash_password(RESPONSABLE["mot_de_passe"]),
        role="responsable",
    )
    agent = User(
        organisation_id=organisation.id,
        nom="Paul Mbarga",
        email=AGENT["email"],
        mot_de_passe=hash_password(AGENT["mot_de_passe"]),
        role="agent",
    )
    db.add_all([responsable, agent])
    db.flush()

    documents = _documents(db, organisation, [responsable, agent], alea)
    db.commit()
    return True


def _documents(db: Session, organisation: Organisation, comptes: list[User], alea) -> list[Document]:
    from ..models import nouvelle_reference

    lignes = []
    aujourdhui_d = aujourdhui()
    for categorie, titres in DOCUMENTS.items():
        for titre in titres:
            statut = alea.choices(["actif", "archive", "annule"], weights=[75, 20, 5])[0]
            # Un tiers des documents actifs a une échéance, dont certains dépassés.
            a_echeance = alea.random() < 0.35
            echeance = None
            if a_echeance:
                decalage = alea.choice([-45, -20, -5, 10, 25, 60, 120, 200])
                echeance = aujourdhui_d + timedelta(days=decalage)
            date_doc = aujourdhui_d - timedelta(days=alea.randint(0, 400))
            lignes.append(
                Document(
                    organisation_id=organisation.id,
                    reference=nouvelle_reference(),
                    titre=titre,
                    categorie=categorie,
                    description="" if alea.random() > 0.5 else "Document numérisé, classeur physique archivé.",
                    emetteur=alea.choice(EMETTEURS),
                    destinataire=alea.choice(DESTINATAIRES),
                    date_document=date_doc,
                    echeance=echeance,
                    statut=statut,
                    note=alea.choice(NOTES),
                    cree_par=alea.choice(comptes).id,
                    cree_le=maintenant().replace(
                        year=date_doc.year, month=date_doc.month, day=date_doc.day,
                        hour=alea.randint(8, 19), minute=alea.randint(0, 59),
                    ),
                )
            )
    db.add_all(lignes)
    db.flush()
    return lignes
