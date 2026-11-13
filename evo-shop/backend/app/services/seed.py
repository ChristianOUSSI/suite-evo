from __future__ import annotations

import random
from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import LigneVente, Organisation, Produit, User, Vente
from ..security import hash_password
from ..utils import aujourdhui, maintenant

RESPONSABLE = {"email": "ada@quincaillerie.cm", "mot_de_passe": "Shop2026!"}
CAISSIER = {"email": "mbarga@quincaillerie.cm", "mot_de_passe": "Shop2026!"}

ENTREPRISE = {
    "nom": "Quincaillerie du Centre",
    "ville": "Douala",
    "quartier": "Akwa",
    "telephone": "+237699778899",
}

# Une quincaillerie de quartier : quarante articles, prix de Douala.
CATALOGUE = (
    ("Ciment CPJ 50kg", "sac", 4200, 5200, 120, 10),
    ("Fer à béton 8mm", "piece", 2500, 3500, 80, 8),
    ("Peinture blanc 20L", "piece", 18000, 24000, 25, 4),
    ("Pinceau plat 4\"", "piece", 800, 1500, 60, 10),
    ("Rouleau moquette", "piece", 1200, 2500, 40, 8),
    ("Cadenas 50mm", "piece", 2500, 4000, 30, 5),
    ("Vis à bois 4x40 (boîte)", "paquet", 1500, 3000, 50, 10),
    ("Fil électrique 2.5mm²", "kg", 6000, 8500, 20, 3),
    ("Ampoule LED 9W", "piece", 800, 1500, 100, 15),
    ("Prise 2P+T", "piece", 700, 1500, 80, 10),
    ("Câble coaxial (m)", "litre", 0, 0, 0, 0),  # remplacé ci-dessous
    ("Carrelage 40x40 (m²)", "kg", 5500, 7500, 200, 20),
    ("Mortier colle (sac)", "sac", 4800, 6500, 60, 6),
    ("Tuyau PVC 32mm (m)", "litre", 0, 0, 0, 0),  # remplacé ci-dessous
    ("Robinet cuisine", "piece", 6500, 9500, 15, 3),
    ("Évier inox 1 bac", "piece", 22000, 32000, 8, 2),
    ("Carreaux sol grisé", "kg", 8000, 11000, 150, 15),
    ("Plinthe PVC 2m", "piece", 2000, 3500, 45, 8),
    ("Portail rouleau peinture", "piece", 3000, 5000, 35, 5),
    ("Brosse à récurer", "piece", 500, 1200, 90, 10),
    ("Sac poubelle 30L (x10)", "paquet", 1500, 2800, 70, 10),
    ("Eau Javel 5L", "litre", 1800, 3000, 40, 8),
    ("Lessive 3kg", "piece", 3500, 5500, 55, 8),
    ("Savon de Marseille", "piece", 600, 1200, 100, 15),
    ("Brosse WC", "piece", 1000, 2000, 60, 10),
    ("Pelle + balayette", "piece", 4000, 6500, 20, 4),
    ("Gant de ménage (paire)", "piece", 700, 1500, 80, 10),
    ("Éponge industrielle", "piece", 800, 1600, 50, 8),
    ("Corde nylon 10m", "litre", 0, 0, 0, 0),  # remplacé ci-dessous
    ("Clou 6cm (kg)", "kg", 3000, 5000, 15, 3),
    ("Scie sauteuse lame", "piece", 1500, 3000, 40, 6),
    ("Mèche 10mm", "piece", 800, 1800, 50, 8),
    ("Tournevis cruciforme", "piece", 2500, 4500, 30, 5),
    ("Marteau 500g", "piece", 4000, 6500, 25, 5),
    ("Niveau 60cm", "piece", 5000, 8000, 18, 3),
    ("Mètre ruban 5m", "piece", 1500, 3000, 60, 10),
    ("Pistolet à silicone", "piece", 3500, 6000, 22, 4),
    ("Cartouche silicone", "piece", 1200, 2200, 45, 8),
    ("Panneau bois 1.2m", "carton", 12000, 18000, 10, 2),
    ("Contreplaqué 18mm", "carton", 28000, 40000, 6, 1),
    ("Parquet flottant m²", "kg", 9000, 12500, 100, 10),
)

