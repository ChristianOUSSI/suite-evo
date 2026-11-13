from __future__ import annotations

import random
from datetime import date, datetime, time, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Boutique, Comptage, Depense, Entree, Main, Produit, Vente
from ..security import hash_password, reference_vente

DEMO_EMAIL = "tenanciere@tchuentecahier.cm"
DEMO_AIDE_EMAIL = "vendeuse@tchuentecahier.cm"
DEMO_PASSWORD = "Kolodo2026!"

# Le rayon d'une boutique de Ndokoti : ce que le quartier achète chaque jour, au
# prix à peine marqué. Les mots dictés sont ceux qu'on dit vraiment au téléphone.
RAYON = (
    ("Sucre en poudre", "épicerie", "kg", 750, 900, 40, 10, "sucre"),
    ("Lait concentré Nido", "épicerie", "boîte", 2200, 2600, 24, 6, "lait nido"),
    ("Huile végétale Palmoil", "épicerie", "litre", 1600, 1900, 30, 8, "huile palmoil"),
    ("Riz parfumé 5 kg", "épicerie", "sac", 5200, 6200, 14, 4, "riz sac"),
    ("Spaghetti 500 g", "épicerie", "pièce", 520, 700, 60, 15, "spaghetti pates"),
    ("Tomate concentrée", "épicerie", "pièce", 250, 320, 48, 12, "tomate boite"),
    ("Soda Fanta 1,5 L", "boisson", "bouteille", 700, 900, 36, 12, "fanta soda"),
    ("Eau minérale Cs2", "boisson", "pièce", 300, 400, 48, 20, "eau cs gazeuse"),
    ("Bière Castel", "boisson", "bouteille", 850, 1050, 24, 6, "biere castel"),
    ("Savon de lessive", "ménage", "pièce", 300, 400, 25, 8, "savon lessive"),
    ("Poudre Lava", "ménage", "sachet", 350, 480, 30, 10, "lava poudre"),
    ("Lampadaire recharged", "courant", "pièce", 3200, 4000, 6, 2, "lampadaire lampe"),
    ("Recharge MoMo airtime", "service", "unité", 0, 0, 0, 0, "recharge credit telephone"),
    ("Carte d'appel 300 F", "service", "carte", 240, 300, 18, 6, "carte appel unitel orange"),
)

FOURNISSEURS = ("Dépôt Bonanjo", "Marché Mbopi", "Grossiste Ndokoti")

DEPENSES_TYPE = (
    ("transport au dépôt", "transport", 1500),
    ("loyer du mois", "loyer", 45000),
    ("facture d'eau", "facture", 6500),
    ("gardien du soir", "salaire", 8000),
)


def seed_database(db: Session) -> bool:
    """Une boutique garnie pour la démonstration. Renvoie faux si le cahier existe déjà."""
    if db.scalar(select(func.count(Boutique.id))):
        return False

    alea = random.Random(20_261_031)
    boutique = _boutique()
    db.add(boutique)
    db.flush()

    tenanciere = Main(
        boutique_id=boutique.id,
        nom="Brigitte Tchuenté",
        email=DEMO_EMAIL,
        mot_de_passe=hash_password(DEMO_PASSWORD),
        role="tenancier",
    )
    vendeuse = Main(
        boutique_id=boutique.id,
        nom="Estelle Mbarga",
        email=DEMO_AIDE_EMAIL,
        mot_de_passe=hash_password(DEMO_PASSWORD),
        role="vendeur",
    )
    db.add_all([tenanciere, vendeuse])
    db.flush()

    produits = _produits(db, boutique, tenanciere, alea)
    _ventes(db, boutique, produits, [tenanciere, vendeuse], alea)
    _depenses(db, boutique, alea)
    _comptage_hier(db, boutique, tenanciere)

    db.commit()
    return True


