from __future__ import annotations

"""Ce que l'API rend à l'écran : des nombres, des dates ISO, des clés stables."""

from ..models import Note, Organisation, User
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


def note_dict(note: Note, public: bool = False) -> dict:
    corps = {
        "id": note.id,
        "titre": note.titre,
        "contenu": note.contenu,
        "categorie": note.categorie,
        "epinglee": note.epinglee,
        "archivee": note.archivee,
        "mots": len(note.contenu.split()) if note.contenu else 0,
        "cree_le": note.cree_le.isoformat(timespec="seconds"),
        "maj_le": note.maj_le.isoformat(timespec="seconds") if note.maj_le else None,
    }
    if not public:
        corps["code_partage"] = note.code_partage
        corps["lien"] = f"/partage/{note.code_partage}"
    return corps
