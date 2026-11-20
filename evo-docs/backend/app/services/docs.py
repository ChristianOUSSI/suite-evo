from __future__ import annotations

"""Le registre du classeur : les documents et leurs échéances.

Une échéance qui passe ne s'efface pas : le document reste actif et le
récap le compte en retard. Archiver ou annuler change le statut, jamais
le passé.
"""

import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..messages import refus
from ..models import Document, Organisation, User, nouvelle_reference
from ..schemas import DocumentEntree
from ..utils import affiche_telephone, aujourdhui, maintenant, periode_de


def document_de(db: Session, organisation: Organisation, document_id: int) -> Document:
    document = db.get(Document, document_id)
    if document is None or document.organisation_id != organisation.id:
        raise refus("document_inconnu", 404)
    return document


def _reference_libre(db: Session) -> str:
    for _ in range(20):
        reference = nouvelle_reference()
        if db.scalar(select(Document.id).where(Document.reference == reference)) is None:
            return reference
    raise refus("saisie", 500)


def enregistrer_document(
    db: Session, organisation: Organisation, entree: DocumentEntree, compte: User
) -> Document:
    if entree.date_document and entree.date_document > aujourdhui():
        raise refus("saisie", **{"date_document": "le jour"})
    if entree.echeance and entree.date_document and entree.echeance < entree.date_document:
        raise refus("saisie", **{"echeance": "avant le document"})

    document = Document(
        organisation_id=organisation.id,
        reference=_reference_libre(db),
        titre=entree.titre.strip(),
        categorie=entree.categorie,
        description=entree.description.strip(),
        emetteur=entree.emetteur.strip(),
        destinataire=entree.destinataire.strip(),
        date_document=entree.date_document or aujourdhui(),
        echeance=entree.echeance,
        note=entree.note.strip(),
        cree_par=compte.id,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def corriger_document(
    db: Session, organisation: Organisation, document_id: int, patch: dict
) -> Document:
    document = document_de(db, organisation, document_id)
    for cle, valeur in patch.items():
        if valeur is not None:
            setattr(document, cle, valeur)
    db.commit()
    db.refresh(document)
    return document


def etat(db: Session, organisation: Organisation) -> dict:
    """La vitre du classeur : documents, échéances, retards."""
    aujourdhui_d = aujourdhui()
    documents = db.scalars(
        select(Document).where(Document.organisation_id == organisation.id)
    ).all()
    actifs = [un for un in documents if un.statut == "actif"]
    en_retard = [
        un for un in actifs
        if un.echeance is not None and un.echeance < aujourdhui_d
    ]
    a_venir = [
        un for un in actifs
        if un.echeance is not None and 0 <= (un.echeance - aujourdhui_d).days <= 30
    ]
    par_categorie: dict[str, int] = {}
    for un in actifs:
        par_categorie[un.categorie] = par_categorie.get(un.categorie, 0) + 1
    return {
        "jour": aujourdhui_d.isoformat(),
        "periode": periode_de(aujourdhui_d),
        "documents": len(documents),
        "actifs": len(actifs),
        "archives": sum(1 for un in documents if un.statut == "archive"),
        "en_retard": len(en_retard),
        "a_venir_30j": len(a_venir),
        "avec_echeance": sum(1 for un in actifs if un.echeance is not None),
        "par_categorie": par_categorie,
    }


def liste_documents(
    db: Session,
    organisation: Organisation,
    categorie: str | None = None,
    statut: str | None = None,
    echeance: str | None = None,
    recherche: str | None = None,
    limite: int = 500,
) -> list[dict]:
    from .present import document_dict

    requete = (
        select(Document)
        .where(Document.organisation_id == organisation.id)
        .order_by(Document.date_document.desc(), Document.id.desc())
        .limit(limite)
    )
    documents = list(db.scalars(requete).all())
    if categorie:
        documents = [un for un in documents if un.categorie == categorie]
    if statut:
        documents = [un for un in documents if un.statut == statut]
    if echeance == "retard":
        documents = [
            un for un in documents
            if un.statut == "actif" and un.echeance is not None and un.echeance < aujourdhui()
        ]
    elif echeance == "proche":
        aujourdhui_d = aujourdhui()
        documents = [
            un for un in documents
            if un.statut == "actif" and un.echeance is not None
            and 0 <= (un.echeance - aujourdhui_d).days <= 30
        ]
    elif echeance == "sans":
        documents = [un for un in documents if un.echeance is None]
    if recherche:
        motif = recherche.strip().lower()
        documents = [
            un
            for un in documents
            if motif in un.titre.lower()
            or motif in un.reference.lower()
            or motif in un.emetteur.lower()
            or motif in un.destinataire.lower()
        ]
    return [document_dict(un) for un in documents]


def fiche_document(db: Session, organisation: Organisation, document_id: int) -> dict:
    from .present import document_dict

    return document_dict(document_de(db, organisation, document_id))


def document_par_reference(db: Session, reference: str) -> Document | None:
    return db.scalar(select(Document).where(Document.reference == reference.upper()))


def recap(db: Session, organisation: Organisation, periode: str) -> dict:
    """Le mois du classeur : documents, échéances, par catégorie."""
    if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", periode or ""):
        raise refus("periode_inconnue")

    documents = db.scalars(
        select(Document).where(Document.organisation_id == organisation.id)
    ).all()
    aujourdhui_d = aujourdhui()
    du_mois = [un for un in documents if periode_de(un.date_document) == periode]
    actifs = [un for un in documents if un.statut == "actif"]
    en_retard = [
        un for un in actifs if un.echeance is not None and un.echeance < aujourdhui_d
    ]
    a_venir = [
        un for un in actifs
        if un.echeance is not None and 0 <= (un.echeance - aujourdhui_d).days <= 30
    ]

    par_categorie: dict[str, int] = {}
    for un in du_mois:
        par_categorie[un.categorie] = par_categorie.get(un.categorie, 0) + 1

    return {
        "periode": periode,
        "documents": len(documents),
        "actifs": len(actifs),
        "ajoutes_mois": len(du_mois),
        "en_retard": len(en_retard),
        "a_venir_30j": len(a_venir),
        "par_categorie": [
            {"categorie": cle, "documents": n}
            for cle, n in sorted(par_categorie.items(), key=lambda un: -un[1])
        ],
        "par_statut": {
            statut: sum(1 for un in documents if un.statut == statut)
            for statut in ("actif", "archive", "annule")
        },
    }


def demande_dict(demande) -> dict:
    """Une demande de document, vue de l'intérieur."""
    return {
        "id": demande.id,
        "nom": demande.nom,
        "telephone": demande.telephone,
        "telephone_display": affiche_telephone(demande.telephone),
        "categorie": demande.categorie,
        "motif": demande.motif,
        "statut": demande.statut,
        "note": demande.note,
        "cree_le": demande.cree_le.isoformat(timespec="seconds"),
        "traite_le": demande.traite_le.isoformat(timespec="seconds") if demande.traite_le else None,
    }


def demande_publique_dict(demande) -> dict:
    """Ce que le citoyen relit après envoi : sa demande, pas le classeur."""
    return {
        "reference": demande.id,
        "statut": demande.statut,
        "categorie": demande.categorie,
    }


def ajouter_demande(db: Session, organisation: Organisation, entree) -> "Demande":
    """La demande venue de la page publique : elle entre au registre."""
    from ..models import Demande

    demande = Demande(
        organisation_id=organisation.id,
        nom=entree.nom.strip(),
        telephone=entree.telephone,
        categorie=entree.categorie,
        motif=entree.motif.strip(),
    )
    db.add(demande)
    db.commit()
    db.refresh(demande)
    return demande


def liste_demandes(db: Session, organisation: Organisation) -> list:
    from ..models import Demande
    from sqlalchemy import select

    return list(
        db.scalars(
            select(Demande)
            .where(Demande.organisation_id == organisation.id)
            .order_by(Demande.id.desc())
        ).all()
    )


def demande_de(db: Session, organisation: Organisation, demande_id: int):
    from ..models import Demande

    demande = db.get(Demande, demande_id)
    if demande is None or demande.organisation_id != organisation.id:
        from ..messages import refus

        raise refus("demande_inconnue", 404)
    return demande


def traiter_demande(db: Session, organisation: Organisation, demande_id: int, entree) -> "Demande":
    demande = demande_de(db, organisation, demande_id)
    if entree.statut is not None:
        demande.statut = entree.statut
        demande.traite_le = maintenant() if entree.statut != "demandee" else None
    if entree.note is not None:
        demande.note = entree.note.strip()
    db.commit()
    db.refresh(demande)
    return demande
