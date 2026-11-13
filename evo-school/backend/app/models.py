from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base
from .utils import maintenant


def _maintenant_naif() -> datetime:
    """Une horodatée naïve en UTC : `datetime.utcnow` est déprécié."""
    return maintenant()

# Frais scolaires : l'école, ses classes, ses élèves, ses versements.
# Le montant attendu se fige sur la fiche de l'élève ; le reste se calcule
# à la lecture. Chaque versement porte un code de reçu vérifiable sans compte.

ROLES = ("responsable", "comptable")
MOYENS = ("especes", "mtn_money", "orange_money", "nexttel_money", "virement", "autre")


class Organisation(Base):
    """L'école qui tient le cahier des frais."""

    __tablename__ = "organisations"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(160))
    ville: Mapped[str] = mapped_column(String(60), default="Douala")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    telephone: Mapped[str] = mapped_column(String(24), default="")

    classes: Mapped[list[Classe]] = relationship(
        back_populates="organisation", cascade="all", lazy="selectin"
    )
    eleves: Mapped[list[Eleve]] = relationship(
        back_populates="organisation", cascade="all", lazy="selectin"
    )
    users: Mapped[list[User]] = relationship(back_populates="organisation", lazy="selectin")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    nom: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(160), unique=True)
    mot_de_passe: Mapped[str] = mapped_column(String(300))
    role: Mapped[str] = mapped_column(String(16), default="comptable")

    organisation: Mapped[Organisation] = relationship(back_populates="users")


class Classe(Base):
    """Une classe : son nom, son titulaire, ses frais de scolarité."""

    __tablename__ = "classes"

    __table_args__ = (
        UniqueConstraint("organisation_id", "nom", name="uq_classe_nom"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    nom: Mapped[str] = mapped_column(String(80))
    titulaire: Mapped[str] = mapped_column(String(120), default="")
    frais_annuels: Mapped[int] = mapped_column(Integer, default=50000)
    actif: Mapped[bool] = mapped_column(Boolean, default=True)
    note: Mapped[str] = mapped_column(Text, default="")

    organisation: Mapped[Organisation] = relationship(back_populates="classes")
    eleves: Mapped[list[Eleve]] = relationship(
        back_populates="classe", cascade="all", lazy="selectin"
    )


class Eleve(Base):
    """Un élève : sa classe, ses parents, son montant attendu pour l'année."""

    __tablename__ = "eleves"

    __table_args__ = (
        Index(
            "uq_eleve_matricule",
            "organisation_id",
            "matricule",
            unique=True,
            sqlite_where=text("matricule <> ''"),
        ),
        Index("ix_eleve_classe", "classe_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    classe_id: Mapped[int] = mapped_column(ForeignKey("classes.id"))
    nom: Mapped[str] = mapped_column(String(160))
    matricule: Mapped[str] = mapped_column(String(24), default="")
    parent_nom: Mapped[str] = mapped_column(String(160), default="")
    parent_telephone: Mapped[str] = mapped_column(String(24), default="")
    frais_attendu: Mapped[int] = mapped_column(Integer, default=50000)
    actif: Mapped[bool] = mapped_column(Boolean, default=True)
    note: Mapped[str] = mapped_column(Text, default="")

    organisation: Mapped[Organisation] = relationship(back_populates="eleves")
    classe: Mapped[Classe] = relationship(back_populates="eleves", lazy="joined")
    versements: Mapped[list[Versement]] = relationship(
        back_populates="eleve", cascade="all", lazy="selectin"
    )


class Versement(Base):
    """Un versement : son montant, son moyen, son reçu vérifiable."""

    __tablename__ = "versements"

    __table_args__ = (
        Index("ix_versement_eleve", "eleve_id"),
        Index("ix_versement_date", "date"),
        UniqueConstraint("organisation_id", "recu", name="uq_versement_recu"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"), index=True)
    eleve_id: Mapped[int] = mapped_column(ForeignKey("eleves.id"))
    montant: Mapped[int] = mapped_column(Integer, default=0)
    moyen: Mapped[str] = mapped_column(String(20), default="especes")
    date: Mapped[date] = mapped_column(Date, default=lambda: _aujourdhui())
    periode: Mapped[str] = mapped_column(String(7), default="")  # 2026-11 : le mois payé
    note: Mapped[str] = mapped_column(Text, default="")
    recu: Mapped[str] = mapped_column(String(16), default="")
    annule: Mapped[bool] = mapped_column(Boolean, default=False)
    cree_par: Mapped[int | None] = mapped_column(ForeignKey("users.id"), default=None)
    cree_le: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: _maintenant_naif()
    )

    organisation: Mapped[Organisation] = relationship()
    eleve: Mapped[Eleve] = relationship(back_populates="versements", lazy="joined")
    auteur: Mapped[User | None] = relationship("User", lazy="joined")


def _aujourdhui() -> date:
    from .utils import aujourdhui

    return aujourdhui()
