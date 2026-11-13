from __future__ import annotations

"""Ce que l'API rend à l'écran : des nombres, des dates ISO, des clés stables."""

from ..models import Article, Client, Organisation, User
from ..utils import affiche_telephone, canonise_telephone, operateur


def organisation_dict(organisation: Organisation) -> dict:
    return {
        "id": organisation.id,
        "nom": organisation.nom,
        "ville": organisation.ville,
        "quartier": organisation.quartier,
        "telephone": organisation.telephone,
        "telephone_display": affiche_telephone(organisation.telephone),
    }


def compte_dict(compte: User) -> dict:
    return {"id": compte.id, "nom": compte.nom, "email": compte.email, "role": compte.role}


def client_dict(client: Client) -> dict:
    return {
        "id": client.id,
        "nom": client.nom,
        "telephone": client.telephone,
        "telephone_display": affiche_telephone(client.telephone),
        "telephone_joignable": canonise_telephone(client.telephone) is not None,
        "operateur": operateur(client.telephone),
        "type": client.type,
        "note": client.note,
        "cree_le": client.cree_le.isoformat(timespec="seconds"),
    }


def article_dict(article: Article, public: bool = False) -> dict:
    corps = {
        "id": article.id,
        "reference": article.reference,
        "nom": article.nom,
        "categorie": article.categorie,
        "taille": article.taille,
        "couleur": article.couleur,
        "stock": article.stock,
        "prix_vente": article.prix_vente,
        "statut": article.statut,
        "quantite_vendue": article.quantite_vendue,
        "note": article.note,
        "cree_le": article.cree_le.isoformat(timespec="seconds"),
    }
    if not public:
        corps.update({
            "prix_achat": article.prix_achat,
            "client_id": article.client_id,
            "client": article.client.nom if article.client else "",
            "date_vente": article.date_vente.isoformat() if article.date_vente else None,
        })
    return corps
