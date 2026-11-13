from __future__ import annotations

# Tout ce que le comptoir rend au téléphone est déjà libellé : montant avec ses
# milliers, jour avec son quantième, marge avec son pourcentage. Le front n'a
# rien à recalculer, il pose les mots.

from ..models import Comptage, Depense, Entree, Main, Produit, Vente
from ..utils import affiche_telephone, fcfa, jour_court, jour_label, maintenant


def boutique_dict(boutique) -> dict:
    return {
        "id": boutique.id,
        "nom": boutique.nom,
        "enseigne": boutique.enseigne,
        "quartier": boutique.quartier,
        "ville": boutique.ville,
        "tenancier": boutique.tenancier,
        "telephone": boutique.telephone,
        "telephone_display": affiche_telephone(boutique.telephone),
        "abonnement_hebdo": boutique.abonnement_hebdo,
        "abonnement_hebdo_label": fcfa(boutique.abonnement_hebdo),
        "devise": boutique.devise,
        "especes_actifs": boutique.especes_actifs,
        "momo_actif": boutique.momo_actif,
        "orange_actif": boutique.orange_actif,
        "credit_accorde": boutique.credit_accorde,
        "note": boutique.note,
    }


def main_dict(main: Main) -> dict:
    return {
        "id": main.id,
        "nom": main.nom,
        "email": main.email,
        "role": main.role,
        "role_label": main.role.capitalize(),
    }


def produit_dict(produit: Produit) -> dict:
    marge = produit.prix_vente - produit.prix_achat
    return {
        "id": produit.id,
        "nom": produit.nom,
        "categorie": produit.categorie,
        "unite": produit.unite,
        "prix_achat": produit.prix_achat,
        "prix_achat_label": fcfa(produit.prix_achat),
        "prix_vente": produit.prix_vente,
        "prix_vente_label": fcfa(produit.prix_vente),
        "marge": marge,
        "marge_label": fcfa(marge),
        "stock": produit.stock,
        "alerte_stock": produit.alerte_stock,
        "en_alerte": produit.stock <= produit.alerte_stock,
        "mots_cles": produit.mots_cles,
        "actif": produit.actif,
    }


def entree_dict(ligne: Entree) -> dict:
    return {
        "id": ligne.id,
        "produit": ligne.produit.nom,
        "produit_id": ligne.produit_id,
        "quantite": ligne.quantite,
        "unite": ligne.produit.unite,
        "cout_unitaire": ligne.cout_unitaire,
        "cout_unitaire_label": fcfa(ligne.cout_unitaire),
        "total": ligne.quantite * ligne.cout_unitaire,
        "total_label": fcfa(ligne.quantite * ligne.cout_unitaire),
        "jour": ligne.jour.isoformat(),
        "jour_label": jour_label(ligne.jour),
        "fournisseur": ligne.fournisseur,
        "note": ligne.note,
        "dictee": ligne.dictee,
        "brut": ligne.brut,
        "tenu_par": ligne.tenu_par.nom if ligne.tenu_par else "",
    }


def vente_dict(vente: Vente) -> dict:
    instant = maintenant()
    chiffre = vente.prix_cede * vente.quantite
    benefice = (vente.prix_cede - vente.cout_unitaire) * vente.quantite
    return {
        "id": vente.id,
        "produit": vente.produit.nom,
        "produit_id": vente.produit_id,
        "categorie": vente.produit.categorie,
        "quantite": vente.quantite,
        "unite": vente.produit.unite,
        "prix_cede": vente.prix_cede,
        "prix_cede_label": fcfa(vente.prix_cede),
        "cout_unitaire": vente.cout_unitaire,
        "chiffre": chiffre,
        "chiffre_label": fcfa(chiffre),
        "benefice": benefice,
        "benefice_label": fcfa(benefice),
        "mode": vente.mode,
        "mode_label": _mode_label(vente.mode),
        "jour": vente.jour.isoformat(),
        "jour_label": jour_label(vente.jour),
        "jour_court": jour_court(vente.jour),
        "moment": vente.moment.isoformat(),
        "heure": vente.moment.strftime("%H h %M"),
        "ago": _il_y_a(vente.moment, instant),
        "reference": vente.reference,
        "dictee": vente.dictee,
        "brut": vente.brut,
        "annule": vente.annule,
        "motif_annulation": vente.motif_annulation,
        "tenu_par": vente.tenu_par.nom if vente.tenu_par else "",
    }


def depense_dict(ligne: Depense) -> dict:
    return {
        "id": ligne.id,
        "libelle": ligne.libelle,
        "categorie": ligne.categorie,
        "montant": ligne.montant,
        "montant_label": fcfa(ligne.montant),
        "jour": ligne.jour.isoformat(),
        "jour_label": jour_label(ligne.jour),
        "note": ligne.note,
    }


def comptage_dict(compte: Comptage) -> dict:
    return {
        "id": compte.id,
        "jour": compte.jour.isoformat(),
        "jour_label": jour_label(compte.jour),
        "fond": compte.fond,
        "fond_label": fcfa(compte.fond),
        "attendu": compte.attendu,
        "attendu_label": fcfa(compte.attendu),
        "compte": compte.compte,
        "compte_label": fcfa(compte.compte),
        "ecart": compte.compte - compte.attendu,
        "ecart_label": fcfa(compte.compte - compte.attendu),
        "tenu": compte.compte == compte.attendu,
        "note": compte.note,
        "tenu_par": compte.tenu_par.nom if compte.tenu_par else "",
    }


def _mode_label(mode: str) -> str:
    return {
        "especes": "espèces",
        "momo_mtn": "MTN MoMo",
        "momo_orange": "Orange Money",
        "credit": "à crédit",
    }.get(mode, mode)


def _il_y_a(moment, instant) -> str:
    delta = instant - moment
    minutes = int(delta.total_seconds() // 60)
    if minutes < 1:
        return "à l'instant"
    if minutes < 60:
        return f"il y a {minutes} min"
    heures = minutes // 60
    if heures < 24:
        return f"il y a {heures} h"
    jours = heures // 24
    return f"il y a {jours} jour" + ("s" if jours > 1 else "")
