from __future__ import annotations

"""Le classeur de la maison : les documents et leurs échéances.

Trois règles :

1. Chaque document porte une référence à dix signes, générée toute seule :
   c'est ce que le client ou le contrôleur demande au téléphone.
2. Une échéance qui passe ne s'efface pas : le document reste, son statut
   change - actif, archivé - et le récap dit ce qui arrive.
3. Le passé ne se réécrit pas : on archive, on n'efface pas.
"""

import secrets

from datetime import date as date_type, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base
from .utils import maintenant


def _maintenant_naif():
    return maintenant()


def aujourdhui_defaut() -> date_type:
    from .utils import aujourdhui

    return aujourdhui()


ROLES = ("responsable", "agent")
CATEGORIES = ("facture", "contrat", "courrier", "pv", "identite", "autorisation", "autre")
STATUTS = ("actif", "archive", "annule")
STATUTS_DEMANDE = ("demandee", "prete", "remise", "refusee")

ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def nouvelle_reference() -> str:
    """Dix signes sans I, O, 0 ni 1 : dicibles au téléphone."""
    return "".join(secrets.choice(ALPHABET) for _ in range(10))


class Organisation(Base):
    """La maison ou la boutique qui tient le classeur."""

    __tablename__ = "organisations"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(160))
    ville: Mapped[str] = mapped_column(String(60), default="Douala")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    telephone: Mapped[str] = mapped_column(String(24), default="")

    documents: Mapped[list[Document]] = relationship(
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


class Document(Base):
    """Un document du classeur : la référence, la catégorie, l'échéance."""

    __tablename__ = "documents"
    __table_args__ = (
        UniqueConstraint("reference", name="uq_documents_reference"),
        Index("ix_documents_statut", "statut"),
        Index("ix_documents_categorie", "categorie"),
        Index("ix_documents_echeance", "echeance"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    reference: Mapped[str] = mapped_column(String(12), index=True)
    titre: Mapped[str] = mapped_column(String(200))
    categorie: Mapped[str] = mapped_column(String(20), default="autre")
    description: Mapped[str] = mapped_column(Text, default="")
    emetteur: Mapped[str] = mapped_column(String(160), default="")
    destinataire: Mapped[str] = mapped_column(String(160), default="")
    date_document: Mapped[date_type] = mapped_column(Date, default=aujourdhui_defaut)
    echeance: Mapped[date_type | None] = mapped_column(Date, nullable=True)
    statut: Mapped[str] = mapped_column(String(16), default="actif")
    note: Mapped[str] = mapped_column(Text, default="")
    cree_par: Mapped[int] = mapped_column(ForeignKey("users.id"))
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)

    organisation: Mapped[Organisation] = relationship()
    auteur: Mapped[User] = relationship(foreign_keys=[cree_par])


class Demande(Base):
    """La demande de document venue de la page publique.

    Un citoyen, un parent, un client : il écrit sans compte, l'organisation
    prépare puis remet. Le statut suit le papier, pas l'écran.
    """

    __tablename__ = "demandes"

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    nom: Mapped[str] = mapped_column(String(160))
    telephone: Mapped[str] = mapped_column(String(24), default="")
    categorie: Mapped[str] = mapped_column(String(20), default="autre")
    motif: Mapped[str] = mapped_column(Text, default="")
    statut: Mapped[str] = mapped_column(String(16), default="demandee", index=True)
    note: Mapped[str] = mapped_column(Text, default="")
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)
    traite_le: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    organisation: Mapped[Organisation] = relationship()
