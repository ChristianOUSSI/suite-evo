from __future__ import annotations

"""L'agent autonome : les tâches confiées et leurs exécutions.

On confie un objectif à l'agent — rédiger, résumer, chercher,
automatiser. En mode démo, l'exécution se fait ici, sur la machine :
le journal garde qui a demandé quoi, quand, et ce qui est revenu.
"""

from datetime import date as date_type, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base
from .utils import maintenant


def _maintenant_naif():
    return maintenant()


ROLES = ("responsable", "agent")
TYPES_TACHE = ("recherche", "redaction", "resume", "analyse", "automatisation", "autre")
PRIORITES = ("basse", "normale", "haute")
STATUTS_TACHE = ("en_attente", "en_cours", "terminee", "echec", "annulee")
STATUTS_EXECUTION = ("terminee", "echec")


class Organisation(Base):
    """L'organisation qui confie des tâches à l'agent."""

    __tablename__ = "organisations"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(160))
    ville: Mapped[str] = mapped_column(String(60), default="Douala")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    telephone: Mapped[str] = mapped_column(String(24), default="")

    taches: Mapped[list[Tache]] = relationship(
        back_populates="organisation", cascade="all, delete-orphan"
    )
    executions: Mapped[list[Execution]] = relationship(
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


class Tache(Base):
    """Une tâche confiée à l'agent : l'objectif, le type, la priorité."""

    __tablename__ = "taches"
    __table_args__ = (
        Index("ix_taches_statut", "statut"),
        Index("ix_taches_type", "type"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    titre: Mapped[str] = mapped_column(String(200))
    consigne: Mapped[str] = mapped_column(Text, default="")
    type: Mapped[str] = mapped_column(String(20), default="autre")
    priorite: Mapped[str] = mapped_column(String(10), default="normale")
    statut: Mapped[str] = mapped_column(String(12), default="en_attente")
    resultat: Mapped[str] = mapped_column(Text, default="")
    erreur: Mapped[str] = mapped_column(Text, default="")
    cree_par: Mapped[str] = mapped_column(String(120), default="")
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)
    maj_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif, onupdate=_maintenant_naif)

    organisation: Mapped[Organisation] = relationship(back_populates="taches")
    executions: Mapped[list[Execution]] = relationship(
        back_populates="tache", cascade="all, delete-orphan"
    )


class Execution(Base):
    """Une exécution de l'agent : la tâche, le début, la fin, le résultat."""

    __tablename__ = "executions"
    __table_args__ = (Index("ix_executions_tache", "tache_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    tache_id: Mapped[int] = mapped_column(ForeignKey("taches.id"))
    statut: Mapped[str] = mapped_column(String(12), default="terminee")
    debut_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)
    fin_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)
    duree_secondes: Mapped[int] = mapped_column(Integer, default=0)
    resultat: Mapped[str] = mapped_column(Text, default="")
    details: Mapped[str] = mapped_column(Text, default="")

    organisation: Mapped[Organisation] = relationship(back_populates="executions")
    tache: Mapped[Tache] = relationship(back_populates="executions")
