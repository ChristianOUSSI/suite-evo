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
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base
from .utils import maintenant


def _maintenant_naif() -> datetime:
    """Une horodatée naïve en UTC : `datetime.utcnow` est déprécié."""
    return maintenant()

# La clinique de quartier : ses patients, ses actes (consultations), ses
# encaissements. Le montant de l'acte se fige à l'écriture ; le reste du
# patient se calcule à la lecture. Chaque paiement porte un code de reçu
# vérifiable sans compte.

ROLES = ("responsable", "agent")
MOYENS = ("especes", "mtn_money", "orange_money", "nexttel_money", "virement", "assurance", "autre")
GROUPES = ("A+", "A-", "B+", "B-", "AB+", "AB-", "O+")


class Organisation(Base):
    """La clinique qui tient le registre."""

    __tablename__ = "organisations"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(160))
    ville: Mapped[str] = mapped_column(String(60), default="Douala")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    telephone: Mapped[str] = mapped_column(String(24), default="")

    patients: Mapped[list[Patient]] = relationship(
        back_populates="organisation", cascade="all", lazy="selectin"
    )
    actes: Mapped[list[Acte]] = relationship(
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
    role: Mapped[str] = mapped_column(String(16), default="agent")

    organisation: Mapped[Organisation] = relationship(back_populates="users")


class Patient(Base):
    """Un patient : son identité, son groupe, ses allergies, ses dettes."""

    __tablename__ = "patients"

    __table_args__ = (Index("ix_patient_org", "organisation_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    nom: Mapped[str] = mapped_column(String(160))
    telephone: Mapped[str] = mapped_column(String(24), default="")
    naissance: Mapped[str] = mapped_column(String(10), default="")  # AAAA-MM-JJ
    sexe: Mapped[str] = mapped_column(String(12), default="")
    groupe: Mapped[str] = mapped_column(String(4), default="")
    allergies: Mapped[str] = mapped_column(Text, default="")
    note: Mapped[str] = mapped_column(Text, default="")
    actif: Mapped[bool] = mapped_column(Boolean, default=True)

    organisation: Mapped[Organisation] = relationship(back_populates="patients")
    actes: Mapped[list[Acte]] = relationship(
        back_populates="patient", cascade="all", lazy="selectin"
    )
    paiements: Mapped[list[Paiement]] = relationship(
        back_populates="patient", cascade="all", lazy="selectin"
    )


class Acte(Base):
    """Un acte : la consultation du jour - motif, diagnostic, traitement, prix."""

    __tablename__ = "actes"

    __table_args__ = (Index("ix_acte_patient", "patient_id"), Index("ix_acte_date", "date"))

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"), index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"))
    date: Mapped[date] = mapped_column(Date, default=lambda: _aujourdhui())
    motif: Mapped[str] = mapped_column(String(160), default="")
    diagnostic: Mapped[str] = mapped_column(Text, default="")
    traitement: Mapped[str] = mapped_column(Text, default="")
    montant: Mapped[int] = mapped_column(Integer, default=0)
    annule: Mapped[bool] = mapped_column(Boolean, default=False)
    cree_par: Mapped[int | None] = mapped_column(ForeignKey("users.id"), default=None)
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=lambda: _maintenant_naif())

    organisation: Mapped[Organisation] = relationship(back_populates="actes")
    patient: Mapped[Patient] = relationship(back_populates="actes", lazy="joined")
    auteur: Mapped[User | None] = relationship("User", lazy="joined")


class Paiement(Base):
    """Un encaissement : son montant, son moyen, son reçu vérifiable."""

    __tablename__ = "paiements"

    __table_args__ = (
        Index("ix_paiement_patient", "patient_id"),
        Index("ix_paiement_date", "date"),
        UniqueConstraint("organisation_id", "recu", name="uq_paiement_recu"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"), index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"))
    acte_id: Mapped[int | None] = mapped_column(ForeignKey("actes.id"), default=None)
    montant: Mapped[int] = mapped_column(Integer, default=0)
    moyen: Mapped[str] = mapped_column(String(20), default="especes")
    date: Mapped[date] = mapped_column(Date, default=lambda: _aujourdhui())
    note: Mapped[str] = mapped_column(Text, default="")
    recu: Mapped[str] = mapped_column(String(16), default="")
    annule: Mapped[bool] = mapped_column(Boolean, default=False)
    cree_par: Mapped[int | None] = mapped_column(ForeignKey("users.id"), default=None)
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=lambda: _maintenant_naif())

    organisation: Mapped[Organisation] = relationship()
    patient: Mapped[Patient] = relationship(back_populates="paiements", lazy="joined")
    acte: Mapped[Acte | None] = relationship(lazy="joined")
    auteur: Mapped[User | None] = relationship("User", lazy="joined")


def _aujourdhui() -> date:
    from .utils import aujourdhui

    return aujourdhui()


STATUTS_RDV = ("demande", "confirme", "refuse", "fait")


class RendezVous(Base):
    """Une demande de rendez-vous venue de la page publique.

    Le patient écrit sans compte : nom, numéro, motif, jour et heure.
    La clinique confirme ou refuse - la consultation se consigne ensuite
    comme un acte ordinaire.
    """

    __tablename__ = "rendez_vous"

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"), index=True)
    nom: Mapped[str] = mapped_column(String(160))
    telephone: Mapped[str] = mapped_column(String(24), default="")
    motif: Mapped[str] = mapped_column(String(160), default="")
    jour: Mapped[date] = mapped_column(Date, index=True)
    heure: Mapped[str] = mapped_column(String(5), default="")
    note: Mapped[str] = mapped_column(Text, default="")
    statut: Mapped[str] = mapped_column(String(12), default="demande", index=True)
    patient_id: Mapped[int | None] = mapped_column(ForeignKey("patients.id"), nullable=True)
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=lambda: _maintenant_naif())
    traite_le: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    organisation: Mapped[Organisation] = relationship()
    patient: Mapped[Patient | None] = relationship(lazy="joined")
