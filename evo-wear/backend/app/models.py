from __future__ import annotations

"""La boutique : les articles de prêt-à-porter et leurs clients.

Une boutique camerounais vend des pagnes, des robes, des chemises :
chaque taille et chaque couleur est une ligne de stock. La vente
descend le stock, porte son client et sa date - le stock ne ment
jamais : on ne vend pas ce qu'on n'a pas.
"""

from datetime import date as date_type, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base
from .utils import maintenant


def _maintenant_naif():
    return maintenant()


ROLES = ("responsable", "agent")
CATEGORIES = ("pagne", "robe", "chemise", "pantalon", "ensemble", "chaussure", "accessoire", "autre")
TAILLES = ("XS", "S", "M", "L", "XL", "XXL", "unique", "38", "39", "40", "41", "42", "43", "44", "45")
STATUTS_ARTICLE = ("en_stock", "vendu", "epuise")
TYPES_CLIENT = ("particulier", "revendeur", "evenement")


class Organisation(Base):
    """La boutique qui tient le stock."""

    __tablename__ = "organisations"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(160))
    ville: Mapped[str] = mapped_column(String(60), default="Douala")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    telephone: Mapped[str] = mapped_column(String(24), default="")

    articles: Mapped[list[Article]] = relationship(
        back_populates="organisation", cascade="all, delete-orphan"
    )
    clients: Mapped[list[Client]] = relationship(
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


class Client(Base):
    """Une cliente ou un revendeur : le nom, le numéro, le type."""

    __tablename__ = "clients"
    __table_args__ = (Index("ix_clients_telephone", "telephone"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    nom: Mapped[str] = mapped_column(String(160))
    telephone: Mapped[str] = mapped_column(String(24), default="")
    type: Mapped[str] = mapped_column(String(20), default="particulier")
    note: Mapped[str] = mapped_column(Text, default="")
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)

    organisation: Mapped[Organisation] = relationship(back_populates="clients")
    achats: Mapped[list[Article]] = relationship(back_populates="client")


class Article(Base):
    """Un article de prêt-à-porter : la référence, la taille, le stock, la vente."""

    __tablename__ = "articles"
    __table_args__ = (
        UniqueConstraint("reference", name="uq_articles_reference"),
        Index("ix_articles_statut", "statut"),
        Index("ix_articles_categorie", "categorie"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    reference: Mapped[str] = mapped_column(String(16))
    nom: Mapped[str] = mapped_column(String(160))
    categorie: Mapped[str] = mapped_column(String(20), default="autre")
    taille: Mapped[str] = mapped_column(String(10), default="unique")
    couleur: Mapped[str] = mapped_column(String(40), default="")
    stock: Mapped[int] = mapped_column(Integer, default=0)
    prix_achat: Mapped[int] = mapped_column(Integer, default=0)
    prix_vente: Mapped[int] = mapped_column(Integer, default=0)
    statut: Mapped[str] = mapped_column(String(12), default="en_stock")
    quantite_vendue: Mapped[int] = mapped_column(Integer, default=0)
    client_id: Mapped[int | None] = mapped_column(ForeignKey("clients.id"), nullable=True)
    date_vente: Mapped[date_type | None] = mapped_column(Date, nullable=True)
    note: Mapped[str] = mapped_column(Text, default="")
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)

    organisation: Mapped[Organisation] = relationship(back_populates="articles")
    client: Mapped[Client | None] = relationship(back_populates="achats")


STATUTS_DEMANDE = ("demande", "confirmee", "annulee")


class Demande(Base):
    """La demande venue de la page publique : un article, une taille.

    La cliente écrit sans compte. La boutique confirme ou annule - la
    vente se consigne ensuite comme d'habitude.
    """

    __tablename__ = "demandes"

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"), index=True)
    article_id: Mapped[int | None] = mapped_column(ForeignKey("articles.id"), nullable=True)
    client_nom: Mapped[str] = mapped_column(String(160), default="")
    client_telephone: Mapped[str] = mapped_column(String(24), default="")
    note: Mapped[str] = mapped_column(Text, default="")
    statut: Mapped[str] = mapped_column(String(12), default="demande", index=True)
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)
    traite_le: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    organisation: Mapped[Organisation] = relationship()
    article: Mapped[Article | None] = relationship(lazy="joined")
