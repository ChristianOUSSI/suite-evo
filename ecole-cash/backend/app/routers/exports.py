import csv
from io import StringIO

from fastapi import APIRouter, Query
from fastapi.responses import Response
from sqlalchemy import select

from ..deps import CurrentEcole, DbSession
from ..models import Echeance, Eleve, Engagement, Journee, Paiement, Recu
from ..services import encaissement, present
from ..utils import affiche_telephone, jour_fr, maintenant

router = APIRouter(tags=["feuilles"])


def proteger(cellule) -> str:
    """Un champ qui commence par =, +, - ou @ devient du texte pour le tableur."""
    texte = "" if cellule is None else str(cellule)
    if texte[:1] in ("=", "+", "-", "@", "\t", "\r"):
        return f"'{texte}"
    return texte


def feuille(nom: str, entete: list[str], lignes: list[list]) -> Response:
    tampon = StringIO()
    scribe = csv.writer(tampon, delimiter=";", lineterminator="\r\n")
    scribe.writerow(entete)
    for rangee in lignes:
        scribe.writerow([proteger(cellule) for cellule in rangee])
    return Response(
        content="﻿" + tampon.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={
            "content-disposition": f'attachment; filename="{nom}"',
            "cache-control": "no-store",
        },
    )


def borne_jours(jours: int) -> int:
    return maintenant().date().toordinal() - jours


@router.get("/exports/recus.csv")
def recus(
    ecole: CurrentEcole,
    db: DbSession,
    jours: int = Query(default=90, ge=1, le=3650),
) -> Response:
    borne = borne_jours(jours)
    lignes = db.scalars(
        select(Recu)
        .where(Recu.ecole_id == ecole.id)
        .order_by(Recu.emission.desc())
    ).all()
    rangees = [
        [
            recu.numero,
            recu.emission.date().isoformat(),
            recu.paiement.eleve.matricule,
            f"{recu.paiement.eleve.prenoms} {recu.paiement.eleve.nom}",
            recu.paiement.eleve.classe.label if recu.paiement.eleve.classe else "",
            recu.paiement.montant,
            encaissement.MODES.get(recu.paiement.mode, recu.paiement.mode),
            recu.canal,
            recu.statut,
            recu.reference,
            affiche_telephone(recu.destinataire),
            recu.jeton,
        ]
        for recu in lignes
        if recu.emission.date().toordinal() >= borne
    ]
    return feuille(
        "ecole-cash-recus.csv",
        [
            "Numéro",
            "Date",
            "Matricule",
            "Élève",
            "Classe",
            "Montant FCFA",
            "Mode",
            "Canal",
            "État",
            "Référence envoi",
            "Parent",
            "Jeton",
        ],
        rangees,
    )


@router.get("/exports/impayes.csv")
def impayes(ecole: CurrentEcole, db: DbSession) -> Response:
    annee = present.annee_courante(ecole)
    eleves = db.scalars(
        select(Eleve).where(Eleve.ecole_id == ecole.id).order_by(Eleve.nom)
    ).all()
    rangees = []
    for eleve in eleves:
        fiche = present.eleve_dict(db, eleve, annee)
        if fiche["du"] == 0:
            continue
        rangees.append(
            [
                fiche["matricule"],
                fiche["nom_complet"],
                fiche["classe"],
                fiche["tuteur_nom"],
                fiche["tuteur_telephone_display"],
                fiche["statut_label"],
                fiche["du"],
                fiche["rentre"],
                fiche["reste"],
                fiche["retard_montant"],
                fiche["jours_retard"],
                fiche["prochaine"]["due_label"] if fiche["prochaine"] else "",
            ]
        )
    return feuille(
        "ecole-cash-impayes.csv",
        [
            "Matricule",
            "Élève",
            "Classe",
            "Parent",
            "Téléphone",
            "Statut",
            "Due FCFA",
            "Réglé FCFA",
            "Reste FCFA",
            "Retard FCFA",
            "Jours de retard",
            "Prochaine échéance",
        ],
        rangees,
    )


