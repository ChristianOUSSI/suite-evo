from __future__ import annotations

"""Ce que l'API rend à l'écran : des nombres, des dates ISO, des clés stables."""

from ..models import Document, Organisation, User
from ..utils import affiche_telephone


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


def _jours_restants(document: Document) -> int | None:
    """Les jours qui restent avant l'échéance ; négatif = dépassée."""
    if document.echeance is None:
        return None
    from ..utils import aujourdhui

    return (document.echeance - aujourdhui()).days


def document_dict(document: Document) -> dict:
    jours = _jours_restants(document)
    return {
        "id": document.id,
        "reference": document.reference,
        "titre": document.titre,
        "categorie": document.categorie,
        "description": document.description,
        "emetteur": document.emetteur,
        "destinataire": document.destinataire,
        "date_document": document.date_document.isoformat(),
        "echeance": document.echeance.isoformat() if document.echeance else None,
        "jours_restants": jours,
        "en_retard": jours is not None and jours < 0 and document.statut == "actif",
        "statut": document.statut,
        "note": document.note,
        "cree_par": document.auteur.nom if document.auteur else "",
        "cree_le": document.cree_le.isoformat(timespec="seconds"),
    }


def document_public_dict(document: Document) -> dict:
    """Ce que la vérification publique montre : le titre, pas le contenu."""
    return {
        "reference": document.reference,
        "titre": document.titre,
        "categorie": document.categorie,
        "date_document": document.date_document.isoformat(),
        "statut": document.statut,
        "maison": document.organisation.nom if document.organisation else "",
        "ville": document.organisation.ville if document.organisation else "",
    }
