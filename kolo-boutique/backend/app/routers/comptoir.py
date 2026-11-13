from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from ..deps import CurrentBoutique, DbSession, MainCourante
from ..models import Main, Produit
from ..schemas import BoutiqueEntree, MainEntree, ProduitEntree
from ..security import hash_password
from ..services import present

router = APIRouter(tags=["comptoir"])


@router.get("/boutique")
def lecture(boutique: CurrentBoutique) -> dict:
    return present.boutique_dict(boutique)


@router.put("/boutique")
def ecrire(entree: BoutiqueEntree, boutique: CurrentBoutique, db: DbSession) -> dict:
    """Les mots du comptoir, ses rails et son abonnement. Le nom se change, les écritures restent."""
    boutique.nom = entree.nom.strip()
    boutique.enseigne = entree.enseigne.strip()
    boutique.quartier = entree.quartier.strip()
    boutique.ville = entree.ville.strip()
    boutique.tenancier = entree.tenancier.strip()
    boutique.telephone = entree.telephone
    boutique.abonnement_hebdo = entree.abonnement_hebdo
    boutique.especes_actifs = entree.especes_actifs
    boutique.momo_actif = entree.momo_actif
    boutique.orange_actif = entree.orange_actif
    boutique.credit_accorde = entree.credit_accorde
    boutique.note = entree.note
    db.commit()
    return present.boutique_dict(boutique)


@router.get("/mains")
def equipe(boutique: CurrentBoutique, db: DbSession) -> list[dict]:
    mains = db.scalars(
        select(Main).where(Main.boutique_id == boutique.id).order_by(Main.nom)
    ).all()
    return [present.main_dict(un) for un in mains]


@router.post("/mains")
def ajouter_main(
    entree: MainEntree, boutique: CurrentBoutique, main: MainCourante, db: DbSession
) -> dict:
    if main.role != "tenancier":
        raise HTTPException(
            status_code=403,
            detail="Seul le tenancier ajoute une main au comptoir.",
        )
    email = entree.email.strip().lower()
    if db.scalar(select(Main.id).where(Main.email == email)):
        raise HTTPException(
            status_code=422, detail="Cette adresse tient déjà un comptoir."
        )
    nouvelle = Main(
        boutique_id=boutique.id,
        nom=entree.nom.strip(),
        email=email,
        mot_de_passe=hash_password(entree.mot_de_passe),
        role=entree.role,
    )
    db.add(nouvelle)
    db.commit()
    return present.main_dict(nouvelle)


@router.get("/produits")
def cahier(
    boutique: CurrentBoutique,
    db: DbSession,
    categorie: str | None = None,
    motif: str | None = None,
    alertes: bool = False,
) -> dict:
    requete = select(Produit).where(
        Produit.boutique_id == boutique.id, Produit.actif.is_(True)
    )
    lignes = list(db.scalars(requete).all())
    if categorie:
        lignes = [un for un in lignes if un.categorie == categorie]
    if motif:
        trame = motif.strip().lower()
        lignes = [
            un
            for un in lignes
            if trame in un.nom.lower() or trame in (un.mots_cles or "").lower()
        ]

    rendues = [present.produit_dict(un) for un in lignes]
    if alertes:
        rendues = [un for un in rendues if un["en_alerte"]]

    return {
        "total": len(rendues),
        "en_alerte": sum(1 for un in rendues if un["en_alerte"]),
        "reserve": sum(un["prix_achat"] * un["stock"] for un in rendues),
        "produits": sorted(rendues, key=lambda un: un["nom"]),
    }


@router.post("/produits")
def ajouter_produit(
    entree: ProduitEntree, boutique: CurrentBoutique, db: DbSession
) -> dict:
    nom = entree.nom.strip()
    existe = db.scalar(
        select(Produit).where(
            Produit.boutique_id == boutique.id,
            Produit.nom == nom,
            Produit.categorie == entree.categorie,
        )
    )
    if existe:
        raise HTTPException(
            status_code=422,
            detail=f"{nom} tient déjà sa ligne dans {entree.categorie}.",
        )
    produit = Produit(
        boutique_id=boutique.id,
        nom=nom,
        categorie=entree.categorie,
        unite=entree.unite,
        prix_achat=entree.prix_achat,
        prix_vente=entree.prix_vente,
        stock=entree.stock,
        alerte_stock=entree.alerte_stock,
        mots_cles=entree.mots_cles.strip(),
    )
    db.add(produit)
    db.commit()
    return present.produit_dict(produit)


@router.patch("/produits/{produit_id}")
def corriger_produit(
    produit_id: int, entree: ProduitEntree, boutique: CurrentBoutique, db: DbSession
) -> dict:
    produit = db.get(Produit, produit_id)
    if not produit or produit.boutique_id != boutique.id:
        raise HTTPException(status_code=404, detail="Article inconnu du comptoir.")
    produit.nom = entree.nom.strip()
    produit.categorie = entree.categorie
    produit.unite = entree.unite
    # Le prix d'achat se corrige à la main seulement s'il n'y a plus de stock :
    # sinon c'est un rachat qui le remélange, pas une saisie.
    if entree.prix_achat != produit.prix_achat and produit.stock > 0:
        raise HTTPException(
            status_code=422,
            detail=(
                "Le coût d'un article encore en réserve se reprend par une entrée, "
                "pas par une correction."
            ),
        )
    produit.prix_achat = entree.prix_achat
    produit.prix_vente = entree.prix_vente
    produit.alerte_stock = entree.alerte_stock
    produit.mots_cles = entree.mots_cles.strip()
    db.commit()
    return present.produit_dict(produit)


@router.delete("/produits/{produit_id}", status_code=204)
def retirer_produit(
    produit_id: int, boutique: CurrentBoutique, db: DbSession
) -> None:
    produit = db.get(Produit, produit_id)
    if not produit or produit.boutique_id != boutique.id:
        raise HTTPException(status_code=404, detail="Article inconnu du comptoir.")
    if produit.stock > 0:
        raise HTTPException(
            status_code=422,
            detail=f"Encore {produit.stock} {produit.unite} en réserve : videz la ligne d'abord.",
        )
    produit.actif = False
    db.commit()
