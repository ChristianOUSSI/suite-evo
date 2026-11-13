from __future__ import annotations

"""Le carnet numérique : les notes, leurs catégories, leurs partages.

Un carnet camerounais garde ce qu'on ne veut pas perdre : une recette,
un numéro, une idée, un prix. Chaque note a sa catégorie, son épingle,
et un code de partage pour s'envoyer par WhatsApp.
"""

import secrets

from datetime import date as date_type, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base
from .utils import maintenant


def _maintenant_naif():
    return maintenant()


ROLES = ("responsable", "agent")
CATEGORIES = ("perso", "travail", "courses", "idees", "sante", "argent", "autre")


def _code_partage() -> str:
    return secrets.token_hex(5).upper()


class Organisation(Base):
    """Le carnet qui tient les notes."""

    __tablename__ = "organisations"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(160))
    ville: Mapped[str] = mapped_column(String(60), default="Douala")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    telephone: Mapped[str] = mapped_column(String(24), default="")

    notes: Mapped[list[Note]] = relationship(
        back_populates="organisation", cascade="all, delete-orphan"
    )


class User(Base):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("email", name="uq_users_email"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    nom: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(160), index=True)
    mot_de_passe: Mapped[str] = mapped_column(String(200))
    role: Mapped[str] = mapped_column(String(16), default="agent")
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)

    organisation: Mapped[Organisation] = relationship()


class Note(Base):
    """Une note du carnet : le titre, le contenu, la catégorie, l'épingle."""

    __tablename__ = "notes"
    __table_args__ = (
        UniqueConstraint("organisation_id", "code_partage", name="uq_notes_code"),
        Index("ix_notes_categorie", "categorie"),
        Index("ix_notes_epinglee", "epinglee"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    titre: Mapped[str] = mapped_column(String(160))
    contenu: Mapped[str] = mapped_column(Text, default="")
    categorie: Mapped[str] = mapped_column(String(20), default="perso")
    epinglee: Mapped[bool] = mapped_column(Boolean, default=False)
    archivee: Mapped[bool] = mapped_column(Boolean, default=False)
    code_partage: Mapped[str] = mapped_column(String(12), default=_code_partage, unique=True)
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)
    maj_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif, onupdate=_maintenant_naif)

    organisation: Mapped[Organisation] = relationship(back_populates="notes")
