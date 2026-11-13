from __future__ import annotations

import random
from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Annonce, Commande, Organisation, User
from ..security import hash_password
from ..utils import aujourdhui, maintenant, periode_de

RESPONSABLE = {"email": "ada@market.cm", "mot_de_passe": "Market2026!"}
AGENT = {"email": "mbarga@market.cm", "mot_de_passe": "Market2026!"}

BOUTIQUE = {
    "nom": "Marché Horizon",
    "ville": "Douala",
    "quartier": "Akwa",
    "telephone": "+237233445566",
}

ARTICLES = {
    "alimentation": ("Riz parfumé 25 kg", "Huile végétale 5 L", "Farine de blé 10 kg", "Spaghetti 500 g", "Sucre vanillé 1 kg", "Lait concentré 410 g"),
    "vetements": ("Pagne bazin riche 6 yards", "Chemise en tissu africain", "Robe en dentelle", "Pagne wax 6 yards", "T-shirt coton", "Veste en jean"),
    "electronique": ("Téléviseur 43 pouces", "Ventilateur sur pied", "Fer à repasser vapeur", "Réfrigérateur 180 L", "Enceinte bluetooth", "Mixeur blender"),
    "maison": ("Casserole en aluminium", "Bassine en plastique 20 L", "Nappe de table", "Rideau occultant", "Coussin décoratif", "Serviette de bain"),
    "beaute": ("Savon de toilette", "Crème hydratante", "Parfum 100 ml", "Huile de coco", "Gel douche", "Baume à lèvres"),
    "telephone": ("Carte SIM MTN", "Écouteurs bluetooth", "Chargeur USB-C", "Coque de téléphone", "Film protecteur", "Power bank 10000"),
    "auto": ("Pneu 185/65 R15", "Ampoule H4", "Huile moteur 4 L", "Balai d'essuie-glace", "Antivol de direction", "Gilet de sécurité"),
    "autre": ("Sac de voyage", "Cahier 200 pages", "Stylo bille par 50", "Lampe LED", "Horloge murale", "Parka imperméable"),
}
QUARTIERS = ("Akwa", "Bonanjo", "Bonapriso", "Bali", "Makepe", "Ndokoti", "Bonamoussadi", "Deido", "Logpom", "Bepanda")
CLIENTS = ("Nathalie Eyenga", "Serge Ndongo", "Prisca Talla", "Ulrich Mvondo", "Sandrine Biya", "Jérôme Ateba", "Murielle Fotso", "Didier Kamga", "Alphonse Ekwalla", "Lydie Ngono")
TELEPHONES = (
    "+237677334455", "+237655667788", "+237699112233", "+237691998877",
    "+237670554433", "+237683221100", "+237660887766", "+237696144322",
)
MOYENS = ("especes", "mtn_money", "orange_money", "nexttel_money", "virement", "autre")
STATUTS_C = ("nouvelle", "confirmee", "livree", "annulee")


def seed_database(db: Session) -> bool:
    if db.scalar(select(func.count(Organisation.id))):
        return False

    alea = random.Random(20_261_117)
    organisation = Organisation(**BOUTIQUE)
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

    annonces = _annonces(db, organisation, alea)
    _commandes(db, organisation, annonces, [responsable, agent], alea)
    db.commit()
    return True


def _annonces(db: Session, organisation: Organisation, alea) -> list[Annonce]:
    lignes = []
    for categorie, titres in ARTICLES.items():
        for titre in titres:
            statut = alea.choices(["en_ligne", "vendu", "retire"], weights=[70, 22, 8])[0]
            prix = {
                "alimentation": alea.randint(500, 35_000),
                "vetements": alea.randint(2_000, 45_000),
                "electronique": alea.randint(15_000, 350_000),
                "maison": alea.randint(800, 25_000),
                "beaute": alea.randint(500, 12_000),
                "telephone": alea.randint(300, 80_000),
                "auto": alea.randint(1_500, 120_000),
                "autre": alea.randint(300, 60_000),
            }[categorie]
            lignes.append(
                Annonce(
                    organisation_id=organisation.id,
                    titre=f"{titre}",
                    categorie=categorie,
                    description="" if alea.random() > 0.4 else "Produit vérifié, disponible en boutique.",
                    prix=prix,
                    stock=alea.choice([1, 2, 3, 5, 8, 12, 0]),
                    ville="Douala" if alea.random() > 0.15 else "Yaoundé",
                    quartier=alea.choice(QUARTIERS),
                    statut=statut,
                    vendeur_nom=alea.choice(CLIENTS),
                    vendeur_telephone=alea.choice(TELEPHONES),
                )
            )
    db.add_all(lignes)
    db.flush()
    return lignes


def _commandes(
    db: Session,
    organisation: Organisation,
    annonces: list[Annonce],
    comptes: list[User],
    alea,
) -> None:
    aujourdhui_d = aujourdhui()
    for _ in range(alea.randint(30, 45)):
        annonce = alea.choice(annonces)
        if annonce.statut != "en_ligne" or annonce.stock <= 0:
            continue
        jour = aujourdhui_d - timedelta(days=alea.randint(0, 120))
        statut = alea.choices(STATUTS_C, weights=[15, 30, 40, 15])[0]
        quantite = min(alea.randint(1, 3), annonce.stock)
        if statut in ("confirmee", "livree"):
            annonce.stock = max(0, annonce.stock - quantite)
        if statut == "annulee":
            statut = "nouvelle"
        db.add(
            Commande(
                organisation_id=organisation.id,
                annonce_id=annonce.id,
                quantite=quantite,
                montant=annonce.prix * quantite,
                acheteur_nom=alea.choice(CLIENTS),
                acheteur_telephone=alea.choice(TELEPHONES),
                moyen=alea.choice(MOYENS),
                statut=statut,
                date=jour,
                cree_par=alea.choice(comptes).id,
                cree_le=maintenant().replace(
                    year=jour.year, month=jour.month, day=jour.day,
                    hour=alea.randint(8, 19), minute=alea.randint(0, 59),
                ),
            )
        )
    db.commit()
