from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base
from .utils import maintenant


class Ecole(Base):
    """L'établissement : une école privée, son calendrier et ses rails de caisse."""

    __tablename__ = "ecoles"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(160))
    sigle: Mapped[str] = mapped_column(String(24), default="")
    genre: Mapped[str] = mapped_column(String(24), default="primaire")
    ville: Mapped[str] = mapped_column(String(60), default="Douala")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    direction: Mapped[str] = mapped_column(String(80), default="")
    comptable: Mapped[str] = mapped_column(String(80), default="")
    telephone: Mapped[str] = mapped_column(String(24), default="")
    date_rentree: Mapped[date] = mapped_column(Date, default=date.today)
    fin_annee: Mapped[date] = mapped_column(Date, default=date.today)
    abonnement: Mapped[int] = mapped_column(Integer, default=15_000)
    relance_avance: Mapped[int] = mapped_column(Integer, default=7)
    tolerance_retard: Mapped[int] = mapped_column(Integer, default=21)
    ton: Mapped[str] = mapped_column(String(16), default="courtois")
    mention_recu: Mapped[str] = mapped_column(Text, default="")
    whatsapp_actif: Mapped[bool] = mapped_column(Boolean, default=True)
    sms_actif: Mapped[bool] = mapped_column(Boolean, default=False)
    especes_actifs: Mapped[bool] = mapped_column(Boolean, default=True)
    momo_actif: Mapped[bool] = mapped_column(Boolean, default=True)
    orange_actif: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=maintenant)

    classes: Mapped[list[Classe]] = relationship(back_populates="ecole")
    eleves: Mapped[list[Eleve]] = relationship(
        back_populates="ecole", cascade="all, delete-orphan"
    )
    membres: Mapped[list[User]] = relationship(back_populates="ecole")