# Les articles vendus au mètre se vendent à l'unité « piece » par tranche.
CATALOGUE = tuple(
    (nom, "piece" if unite in ("litre", "kg") and prix_achat == 0 else unite, prix_achat or 2500, prix_vente or 4500, stock or 30, seuil or 5)
    for nom, unite, prix_achat, prix_vente, stock, seuil in CATALOGUE
)


def seed_database(db: Session) -> bool:
    """Une boutique garnie pour la démonstration. Faux si la caisse existe."""
    if db.scalar(select(func.count(Organisation.id))):
        return False

    alea = random.Random(20_261_110)
    organisation = Organisation(**ENTREPRISE)
    db.add(organisation)
    db.flush()

    responsable = User(
        organisation_id=organisation.id,
        nom="Clarisse Ada",
        email=RESPONSABLE["email"],
        mot_de_passe=hash_password(RESPONSABLE["mot_de_passe"]),
        role="responsable",
    )
    caissier = User(
        organisation_id=organisation.id,
        nom="Paul Mbarga",
        email=CAISSIER["email"],
        mot_de_passe=hash_password(CAISSIER["mot_de_passe"]),
        role="caissier",
    )
    db.add_all([responsable, caissier])
    db.flush()

    produits = _produits(db, organisation)
    _ventes(db, organisation, produits, [responsable, caissier], alea)
    db.commit()
    return True


def _produits(db: Session, organisation: Organisation) -> list[Produit]:
    lignes = [
        Produit(
            organisation_id=organisation.id,
            nom=nom,
            unite=unite,
            prix_achat=prix_achat,
            prix_vente=prix_vente,
            stock=stock,
            seuil_alerte=seuil,
            note="",
        )
        for nom, unite, prix_achat, prix_vente, stock, seuil in CATALOGUE
    ]
    db.add_all(lignes)
    db.flush()
    return lignes


def _ventes(
    db: Session,
    organisation: Organisation,
    produits: list[Produit],
    comptes: list[User],
    alea,
) -> None:
    """Quarante-cinq jours de caisse, sans jamais vendre plus que le stock."""
    stock_dispo = {un.id: un.stock for un in produits}
    aujourdhui_d = aujourdhui()
    for delta in range(45, 0, -1):
        jour = aujourdhui_d - timedelta(days=delta)
        nb_ventes = alea.randint(2, 7) if jour.weekday() < 6 else alea.randint(0, 3)
        for _ in range(nb_ventes):
            nb_lignes = alea.randint(1, 4)
            lignes = []
            total = 0
            for _ in range(nb_lignes):
                produit = alea.choice(produits)
                if stock_dispo[produit.id] <= 0:
                    continue
                quantite = alea.randint(1, min(3, stock_dispo[produit.id]))
                stock_dispo[produit.id] -= quantite
                lignes.append(
                    LigneVente(
                        produit_id=produit.id,
                        quantite=quantite,
                        prix_unitaire=produit.prix_vente,
                    )
                )
                total += quantite * produit.prix_vente
            if not lignes:
                continue
            vente = Vente(
                organisation_id=organisation.id,
                client_nom="",
                total=total,
                statut="validee",
                note="",
                cree_par=alea.choice(comptes).id,
                cree_le=maintenant().replace(
                    year=jour.year, month=jour.month, day=jour.day,
                    hour=alea.randint(8, 19), minute=alea.randint(0, 59),
                ),
            )
            db.add(vente)
            db.flush()
            for ligne in lignes:
                ligne.vente_id = vente.id
                db.add(ligne)
