from __future__ import annotations

# Ce qui entre et ce qui sort du comptoir.
#
# Le coût d'un article est un coût moyen pondéré : chaque rachat remélange le
# stock déjà là avec le nouveau, à son prix à lui. Une vente fige ensuite le coût
# du jour sur sa ligne, pour que le bénéfice d'une vente passée ne bouge plus.

from fastapi import HTTPException
from sqlalchemy import select

from ..models import Entree, Produit, Vente


def produit_de(boutique_id: int, produit_id: int, db) -> Produit:
    produit = db.get(Produit, produit_id)
    if not produit or produit.boutique_id != boutique_id:
        raise HTTPException(
            status_code=404, detail="Cet article n'est pas dans ce comptoir."
        )
    return produit


def appliquer_entree(
    db,
    boutique_id: int,
    produit: Produit,
    quantite: int,
    cout_unitaire: int,
    tenu_par_id: int,
    fournisseur: str = "",
    note: str = "",
    dictee: bool = False,
    brut: str = "",
) -> tuple[Entree, Produit]:
    """Un rachat entre en réserve et remélange le coût moyen."""
    if quantite <= 0:
        raise HTTPException(
            status_code=422, detail="Une entrée demande une quantité d'au moins un."
        )

    nouveau_stock = produit.stock + quantite
    cout_moyen = (
        round((produit.stock * produit.prix_achat + quantite * cout_unitaire) / nouveau_stock)
        if nouveau_stock > 0
        else cout_unitaire
    )

    ligne = Entree(
        boutique_id=boutique_id,
        produit_id=produit.id,
        quantite=quantite,
        cout_unitaire=cout_unitaire,
        fournisseur=fournisseur,
        note=note,
        dictee=dictee,
        brut=brut,
        tenu_par_id=tenu_par_id,
    )
    produit.stock = nouveau_stock
    produit.prix_achat = cout_moyen

    db.add(ligne)
    db.commit()
    db.refresh(ligne)
    return ligne, produit


def appliquer_vente(
    db,
    boutique_id: int,
    produit: Produit,
    quantite: int,
    prix_cede: int | None,
    mode: str,
    tenu_par_id: int,
    reference: str,
    dictee: bool = False,
    brut: str = "",
) -> Vente:
    """Une vente sort du stock, fige son coût et rend sa marge."""
    if quantite <= 0:
        raise HTTPException(
            status_code=422, detail="Une vente demande une quantité d'au moins un."
        )
    if produit.stock < quantite:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Le stock ne tient pas : il reste {produit.stock} "
                f"{produit.unite} de {produit.nom}."
            ),
        )

    cede = prix_cede if prix_cede is not None else produit.prix_vente
    if cede <= 0 and produit.prix_vente <= 0:
        raise HTTPException(
            status_code=422,
            detail="Aucun prix au comptoir pour cet article. Notez-le d'abord.",
        )

    vente = Vente(
        boutique_id=boutique_id,
        produit_id=produit.id,
        quantite=quantite,
        prix_cede=cede,
        cout_unitaire=produit.prix_achat,
        mode=mode,
        reference=reference,
        dictee=dictee,
        brut=brut,
        tenu_par_id=tenu_par_id,
    )
    produit.stock -= quantite

    db.add(vente)
    db.commit()
    db.refresh(vente)
    return vente


def annuler_vente(db, vente: Vente, motif: str) -> Vente:
    """La vente est rayée, la marchandise revient en réserve."""
    if vente.annule:
        raise HTTPException(status_code=422, detail="Cette vente est déjà rayée.")
    produit = db.get(Produit, vente.produit_id)
    if produit:
        produit.stock += vente.quantite
    vente.annule = True
    vente.motif_annulation = motif
    db.commit()
    db.refresh(vente)
    return vente


def alertes_stock(db, boutique_id: int) -> list[Produit]:
    """Ce qui descend sous la ligne d'alerte, à racheter demain."""
    lignes = db.scalars(
        select(Produit).where(
            Produit.boutique_id == boutique_id, Produit.actif.is_(True)
        )
    ).all()
    return [un for un in lignes if un.stock <= un.alerte_stock]
