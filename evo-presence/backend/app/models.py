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

# Un pointeur de présence universel : l'entreprise, ses employés, et une
# ligne par employé et par jour. Les états sont volontairement peu nombreux -
# un agent qui pointe vingt cases ne pointe plus personne.

ETATS = ("present", "retard", "absent")
ROLES = ("responsable", "agent")


class Organisation(Base):
    """L'entreprise qui pointe ses présences."""

    __tablename__ = "organisations"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(160))
    ville: Mapped[str] = mapped_column(String(60), default="Douala")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    telephone: Mapped[str] = mapped_column(String(24), default="")

    employes: Mapped[list[Employe]] = relationship(
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


class Employe(Base):
    __tablename__ = "employes"

    __table_args__ = (
        Index(
            "uq_employe_telephone",
            "organisation_id",
            "telephone",
            unique=True,
            sqlite_where=text("telephone <> ''"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    nom: Mapped[str] = mapped_column(String(160))
    telephone: Mapped[str] = mapped_column(String(24), default="")
    service: Mapped[str] = mapped_column(String(60), default="")
    actif: Mapped[bool] = mapped_column(Boolean, default=True)
    entree_le: Mapped[date] = mapped_column(Date, default=date.today)
    note: Mapped[str] = mapped_column(Text, default="")

    organisation: Mapped[Organisation] = relationship(back_populates="employes")
    pointages: Mapped[list[Presence]] = relationship(
        back_populates="employe", cascade="all", lazy="selectin"
    )


class Presence(Base):
    """Une journée, un employé, un état et ses heures. Le reste se calcule."""

    __tablename__ = "presences"

    __table_args__ = (
        UniqueConstraint("employe_id", "jour", name="uq_presence_jour"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    employe_id: Mapped[int] = mapped_column(ForeignKey("employes.id"))
    jour: Mapped[date] = mapped_column(Date, index=True)
    statut: Mapped[str] = mapped_column(String(12), default="present")
    arrivee: Mapped[str] = mapped_column(String(5), default="")
    depart: Mapped[str] = mapped_column(String(5), default="")
    note: Mapped[str] = mapped_column(Text, default="")
    pointe_par: Mapped[int | None] = mapped_column(ForeignKey("users.id"), default=None)
    pointe_le: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: _maintenant_naif()
    )

    employe: Mapped[Employe] = relationship(back_populates="pointages", lazy="joined")
    pointeur: Mapped[User | None] = relationship("User", lazy="joined")