@router.get("/exports/caisse.csv")
def caisse(
    ecole: CurrentEcole,
    db: DbSession,
    jours: int = Query(default=30, ge=1, le=365),
) -> Response:
    borne = borne_jours(jours)
    paiements = db.scalars(
        select(Paiement)
        .where(Paiement.ecole_id == ecole.id)
        .order_by(Paiement.moment.desc())
    ).all()
    rangees = [
        [
            entree.moment.date().isoformat(),
            entree.moment.strftime("%H:%M"),
            entree.eleve.matricule,
            f"{entree.eleve.prenoms} {entree.eleve.nom}",
            entree.montant,
            encaissement.MODES.get(entree.mode, entree.mode),
            entree.encaisse_par,
            entree.recu.numero if entree.recu else "",
            "annulé" if entree.annule else "tenu",
            entree.reference,
        ]
        for entree in paiements
        if entree.moment.date().toordinal() >= borne
    ]
    journees = db.scalars(
        select(Journee)
        .where(Journee.ecole_id == ecole.id)
        .order_by(Journee.jour)
    ).all()
    for ouverte in journees:
        if ouverte.jour.toordinal() < borne:
            continue
        rangees.append(
            [
                ouverte.jour.isoformat(),
                "soir",
                "",
                f"déclaration du {jour_fr(ouverte.jour)}",
                ouverte.comptage,
                "comptage",
                ouverte.tenu_par,
                "",
                "comptée" if ouverte.declaree else "à faire",
                "",
            ]
        )
    return feuille(
        "ecole-cash-caisse.csv",
        [
            "Jour",
            "Heure",
            "Matricule",
            "Élève ou déclaration",
            "Montant FCFA",
            "Mode",
            "Tenu par",
            "Reçu",
            "État",
            "Référence",
        ],
        rangees,
    )


@router.get("/exports/eleves.csv")
def eleves(ecole: CurrentEcole, db: DbSession) -> Response:
    annee = present.annee_courante(ecole)
    lignes = db.scalars(
        select(Eleve)
        .where(Eleve.ecole_id == ecole.id)
        .order_by(Eleve.classe_id, Eleve.nom)
    ).all()
    rangees = []
    for eleve in lignes:
        fiche = present.eleve_dict(db, eleve, annee)
        rangees.append(
            [
                fiche["matricule"],
                fiche["nom_complet"],
                fiche["sexe"],
                fiche["classe"],
                fiche["tuteur_nom"],
                fiche["tuteur_telephone_display"],
                fiche["tuteur_second_display"],
                fiche["quartier"],
                fiche["statut_label"],
                fiche["du"],
                fiche["rentre"],
                fiche["reste"],
            ]
        )
    return feuille(
        "ecole-cash-eleves.csv",
        [
            "Matricule",
            "Élève",
            "Sexe",
            "Classe",
            "Parent",
            "Téléphone",
            "Second numéro",
            "Quartier",
            "Statut",
            "Due FCFA",
            "Réglé FCFA",
            "Reste FCFA",
        ],
        rangees,
    )


@router.get("/exports/echeances.csv")
def echeances(ecole: CurrentEcole, db: DbSession) -> Response:
    lignes = db.scalars(
        select(Echeance)
        .join(Engagement, Echeance.engagement_id == Engagement.id)
        .where(Echeance.ecole_id == ecole.id)
        .order_by(Echeance.due)
    ).all()
    rangees = [
        [
            ligne.engagement.annee,
            ligne.due.isoformat(),
            ligne.libelle,
            ligne.engagement.eleve.matricule,
            f"{ligne.engagement.eleve.prenoms} {ligne.engagement.eleve.nom}",
            ligne.montant,
            ligne.impute,
            max(0, ligne.montant - ligne.impute),
        ]
        for ligne in lignes
    ]
    return feuille(
        "ecole-cash-echeances.csv",
        [
            "Année",
            "Échéance",
            "Terme",
            "Matricule",
            "Élève",
            "Montant FCFA",
            "Imputé FCFA",
            "Reste FCFA",
        ],
        rangees,
    )
