from __future__ import annotations

"""Le coeur du carnet : qui rappeler, et qu'est-ce qui s'est dit.

Une PME camerounaise ne perd pas ses clients par manque de marché, elle les
perd par silence. Ce fichier tient trois promesses : une relance a une raison,
un devis ouvre tout seul une reprise quelques jours plus tard, et un client
sans nouvelles depuis trop longtemps remonte de lui-même.
"""

from datetime import date, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..messages import refus
from ..models import Client, Echange, Entreprise, Relance, SEGMENTS, TYPES_ECHANGE, User
from ..schemas import (
    ClientCorrection,
    ClientEntree,
    EchangeEntree,
    RelanceDeplacement,
    RelanceEntree,
)
from ..utils import aujourdhui, maintenant
from . import present

# Après un devis, on reprend des nouvelles : la relance pousse toute seule.
# Elle ne porte aucune phrase : seule l'origine « devis » est enregistrée, et
# c'est l'écran qui la dit dans la langue choisie.
COMMANDE = "commande"
SILENCE_MAX = 365


def clients(db: Session, entreprise_id: int) -> list[Client]:
    return list(
        db.scalars(
            select(Client)
            .where(Client.entreprise_id == entreprise_id)
            .order_by(Client.nom)
        ).all()
    )


def client_de(db: Session, entreprise: Entreprise, client_id: int) -> Client:
    client = db.get(Client, client_id)
    if client is None or client.entreprise_id != entreprise.id:
        raise refus("client_inconnu", 404)
    return client


def ajouter_client(db: Session, entreprise: Entreprise, entree: ClientEntree) -> Client:
    nom = entree.nom.strip()
    if entree.telephone:
        prise = db.scalar(
            select(Client.id).where(
                Client.entreprise_id == entreprise.id,
                Client.telephone == entree.telephone,
            )
        )
        if prise is not None:
            raise refus("meme_telephone")
    client = Client(
        entreprise_id=entreprise.id,
        nom=nom,
        telephone=entree.telephone,
        email=entree.email.strip(),
        quartier=entree.quartier.strip(),
        segment=entree.segment,
        note=entree.note.strip(),
    )
    db.add(client)
    db.flush()
    db.commit()
    db.refresh(client)
    return client


def corriger_client(
    db: Session, entreprise: Entreprise, client_id: int, entree: ClientCorrection
) -> Client:
    client = client_de(db, entreprise, client_id)
    if entree.telephone is not None and entree.telephone != client.telephone:
        if entree.telephone:
            prise = db.scalar(
                select(Client.id).where(
                    Client.entreprise_id == entreprise.id,
                    Client.telephone == entree.telephone,
                    Client.id != client.id,
                )
            )
            if prise is not None:
                raise refus("meme_telephone")
        client.telephone = entree.telephone
    if entree.nom is not None:
        client.nom = entree.nom.strip()
    if entree.email is not None:
        client.email = entree.email.strip()
    if entree.quartier is not None:
        client.quartier = entree.quartier.strip()
    if entree.segment is not None:
        client.segment = entree.segment
    if entree.note is not None:
        client.note = entree.note.strip()
    if entree.actif is not None:
        client.actif = entree.actif
    db.commit()
    db.refresh(client)
    return client


def enregistrer_echange(
    db: Session,
    entreprise: Entreprise,
    client_id: int,
    entree: EchangeEntree,
    compte: User,
) -> Echange:
    """La ligne du journal. Un devis non suivi fait pousser une relance."""
    client = client_de(db, entreprise, client_id)
    if not client.actif:
        raise refus("client_sorti")
    if entree.type not in TYPES_ECHANGE:
        raise refus("type_inconnu")

    moment = _moment(entree.jour)
    echange = Echange(
        client_id=client.id,
        user_id=compte.id,
        type=entree.type,
        note=entree.note.strip(),
        montant=entree.montant,
        moment=moment,
    )
    db.add(echange)

    if entree.type == "devis" and relance_en_attente(db, client) is None:
        db.add(
            Relance(
                client_id=client.id,
                user_id=compte.id,
                origine="devis",
                due_le=moment.date() + timedelta(days=entreprise.rappel_jours),
            )
        )
    db.commit()
    db.refresh(echange)
    return echange