class User(Base):
    """Une main dans la caisse : la directrice, le comptable, la surveillante."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    ecole_id: Mapped[int] = mapped_column(ForeignKey("ecoles.id"))
    nom: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(160), unique=True)
    mot_de_passe: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(24), default="comptable")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=maintenant)

    ecole: Mapped[Ecole] = relationship(back_populates="membres")


class Classe(Base):
    """Une classe de l'école, avec son titulaire et son barème de l'année."""

    __tablename__ = "classes"
    __table_args__ = (UniqueConstraint("ecole_id", "label", "annee"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    ecole_id: Mapped[int] = mapped_column(ForeignKey("ecoles.id"))
    label: Mapped[str] = mapped_column(String(40))
    niveau: Mapped[int] = mapped_column(Integer, default=1)
    salle: Mapped[str] = mapped_column(String(40), default="")
    titulaire: Mapped[str] = mapped_column(String(120), default="")
    effectif_max: Mapped[int] = mapped_column(Integer, default=45)
    annee: Mapped[str] = mapped_column(String(12))
    scolarite: Mapped[int] = mapped_column(Integer, default=0)
    cantine: Mapped[int] = mapped_column(Integer, default=0)
    transport: Mapped[int] = mapped_column(Integer, default=0)
    autres: Mapped[int] = mapped_column(Integer, default=0)
    tranches: Mapped[int] = mapped_column(Integer, default=3)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=maintenant)

    ecole: Mapped[Ecole] = relationship(back_populates="classes")
    eleves: Mapped[list[Eleve]] = relationship(back_populates="classe")


class Eleve(Base):
    """Un élève inscrit, sa famille joignable et son statut de caisse."""

    __tablename__ = "eleves"

    id: Mapped[int] = mapped_column(primary_key=True)
    ecole_id: Mapped[int] = mapped_column(ForeignKey("ecoles.id"))
    classe_id: Mapped[int | None] = mapped_column(ForeignKey("classes.id"))
    matricule: Mapped[str] = mapped_column(String(24))
    prenoms: Mapped[str] = mapped_column(String(120))
    nom: Mapped[str] = mapped_column(String(120))
    sexe: Mapped[str] = mapped_column(String(8), default="F")
    tuteur_nom: Mapped[str] = mapped_column(String(140), default="")
    tuteur_telephone: Mapped[str] = mapped_column(String(24), default="")
    tuteur_second: Mapped[str] = mapped_column(String(24), default="")
    tuteur_lien: Mapped[str] = mapped_column(String(24), default="parent")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    statut: Mapped[str] = mapped_column(String(16), default="suivi")
    motif_statut: Mapped[str] = mapped_column(String(160), default="")
    note: Mapped[str] = mapped_column(Text, default="")
    date_entree: Mapped[date] = mapped_column(Date, default=date.today)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=maintenant)

    ecole: Mapped[Ecole] = relationship(back_populates="eleves")
    classe: Mapped[Classe | None] = relationship(back_populates="eleves")
    engagements: Mapped[list[Engagement]] = relationship(
        back_populates="eleve", cascade="all, delete-orphan"
    )
    paiements: Mapped[list[Paiement]] = relationship(
        back_populates="eleve", cascade="all, delete-orphan"
    )


class Engagement(Base):
    """Ce qu'une famille doit pour une année, raboté de sa remise s'il y en a."""

    __tablename__ = "engagements"
    __table_args__ = (UniqueConstraint("eleve_id", "annee"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    ecole_id: Mapped[int] = mapped_column(ForeignKey("ecoles.id"))
    eleve_id: Mapped[int] = mapped_column(ForeignKey("eleves.id"))
    annee: Mapped[str] = mapped_column(String(12))
    scolarite: Mapped[int] = mapped_column(Integer, default=0)
    cantine: Mapped[int] = mapped_column(Integer, default=0)
    transport: Mapped[int] = mapped_column(Integer, default=0)
    autres: Mapped[int] = mapped_column(Integer, default=0)
    remise: Mapped[int] = mapped_column(Integer, default=0)
    motif_remise: Mapped[str] = mapped_column(String(120), default="")
    tranches: Mapped[int] = mapped_column(Integer, default=3)
    solde_compte: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=maintenant)

    eleve: Mapped[Eleve] = relationship(back_populates="engagements")
    echeances: Mapped[list[Echeance]] = relationship(
        back_populates="engagement",
        cascade="all, delete-orphan",
        order_by="Echeance.rang",
    )


class Echeance(Base):
    """Un terme du calendrier : une date, un montant, ce qui y est imputé."""

    __tablename__ = "echeances"
    __table_args__ = (UniqueConstraint("engagement_id", "rang"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    ecole_id: Mapped[int] = mapped_column(ForeignKey("ecoles.id"))
    engagement_id: Mapped[int] = mapped_column(ForeignKey("engagements.id"))
    rang: Mapped[int] = mapped_column(Integer, default=1)
    libelle: Mapped[str] = mapped_column(String(60), default="")
    due: Mapped[date] = mapped_column(Date)
    montant: Mapped[int] = mapped_column(Integer, default=0)
    impute: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=maintenant)

    engagement: Mapped[Engagement] = relationship(back_populates="echeances")
    imputations: Mapped[list[Imputation]] = relationship(
        back_populates="echeance", cascade="all, delete-orphan"
    )


class Paiement(Base):
    """Une entrée de caisse, au guichet ou sur un wallet MoMo."""

    __tablename__ = "paiements"

    id: Mapped[int] = mapped_column(primary_key=True)
    ecole_id: Mapped[int] = mapped_column(ForeignKey("ecoles.id"))
    eleve_id: Mapped[int] = mapped_column(ForeignKey("eleves.id"))
    montant: Mapped[int] = mapped_column(Integer)
    mode: Mapped[str] = mapped_column(String(24), default="especes")
    reference: Mapped[str] = mapped_column(String(40), default="")
    encaisse_par: Mapped[str] = mapped_column(String(120), default="")
    moment: Mapped[datetime] = mapped_column(DateTime, default=maintenant)
    annule: Mapped[bool] = mapped_column(Boolean, default=False)
    motif_annulation: Mapped[str] = mapped_column(String(160), default="")
    note: Mapped[str] = mapped_column(Text, default="")

    eleve: Mapped[Eleve] = relationship(back_populates="paiements")
    imputations: Mapped[list[Imputation]] = relationship(
        back_populates="paiement", cascade="all, delete-orphan"
    )
    recu: Mapped[Recu | None] = relationship(
        back_populates="paiement", uselist=False
    )


class Imputation(Base):
    """Le lien entre un encaissement et le terme qu'il éteint, partielement."""

    __tablename__ = "imputations"

    id: Mapped[int] = mapped_column(primary_key=True)
    ecole_id: Mapped[int] = mapped_column(ForeignKey("ecoles.id"))
    paiement_id: Mapped[int] = mapped_column(ForeignKey("paiements.id"))
    echeance_id: Mapped[int] = mapped_column(ForeignKey("echeances.id"))
    montant: Mapped[int] = mapped_column(Integer)

    paiement: Mapped[Paiement] = relationship(back_populates="imputations")
    echeance: Mapped[Echeance] = relationship(back_populates="imputations")


