from __future__ import annotations

import random
from datetime import date, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Client, Echange, Entreprise, Relance, User
from ..security import hash_password
from ..utils import maintenant

RESPONSABLE = {"email": "kelly@etsmama.cm", "mot_de_passe": "Carnet2026!"}
VENDEUR = {"email": "yves@etsmama.cm", "mot_de_passe": "Carnet2026!"}

# Une distributeur de Mboppi : des revendards du quartier, deux institutions,
# un client sans numéro, et une fiche sortie du carnet. Les numéros couvrent
# les trois réseaux, parce qu'un carnet qui ne sait pas qui est joignable ne
# sert à rien.
ENTREPRISE = {
    "nom": "Ets Mama Kelly Négoce",
    "ville": "Douala",
    "quartier": "Mboppi",
    "secteur": "distributeur vivres et boissons",
    "telephone": "+237699440011",
    "silence_jours": 45,
    "rappel_jours": 7,
}

CLIENTS = (
    # (nom, téléphone, quartier, segment, note)
    ("Alim Tidiani", "+237699114477", "New-Bell", "revendeur", "paye cash, vient le samedi"),
    ("Bella Chéride", "+237677123456", "Bonabéri", "particulier", ""),
    ("Cama-Élec SARL", "+237233425566", "Bonapriso", "institution", "facture à 30 jours"),
    ("Dauguet Marcel", "+237655889221", "Ndokoti", "particulier", "commande pour les mariages"),
    ("Ebox Ndongue", "+237691220055", "Makele", "revendeur", "dépôt de quartier"),
    ("Félicité Ondoua", "+237670998811", "Deido", "grossiste", "prend dix cartons à la fois"),
    ("Globus Pharma", "+237683445599", "Akwa", "institution", ""),
    ("Hermann Nkodo", "+237660223344", "Ngaoundéré", "particulier", "livraison par car"),
    ("Imako Beauté", "+237696776611", "Mboppi", "revendeur", "voisine, paie en fin de mois"),
    ("Jean-Bertrand Ossé", "+237659001144", "Yopé", "particulier", ""),
    ("Kola Supply", "+237650113355", "Bassa", "grossiste", "demande toujours un devis avant"),
    ("Liloute Prudence", "+237675223388", "Nlongkak", "particulier", "deux commandes par mois"),
    ("Résidence Bonanjo", "", "Bonanjo", "institution", "joignable par courriel seulement"),
    ("Serge Batoum", "+237678112299", "Logbessou", "particulier", "a quitté le quartier"),
)

TYPES = ("appel", "whatsapp", "visite", "sms", "devis", "commande", "reclamation")
MOTIFS = (
    "Demander le prix du sac de riz",
    "Livraison reportée",
    "Relancer le devis de la boutique",
    "Proposer la palette à 12",
    "Nouvelle livraison d'eau",
)


def seed_database(db: Session) -> bool:
    """Un carnet garni pour la démonstration. Faux si le cahier existe déjà."""
    if db.scalar(select(func.count(Entreprise.id))):
        return False

    alea = random.Random(20_261_109)
    entreprise = Entreprise(**ENTREPRISE)
    db.add(entreprise)
    db.flush()

    kelly = User(
        entreprise_id=entreprise.id,
        nom="Kelly Ndongo",
        email=RESPONSABLE["email"],
        mot_de_passe=hash_password(RESPONSABLE["mot_de_passe"]),
        role="responsable",
    )
    yves = User(
        entreprise_id=entreprise.id,
        nom="Yves Maboukna",
        email=VENDEUR["email"],
        mot_de_passe=hash_password(VENDEUR["mot_de_passe"]),
        role="vendeur",
    )
    db.add_all([kelly, yves])
    db.flush()

    vendeurs = [kelly, yves]
    clients = _clients(db, entreprise)
    _journal(db, clients, vendeurs, alea)
    _relances(db, clients, vendeurs, alea)
    db.commit()
    return True


def _clients(db: Session, entreprise: Entreprise) -> list[Client]:
    lignes = []
    for index, (nom, telephone, quartier, segment, note) in enumerate(CLIENTS):
        lignes.append(
            Client(
                entreprise_id=entreprise.id,
                nom=nom,
                telephone=telephone,
                email=("" if segment != "institution" else f"contact@{nom.split()[0].lower().replace('-', '')}.cm"),
                quartier=quartier,
                segment=segment,
                note=note,
                actif=nom != "Serge Batoum",
                cree_le=date.today() - timedelta(days=420 - index * 25),
            )
        )
    db.add_all(lignes)
    db.flush()
    return lignes


def _journal(db: Session, clients: list[Client], vendeurs: list[User], alea) -> None:
    """Ce qui s'est dit dans les quatre derniers mois.

    Deux clients restent volontairement muets : c'est ce trou que l'écran des
    silencieus doit montrer, sinon la promesse n'est pas vérifiable.
    """
    muets = {"Résidence Bonanjo", "Bella Chéride"}
    for client in clients:
        if client.nom in muets:
            continue
        dernier_jour = alea.randint(2, 120)
        for _ in range(alea.randint(1, 5)):
            type_ = alea.choice(TYPES)
            moment = maintenant() - timedelta(
                days=dernier_jour, hours=alea.randint(0, 9), minutes=alea.randint(0, 59)
            )
            montant = 0
            if type_ in ("devis", "commande"):
                montant = alea.choice([15_000, 25_000, 45_000, 120_000, 250_000])
            db.add(
                Echange(
                    client_id=client.id,
                    user_id=alea.choice(vendeurs).id,
                    type=type_,
                    note=_note(type_, client),
                    moment=moment.replace(microsecond=0),
                    montant=montant,
                )
            )
            dernier_jour = max(0, dernier_jour - alea.randint(4, 30))


def _note(type_: str, client: Client) -> str:
    if type_ == "devis":
        return "Devis remis pour la prochaine livraison"
    if type_ == "commande":
        return "Commande passée au comptoir"
    if type_ == "reclamation":
        return "Retard de livraison signalé"
    if type_ == "visite":
        return f"Passe au dépôt de {client.quartier}"
    return ""


def _relances(db: Session, clients: list[Client], vendeurs: list[User], alea) -> None:
    hoje = date.today()
    dues = [un for un in clients if un.actif and un.telephone][:9]

    for index, client in enumerate(dues):
        if index < 3:
            due = hoje - timedelta(days=index + 2)  # en retard
        elif index < 5:
            due = hoje  # dû aujourd'hui
        else:
            due = hoje + timedelta(days=(index - 3) * 3)  # à venir
        db.add(
            Relance(
                client_id=client.id,
                user_id=alea.choice(vendeurs).id,
                motif=alea.choice(MOTIFS),
                origine="manuel",
                due_le=due,
            )
        )

    # Une relance déjà close et une relance née d'un devis : les deux voies
    # d'écriture du carnet, visibles dès la démonstration.
    db.add(
        Relance(
            client_id=dues[0].id,
            user_id=vendeurs[0].id,
            motif="Prix du sac de riz",
            due_le=hoje - timedelta(days=12),
            statut="faite",
            faite_le=hoje - timedelta(days=11),
        )
    )
    devis = next(un for un in clients if un.nom == "Kola Supply")
    db.add(
        Relance(
            client_id=devis.id,
            user_id=vendeurs[1].id,
            motif="",
            origine="devis",
            due_le=hoje + timedelta(days=ENTREPRISE["rappel_jours"]),
        )
    )
