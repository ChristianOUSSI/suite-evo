from __future__ import annotations

# La dictée : une phrase de dix secondes envoyée par vocal WhatsApp devient une
# ligne du cahier. Le tri reste volontairement têtu : il ne devine jamais un
# article absent du comptoir, et il rend les mains quand la phrase ne dit pas
# assez. Une fausse écriture de stock coûte plus cher qu'une relance manuelle.

import re
import unicodedata
from dataclasses import dataclass, field

from fastapi import HTTPException
from sqlalchemy import select

from ..models import Main, Produit
from . import stock

VERBES_ENTREE = ("entree", "entrees", "rachat", "reception", "appro")
VERBES_DEPENSE = ("depense", "depenses", "frais", "paye", "sortie", "payee")
VERBES_VENTE = ("vend", "vends", "vente", "sortie", "cedee", "donne")
PREPOSITIONS = (
    "de",
    "du",
    "des",
    "la",
    "le",
    "les",
    "un",
    "une",
    "au",
    "aux",
    "a",
    "à",
    "pour",
    "en",
    "sur",
    "avec",
)
UNITES = (
    "piece",
    "pieces",
    "carton",
    "cartons",
    "sachet",
    "sachets",
    "bouteille",
    "bouteilles",
    "bidon",
    "bidons",
    "kg",
    "kilo",
    "kilos",
    "litre",
    "litres",
)
MODES = (
    (("momo", "mtn"), "momo_mtn"),
    (("orange",), "momo_orange"),
    (("credit", "crédit"), "credit"),
    (("espece", "especes", "cash"), "especes"),
)

# Les mots de rail sont des méta-données, pas des articles : « 2 fanta 900 momo »
# doit vendre un soda, pas une recharge MoMo. On les retire du vocabulaire avant
# de chercher l'article, quitte à ce qu'une « carte orange » se dicte autrement.
MOTS_RAIL = ("momo", "mtn", "orange", "espece", "especes", "cash", "credit")


@dataclass
class Dictee:
    verbe: str
    produit: Produit | None = None
    quantite: int = 1
    prix: int | None = None
    mode: str = "especes"
    libelle: str = ""
    categorie: str = "autre"
    brut: str = ""
    doute: str | None = field(default=None)

    @property
    def appliquee(self) -> bool:
        return self.doute is None


