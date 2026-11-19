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
from .utils import aujourdhui
from .utils import maintenant

FREQUENCES = ("hebdo", "quinzaine", "mensuel")
STATUTS_TOUR = ("a_venir", "en_cours", "tire", "remis")
ROLES = ("responsable", "tresorier", "membre")


class Groupe(Base):
    """Le cercle : qui cotise, à quel rythme, combien, et dans quel ordre."""

    __tablename__ = "groupes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(160))
    ville: Mapped[str] = mapped_column(String(60), default="Douala")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    frequence: Mapped[str] = mapped_column(String(12), default="mensuel")
    jour_ancre: Mapped[int] = mapped_column(Integer, default=5)
    cotisation: Mapped[int] = mapped_column(Integer, default=10_000)
    penalite: Mapped[int] = mapped_column(Integer, default=500)
    telephone: Mapped[str] = mapped_column(String(24), default="")
    mot_du_groupe: Mapped[str] = mapped_column(Text, default="")
    abonnement_mensuel: Mapped[int] = mapped_column(Integer, default=5_000)
    momo_actif: Mapped[bool] = mapped_column(Boolean, default=True)
    orange_actif: Mapped[bool] = mapped_column(Boolean, default=True)
    especes_actifs: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=maintenant)

    membres: Mapped[list[Membre]] = relationship(
        back_populates="groupe", cascade="all, delete-orphan"
    )
    tours: Mapped[list[Tour]] = relationship(
        back_populates="groupe", cascade="all, delete-orphan"
    )
    comptes: Mapped[list[User]] = relationship(back_populates="groupe")


class User(Base):
    """Une main du cercle : le responsable, la trésorière, un membre qui consulte."""

    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("email", name="uq_user_email"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    groupe_id: Mapped[int] = mapped_column(ForeignKey("groupes.id"))
    nom: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(160))
    mot_de_passe: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(16), default="tresorier")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=maintenant)

    groupe: Mapped[Groupe] = relationship(back_populates="comptes")


class Membre(Base):
    """Une personne qui cotise. Sa part peut peser plus lourd (deux têtes)."""

    __tablename__ = "membres"
    __table_args__ = (UniqueConstraint("groupe_id", "nom", name="uq_membre_nom"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    groupe_id: Mapped[int] = mapped_column(ForeignKey("groupes.id"))
    nom: Mapped[str] = mapped_column(String(120))
    telephone: Mapped[str] = mapped_column(String(24), default="")
    part: Mapped[int] = mapped_column(Integer, default=1)
    actif: Mapped[bool] = mapped_column(Boolean, default=True)
    entree_le: Mapped[date] = mapped_column(Date, default=aujourdhui)
    note: Mapped[str] = mapped_column(String(400), default="")

    groupe: Mapped[Groupe] = relationship(back_populates="membres")
    cotisations: Mapped[list[Cotisation]] = relationship(
        back_populates="membre", cascade="all, delete-orphan"
    )


class Tour(Base):
    """Un tour de pot : une date, un gagnant tiré, un pot à remettre."""

    __tablename__ = "tours"
    __table_args__ = (UniqueConstraint("groupe_id", "numero", name="uq_tour_numero"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    groupe_id: Mapped[int] = mapped_column(ForeignKey("groupes.id"))
    numero: Mapped[int] = mapped_column(Integer)
    date_prevue: Mapped[date] = mapped_column(Date)
    date_tirage: Mapped[date | None] = mapped_column(Date, default=None)
    gagnant_id: Mapped[int | None] = mapped_column(ForeignKey("membres.id"), default=None)
    montant_pot: Mapped[int] = mapped_column(Integer, default=0)
    statut: Mapped[str] = mapped_column(String(12), default="a_venir")
    graine: Mapped[str] = mapped_column(String(40), default="")
    note: Mapped[str] = mapped_column(String(400), default="")

    groupe: Mapped[Groupe] = relationship(back_populates="tours")
    gagnant: Mapped[Membre | None] = relationship()
    cotisations: Mapped[list[Cotisation]] = relationship(
        back_populates="tour", cascade="all, delete-orphan"
    )
    remise: Mapped[Remise | None] = relationship(
        back_populates="tour", uselist=False, cascade="all, delete-orphan"
    )


class Cotisation(Base):
    """La part due par un membre pour un tour, et ce qui est réellement rentré."""

    __tablename__ = "cotisations"
    __table_args__ = (UniqueConstraint("tour_id", "membre_id", name="uq_cotisation"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    tour_id: Mapped[int] = mapped_column(ForeignKey("tours.id"))
    membre_id: Mapped[int] = mapped_column(ForeignKey("membres.id"))
    montant_attendu: Mapped[int] = mapped_column(Integer, default=0)
    montant_paye: Mapped[int] = mapped_column(Integer, default=0)
    payee_le: Mapped[date | None] = mapped_column(Date, default=None)
    mode: Mapped[str] = mapped_column(String(16), default="")
    penalite: Mapped[int] = mapped_column(Integer, default=0)
    reference: Mapped[str] = mapped_column(String(24), default="")

    tour: Mapped[Tour] = relationship(back_populates="cotisations")
    membre: Mapped[Membre] = relationship(back_populates="cotisations")


class Remise(Base):
    """Le reçu de remise du pot. Son jeton se vérifie sans compte."""

    __tablename__ = "remises"

    id: Mapped[int] = mapped_column(primary_key=True)
    tour_id: Mapped[int] = mapped_column(ForeignKey("tours.id"))
    groupe_id: Mapped[int] = mapped_column(ForeignKey("groupes.id"))
    membre_id: Mapped[int] = mapped_column(ForeignKey("membres.id"))
    montant: Mapped[int] = mapped_column(Integer, default=0)
    moment: Mapped[datetime] = mapped_column(DateTime, default=maintenant)
    jeton: Mapped[str] = mapped_column(String(16), default="")
    temoin: Mapped[str] = mapped_column(String(120), default="")
    mode: Mapped[str] = mapped_column(String(16), default="especes")
    note: Mapped[str] = mapped_column(String(400), default="")

    tour: Mapped[Tour] = relationship(back_populates="remise")
    membre: Mapped[Membre] = relationship()