def _boutique() -> Boutique:
    return Boutique(
        nom="Alimentation Générale Tchuenté",
        enseigne="Tchuenté",
        quartier="Ndokoti",
        ville="Douala",
        tenancier="Brigitte Tchuenté",
        telephone="+237699104522",
        abonnement_hebdo=3_000,
        especes_actifs=True,
        momo_actif=True,
        orange_actif=True,
        credit_accorde=False,
        note="Le cahier remplace la feuille de papier depuis la rentrée de septembre.",
    )


def _produits(
    db: Session, boutique: Boutique, tenanciere: Main, alea: random.Random
) -> list[Produit]:
    lignes = []
    for nom, categorie, unite, achat, vente, stock, alerte, mots in RAYON:
        # Un rayon jamais vide : le stock de départ est garni par un premier rachat.
        quantite = stock + alea.randint(-2, 6)
        produit = Produit(
            boutique_id=boutique.id,
            nom=nom,
            categorie=categorie,
            unite=unite,
            prix_achat=achat,
            prix_vente=vente,
            stock=max(0, quantite),
            alerte_stock=alerte,
            mots_cles=mots,
        )
        db.add(produit)
        lignes.append(produit)
    db.flush()

    today = date.today()
    for produit in lignes:
        if produit.stock <= 0:
            continue
        db.add(
            Entree(
                boutique_id=boutique.id,
                produit_id=produit.id,
                quantite=produit.stock,
                cout_unitaire=produit.prix_achat,
                jour=today - timedelta(days=alea.randint(3, 12)),
                moment=datetime.combine(today - timedelta(days=7), time(7, 30)),
                fournisseur=alea.choice(FOURNISSEURS),
                note="premier remplissage du cahier",
                tenu_par_id=tenanciere.id,
            )
        )
    db.flush()
    return lignes


def _ventes(
    db: Session,
    boutique: Boutique,
    produits: list[Produit],
    mains: list[Main],
    alea: random.Random,
) -> None:
    vendables = [un for un in produits if un.prix_vente > 0]
    today = date.today()
    for decalage in range(9, -1, -1):
        jour = today - timedelta(days=decalage)
        for _ in range(alea.randint(4, 11)):
            produit = alea.choice(vendables)
            quantite = alea.choice([1, 1, 1, 2, 2, 3])
            if produit.stock < quantite:
                continue
            cede = produit.prix_vente
            dictee = alea.random() < 0.45
            heure = time(alea.randint(7, 19), alea.randint(0, 59))
            db.add(
                Vente(
                    boutique_id=boutique.id,
                    produit_id=produit.id,
                    quantite=quantite,
                    prix_cede=cede,
                    cout_unitaire=produit.prix_achat,
                    mode=alea.choice(["especes", "especes", "momo_mtn", "momo_orange"]),
                    jour=jour,
                    moment=datetime.combine(jour, heure),
                    reference=reference_vente(),
                    dictee=dictee,
                    brut=(
                        f"{quantite} {produit.mots_cles.split()[0]} {cede}"
                        if dictee and produit.mots_cles
                        else ""
                    ),
                    tenu_par_id=alea.choice(mains).id,
                )
            )
            produit.stock -= quantite
    db.flush()


def _depenses(db: Session, boutique: Boutique, alea: random.Random) -> None:
    today = date.today()
    for libelle, categorie, montant in DEPENSES_TYPE:
        db.add(
            Depense(
                boutique_id=boutique.id,
                libelle=libelle,
                categorie=categorie,
                montant=montant,
                jour=today - timedelta(days=alea.randint(0, 6)),
                note="",
            )
        )
    db.flush()


def _comptage_hier(db: Session, boutique: Boutique, tenanciere: Main) -> None:
    from .tendance import journee

    hier = date.today() - timedelta(days=1)
    etat = journee(db, boutique.id, hier)
    attendu = max(0, 5_000 + etat["especes_jour"])
    db.add(
        Comptage(
            boutique_id=boutique.id,
            jour=hier,
            fond=5_000,
            attendu=attendu,
            compte=max(0, attendu - (100 if etat["ventes"] % 2 else 0)),
            note="compté avant la fermeture",
            tenu_par_id=tenanciere.id,
            moment=datetime.combine(hier, time(20, 15)),
        )
    )
    db.flush()