def plie(texte: str) -> str:
    """Bas de casse, sans accents : la voix dit 'Fanta', le cahier écrit 'fanta'."""
    propre = unicodedata.normalize("NFD", texte.lower())
    sans_accents = "".join(c for c in propre if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", sans_accents).strip()


def _nombres(phrase: str) -> list[int]:
    return [int(un) for un in re.findall(r"\d+", phrase)]


def _mode(phrase: str) -> tuple[str, str]:
    plat = plie(phrase)
    for racines, mode in MODES:
        if any(racine in plat for racine in racines):
            return mode, phrase
    return "especes", phrase


def _verbe(phrase: str) -> str:
    plat = plie(phrase)
    mots = plat.split()
    for mot in mots:
        if mot in VERBES_ENTREE:
            return "entree"
        if mot in VERBES_DEPENSE:
            return "depense"
        if mot in VERBES_VENTE:
            return "vente"
    return "vente"


def _mots_phrase(phrase: str) -> list[str]:
    """Les mots dits, dans leur forme originale : un nom propre se garde tel quel."""
    gardes = []
    for mot in (phrase or "").split():
        net = mot.strip(".,;:!?")
        if not net or net.isdigit():
            continue
        if plie(net) in PREPOSITIONS or plie(net) in UNITES or plie(net) in MOTS_RAIL:
            continue
        if plie(net) in VERBES_ENTREE or plie(net) in VERBES_DEPENSE or plie(net) in VERBES_VENTE:
            continue
        gardes.append(net)
    return gardes


def _mots_articles(phrase: str) -> list[str]:
    plats = plie(phrase).split()
    gardes = []
    for mot in plats:
        mot = mot.strip(".,;:!?")
        if not mot or mot.isdigit():
            continue
        if mot in PREPOSITIONS or mot in UNITES or mot in MOTS_RAIL:
            continue
        if mot in VERBES_ENTREE or mot in VERBES_DEPENSE or mot in VERBES_VENTE:
            continue
        gardes.append(mot)
    return gardes


def _trouve_produit(db, boutique_id: int, mots: list[str]) -> Produit | None:
    """Le produit dont le nom ou les mots-clés couvrent le plus de mots dits."""
    if not mots:
        return None
    candidats = db.scalars(
        select(Produit).where(Produit.boutique_id == boutique_id, Produit.actif.is_(True))
    ).all()
    meilleur: Produit | None = None
    score = 0
    vocabulaire = set(mots)
    for produit in candidats:
        terrain = set(plie(produit.nom).split())
        for mot in plie(produit.mots_cles).replace(",", " ").split():
            if mot:
                terrain.add(mot)
        recouvrement = len(terrain & vocabulaire)
        if recouvrement > score:
            meilleur, score = produit, recouvrement
    return meilleur


def interprete(db, boutique_id: int, phrase: str) -> Dictee:
    """Une phrase du comptoir devient une intention, sans rien écrire."""
    propre = (phrase or "").strip()
    if len(propre) < 2:
        raise HTTPException(
            status_code=422, detail="La phrase est trop courte pour être comprise."
        )

    nombres = _nombres(propre)
    verbe = _verbe(propre)
    mots = _mots_articles(propre)

    if verbe == "depense":
        if not nombres:
            raise HTTPException(
                status_code=422,
                detail="Une dépense demande un montant, par exemple « taxi 1500 ».",
            )
        dits = _mots_phrase(propre)
        # Une dépense ne se paie pas par un rail de vente : le mode reste vide.
        return Dictee(
            verbe="depense",
            prix=nombres[-1],
            libelle=" ".join(dits) if dits else "dépense du jour",
            categorie=_categorie([plie(un) for un in dits]),
            mode="",
            brut=propre,
        )

    produit = _trouve_produit(db, boutique_id, mots)
    if produit is None:
        raise HTTPException(
            status_code=422,
            detail=(
                "Aucun article du comptoir ne correspond à la phrase. "
                "Ajoute l'article ou dis son habituel."
            ),
        )

    if verbe == "entree":
        if len(nombres) < 2:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Une entrée demande une quantité puis un coût, "
                    "par exemple « rachat 5 fanta 900 »."
                ),
            )
        return Dictee(
            verbe="entree",
            produit=produit,
            quantite=nombres[0],
            prix=nombres[-1],
            brut=propre,
        )

    # Une vente : le premier nombre dit la quantité, le dernier le prix cédé.
    # Un seul nombre se lit toujours comme le prix d'une unité : c'est la phrase
    # la plus courte qu'on dicte, « fanta 1000 », et elle ne laisse pas de place
    # au doute.
    if len(nombres) >= 2:
        quantite, prix = nombres[0], nombres[-1]
    elif len(nombres) == 1:
        quantite, prix = 1, nombres[0]
    else:
        quantite, prix = 1, None

    mode, _ = _mode(propre)
    if produit.stock < quantite:
        return Dictee(
            verbe="vente",
            produit=produit,
            quantite=quantite,
            prix=prix,
            mode=mode,
            brut=propre,
            doute=(
                f"Il reste {produit.stock} {produit.unite} de {produit.nom} : "
                "la phrase demande plus que le comptoir n'en a."
            ),
        )

    return Dictee(
        verbe="vente",
        produit=produit,
        quantite=quantite,
        prix=prix,
        mode=mode,
        brut=propre,
    )


def _categorie(mots: list[str]) -> str:
    plat = " ".join(mots)
    for racine, categorie in (
        ("transport", "transport"),
        ("taxi", "transport"),
        ("bus", "transport"),
        ("loyer", "loyer"),
        ("salaire", "salaire"),
        ("paid", "salaire"),
        ("facture", "facture"),
        ("electricite", "facture"),
        ("eau", "facture"),
    ):
        if racine in plat:
            return categorie
    return "autre"


def applique(db, boutique_id: int, main: Main, dictee: Dictee, reference: str) -> dict:
    """Écrit l'intention comprise au cahier. Un doute rendu plus haut écrit quand même :
    le stock est déjà contrôlé à l'interprétation."""
    if not dictee.appliquee:
        raise HTTPException(status_code=422, detail=dictee.doute)

    if dictee.verbe == "depense":
        from ..models import Depense

        ligne = Depense(
            boutique_id=boutique_id,
            libelle=dictee.libelle,
            categorie=dictee.categorie,
            montant=dictee.prix or 0,
            note=dictee.brut,
        )
        db.add(ligne)
        db.commit()
        db.refresh(ligne)
        return {"ecriture": "depense", "id": ligne.id}

    assert dictee.produit is not None
    if dictee.verbe == "entree":
        ligne, _ = stock.appliquer_entree(
            db,
            boutique_id,
            dictee.produit,
            dictee.quantite,
            dictee.prix or 0,
            main.id,
            note=dictee.brut,
            dictee=True,
            brut=dictee.brut,
        )
        return {"ecriture": "entree", "id": ligne.id}

    vente = stock.appliquer_vente(
        db,
        boutique_id,
        dictee.produit,
        dictee.quantite,
        dictee.prix,
        dictee.mode,
        main.id,
        reference,
        dictee=True,
        brut=dictee.brut,
    )
    return {"ecriture": "vente", "id": vente.id}