def _moment(jour: date | None) -> datetime:
    """L'horodatage suit la date dite, à onze heures du matin sinon."""
    if jour is None:
        return maintenant().replace(microsecond=0)
    return datetime(jour.year, jour.month, jour.day, 11, 0, 0)


def relance_en_attente(db: Session, client: Client) -> Relance | None:
    dues = [un for un in client.relances if un.statut == "a_faire"]
    if not dues:
        return None
    return min(dues, key=lambda un: un.due_le)


def programmer(
    db: Session,
    entreprise: Entreprise,
    client_id: int,
    entree: RelanceEntree,
    compte: User,
) -> Relance:
    client = client_de(db, entreprise, client_id)
    if not client.actif:
        raise refus("client_sorti")
    if not client.telephone:
        raise refus("client_sans_numero")
    motif = entree.motif.strip()
    if len(motif) < 3:
        raise refus("relance_sans_motif")
    relance = Relance(
        client_id=client.id,
        user_id=compte.id,
        motif=motif,
        due_le=entree.due_le or aujourdhui(),
        note=entree.note.strip(),
    )
    db.add(relance)
    db.commit()
    db.refresh(relance)
    return relance


def terminer(
    db: Session, entreprise: Entreprise, relance_id: int, compte: User, note: str = ""
) -> Relance:
    relance = _relance_de(db, entreprise, relance_id)
    if relance.statut == "faite":
        raise refus("relance_deja_faite")
    relance.statut = "faite"
    relance.faite_le = aujourdhui()
    if note.strip():
        relance.note = note.strip()
    relance.user_id = compte.id
    db.commit()
    db.refresh(relance)
    return relance


def replacer(
    db: Session, entreprise: Entreprise, relance_id: int, entree: RelanceDeplacement
) -> Relance:
    relance = _relance_de(db, entreprise, relance_id)
    if relance.statut == "faite":
        raise refus("relance_deja_faite")
    relance.due_le = entree.due_le
    db.commit()
    db.refresh(relance)
    return relance


def _relance_de(db: Session, entreprise: Entreprise, relance_id: int) -> Relance:
    relance = db.get(Relance, relance_id)
    if relance is None or relance.client.entreprise_id != entreprise.id:
        raise refus("relance_inconnue", 404)
    return relance


def relances_du_jour(db: Session, entreprise: Entreprise) -> list[Relance]:
    """Ce qui est dû, en retard compris, du plus ancien au plus récent."""
    hoje = aujourdhui()
    return list(
        db.scalars(
            select(Relance)
            .join(Client, Relance.client_id == Client.id)
            .where(
                Client.entreprise_id == entreprise.id,
                Relance.statut == "a_faire",
                Relance.due_le <= hoje,
                Client.actif.is_(True),
            )
            .order_by(Relance.due_le)
        ).all()
    )


def relances_avenir(db: Session, entreprise: Entreprise) -> list[Relance]:
    hoje = aujourdhui()
    return list(
        db.scalars(
            select(Relance)
            .join(Client, Relance.client_id == Client.id)
            .where(
                Client.entreprise_id == entreprise.id,
                Relance.statut == "a_faire",
                Relance.due_le > hoje,
                Client.actif.is_(True),
            )
            .order_by(Relance.due_le)
        ).all()
    )


def silencie(db: Session, entreprise: Entreprise) -> list[Client]:
    """Les clients sans nouvelles depuis trop longtemps, ou jamais relancés.

    Un client sans numéro en sort : on ne peut pas le rappeler, et le
    mêler aux autres ferait croire à un oubli là où il n'y a rien à faire.
    """
    seuil = min(max(entreprise.silence_jours, 1), SILENCE_MAX)
    limite = maintenant() - timedelta(days=seuil)
    lignes = db.scalars(
        select(Client).where(
            Client.entreprise_id == entreprise.id,
            Client.actif.is_(True),
            Client.telephone != "",
        )
    ).all()
    oublies = [
        un
        for un in lignes
        if not un.echanges or max(echange.moment for echange in un.echanges) < limite
    ]
    return sorted(oublies, key=lambda un: un.nom)