class Recu(Base):
    """Le papier (et le message) qui prouve que l'argent est rentré."""

    __tablename__ = "recus"

    id: Mapped[int] = mapped_column(primary_key=True)
    ecole_id: Mapped[int] = mapped_column(ForeignKey("ecoles.id"))
    paiement_id: Mapped[int] = mapped_column(ForeignKey("paiements.id"))
    numero: Mapped[str] = mapped_column(String(24), unique=True)
    jeton: Mapped[str] = mapped_column(String(16), unique=True)
    emission: Mapped[datetime] = mapped_column(DateTime, default=maintenant)
    destinataire: Mapped[str] = mapped_column(String(24), default="")
    corps: Mapped[str] = mapped_column(Text, default="")
    canal: Mapped[str] = mapped_column(String(16), default="whatsapp")
    statut: Mapped[str] = mapped_column(String(16), default="envoye")
    reference: Mapped[str] = mapped_column(String(24), default="")

    paiement: Mapped[Paiement] = relationship(back_populates="recu")


class Relance(Base):
    """Le rappel programmé avant ou après une échéance non tenue."""

    __tablename__ = "relances"

    id: Mapped[int] = mapped_column(primary_key=True)
    ecole_id: Mapped[int] = mapped_column(ForeignKey("ecoles.id"))
    eleve_id: Mapped[int] = mapped_column(ForeignKey("eleves.id"))
    echeance_id: Mapped[int] = mapped_column(ForeignKey("echeances.id"))
    palier: Mapped[int] = mapped_column(Integer, default=0)
    libelle: Mapped[str] = mapped_column(String(40), default="")
    programme: Mapped[date] = mapped_column(Date)
    envoyee: Mapped[bool] = mapped_column(Boolean, default=False)
    annulee: Mapped[bool] = mapped_column(Boolean, default=False)
    canal: Mapped[str] = mapped_column(String(16), default="whatsapp")
    corps: Mapped[str] = mapped_column(Text, default="")
    reference: Mapped[str] = mapped_column(String(24), default="")
    envoyee_le: Mapped[datetime | None] = mapped_column(DateTime)

    eleve: Mapped[Eleve] = relationship()
    echeance: Mapped[Echeance] = relationship()


class Journee(Base):
    """La déclaration du soir : ce que la caisse dit avoir en main."""

    __tablename__ = "journees"
    __table_args__ = (UniqueConstraint("ecole_id", "jour"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    ecole_id: Mapped[int] = mapped_column(ForeignKey("ecoles.id"))
    jour: Mapped[date] = mapped_column(Date)
    fond: Mapped[int] = mapped_column(Integer, default=0)
    comptage: Mapped[int] = mapped_column(Integer, default=0)
    tenu_par: Mapped[str] = mapped_column(String(120), default="")
    note: Mapped[str] = mapped_column(Text, default="")
    declaree: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=maintenant)
