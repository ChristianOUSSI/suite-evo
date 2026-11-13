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
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

# Un carnet de PME camerounaise : des clients, ce qui s'est dit, et qui il
# faut rappeler aujourd'hui. Trois types seulement, parce qu'un vendeur qui
# remplit six cases ne remplit plus rien du tout.

SEGMENTS = ("particulier", "revendeur", "grossiste", "institution")
TYPES_ECHANGE = ("appel", "whatsapp", "visite", "sms", "devis", "commande", "reclamation")
ROLES = ("responsable", "vendeur")
STATUTS_RELANCE = ("a_faire", "faite")


class Entreprise(Base):
    """La maison qui tient le carnet."""

    __tablename__ = "entreprises"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(160))
    ville: Mapped[str] = mapped_column(String(60), default="Douala")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    secteur: Mapped[str] = mapped_column(String(60), default="")
    telephone: Mapped[str] = mapped_column(String(24), default="")
    # Au-delà de ce silence, un client devient « à reprendre ». Pas un
    # délire de marketing : le nombre que le gérant prononce au téléphone.
    silence_jours: Mapped[int] = mapped_column(Integer, default=45)
    rappel_jours: Mapped[int] = mapped_column(Integer, default=7)
    abonnement_mensuel: Mapped[int] = mapped_column(Integer, default=10_000)

    clients: Mapped[list[Client]] = relationship(
        back_populates="entreprise", cascade="all", lazy="selectin"
    )
    users: Mapped[list[User]] = relationship(back_populates="entreprise", lazy="selectin")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    entreprise_id: Mapped[int] = mapped_column(ForeignKey("entreprises.id"))
    nom: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(160), unique=True)
    mot_de_passe: Mapped[str] = mapped_column(String(300))
    role: Mapped[str] = mapped_column(String(16), default="vendeur")

    entreprise: Mapped[Entreprise] = relationship(back_populates="users")


class Client(Base):
    __tablename__ = "clients"

    # Deux fiches ne partagent pas le même numéro, mais un carnet peut tenir
    # dix clients joints par courriel : l'unicité ne porte que sur les numéros
    # réellement écrits.
    __table_args__ = (
        Index(
            "uq_client_telephone",
            "entreprise_id",
            "telephone",
            unique=True,
            sqlite_where=text("telephone <> ''"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    entreprise_id: Mapped[int] = mapped_column(ForeignKey("entreprises.id"))
    nom: Mapped[str] = mapped_column(String(160))
    telephone: Mapped[str] = mapped_column(String(24), default="")
    email: Mapped[str] = mapped_column(String(160), default="")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    segment: Mapped[str] = mapped_column(String(16), default="particulier")
    note: Mapped[str] = mapped_column(Text, default="")
    actif: Mapped[bool] = mapped_column(Boolean, default=True)
    cree_le: Mapped[date] = mapped_column(Date, default=date.today)

    entreprise: Mapped[Entreprise] = relationship(back_populates="clients")
    echanges: Mapped[list[Echange]] = relationship(
        back_populates="client",
        cascade="all",
        order_by="Echange.moment.desc()",
        lazy="selectin",
    )
    relances: Mapped[list[Relance]] = relationship(
        back_populates="client",
        cascade="all",
        order_by="Relance.due_le",
        lazy="selectin",
    )


class Echange(Base):
    """Ce qui s'est dit. Une ligne par contact, jamais une conversation."""

    __tablename__ = "echanges"

    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), default=None)
    type: Mapped[str] = mapped_column(String(16), default="appel")
    note: Mapped[str] = mapped_column(Text, default="")
    moment: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    montant: Mapped[int] = mapped_column(Integer, default=0)

    client: Mapped[Client] = relationship(back_populates="echanges")
    user: Mapped[User | None] = relationship("User", lazy="joined")


class Relance(Base):
    """Le rendez-vous de reprise. C'est la seule raison d'être du produit."""

    __tablename__ = "relances"

    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), default=None)
    due_le: Mapped[date] = mapped_column(Date, index=True)
    motif: Mapped[str] = mapped_column(String(240), default="")
    # « manuel » pour une raison tapée, « devis » pour une relance qui a
    # poussé toute seule. Le mot montré à l'écran vient de la langue, jamais
    # de la base.
    origine: Mapped[str] = mapped_column(String(12), default="manuel")
    statut: Mapped[str] = mapped_column(String(12), default="a_faire", index=True)
    faite_le: Mapped[date | None] = mapped_column(Date, default=None)
    note: Mapped[str] = mapped_column(Text, default="")

    client: Mapped[Client] = relationship(back_populates="relances", lazy="joined")