def rechercher(
    db: Session, entreprise: Entreprise, texte: str, segment: str = ""
) -> list[Client]:
    mot = texte.strip().lower()
    lignes = clients(db, entreprise.id)
    if segment:
        lignes = [un for un in lignes if un.segment == segment]
    if not mot:
        return lignes
    return [
        un
        for un in lignes
        if mot in un.nom.lower()
        or mot in un.telephone.replace(" ", "")
        or mot in (un.quartier or "").lower()
        or mot in (un.note or "").lower()
    ]


def etat(db: Session, entreprise: Entreprise) -> dict:
    """La vitre du gérant : des nombres, aucun commentaire."""
    hoje = aujourdhui()
    limite = maintenant() - timedelta(days=30)
    lignes = clients(db, entreprise.id)
    actifs = [un for un in lignes if un.actif]
    joignables = [un for un in actifs if un.telephone]

    echanges = db.scalars(
        select(Echange)
        .join(Client, Echange.client_id == Client.id)
        .where(Client.entreprise_id == entreprise.id, Echange.moment >= limite)
    ).all()
    commandes = sum(un.montant for un in echanges if un.type == COMMANDE)
    devis = sum(1 for un in echanges if un.type == "devis")

    dues = relances_du_jour(db, entreprise)
    retards = [un for un in dues if un.due_le < hoje]

    segments = {
        cle: sum(1 for un in actifs if un.segment == cle) for cle in SEGMENTS
    }

    return {
        "entreprise_id": entreprise.id,
        "jour": hoje.isoformat(),
        "clients": len(lignes),
        "actifs": len(actifs),
        "joignables": len(joignables),
        "echanges_30j": len(echanges),
        "devis_30j": devis,
        "commandes_30j": commandes,
        "relances_dues": len(dues),
        "relances_en_retard": len(retards),
        "silence_seuil": entreprise.silence_jours,
        "silencie": len(silencie(db, entreprise)),
        "segments": segments,
        "dernier_echange": max(
            (un.moment.isoformat() for un in echanges), default=None
        ),
    }


def carnet(db: Session, entreprise: Entreprise) -> dict:
    lignes = clients(db, entreprise.id)
    return {
        "total": len(lignes),
        "actifs": sum(1 for un in lignes if un.actif),
        "joignables": sum(1 for un in lignes if un.actif and un.telephone),
        "clients": [
            present.client_dict(un) for un in sorted(lignes, key=lambda un: un.nom)
        ],
    }




def contact_publique(db: Session, entreprise: Entreprise, entree) -> dict:
    """Le prospect qui écrit sans compte : fiche créée ou reprise, et le
    contact rangé dans le journal. Une relance est programmée pour que
    l'équipe rappelle - c'est tout l'intérêt du carnet.
    """
    canonique = entree.telephone
    client = db.scalar(
        select(Client).where(
            Client.entreprise_id == entreprise.id,
            Client.telephone == canonique,
        )
    )
    if client is None:
        client = Client(
            entreprise_id=entreprise.id,
            nom=entree.nom.strip(),
            telephone=canonique,
            quartier=entree.quartier.strip(),
            segment="particulier",
        )
        db.add(client)
        db.flush()
    elif not client.actif:
        client.actif = True

    note = f"[formulaire] {entree.besoin.strip()}"
    db.add(
        Echange(
            client_id=client.id,
            type="formulaire",
            note=note,
            moment=maintenant().replace(microsecond=0),
        )
    )
    if relance_en_attente(db, client) is None:
        db.add(
            Relance(
                client_id=client.id,
                motif=f"Rappeler {client.nom} (formulaire public)",
                due_le=aujourdhui() + timedelta(days=1),
                origine="manuel",
            )
        )
    db.commit()
    return {
        "ok": True,
        "reference": client.id,
        "entreprise": entreprise_dict_publique(entreprise),
    }


def entreprise_dict_publique(entreprise: Entreprise) -> dict:
    """Ce que la page publique montre : la maison, son numéro, rien d'autre."""
    from ..utils import affiche_telephone

    return {
        "nom": entreprise.nom,
        "ville": entreprise.ville,
        "quartier": entreprise.quartier,
        "secteur": entreprise.secteur,
        "telephone": entreprise.telephone,
        "telephone_display": affiche_telephone(entreprise.telephone),
    }
