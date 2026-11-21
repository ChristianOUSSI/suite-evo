import type { Metadata } from "next";
import Link from "next/link";

import { FormulaireComptoir } from "@/components/formulaire-comptoir";
import { Icone } from "@/components/icone";
import { lire } from "@/lib/api";
import { fcfaCourt } from "@/lib/format";
import { t } from "@/lib/langue";
import { langueServeur } from "@/lib/langue-serveur";
import { seanceObligatoire } from "@/lib/session";
import type { Cahier, JournalDepenses, Main, Tableau } from "@/lib/types";

import "../../../../styles/comptoir.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueServeur();
  return { title: t("reglages.meta", langue) };
}

export default async function Reglages() {
  const session = await seanceObligatoire();
  const langue = await langueServeur();
  const [tableau, cahier, depenses, mains] = await Promise.all([
    lire<Tableau>("/tableau"),
    lire<Cahier>("/produits"),
    lire<JournalDepenses>("/depenses?jours=30"),
    lire<Main[]>("/mains"),
  ]);

  return (
    <div className="gabarit vitre">
      <div className="tete-page">
        <div className="tete-page__principal">
          <span className="sur-titre">
            <Icone nom="reglage" taille={13} /> {session.boutique.ville}
          </span>
          <h1 className="display">{t("reglages.titre", langue)}</h1>
          <p className="tete-page__entree">{t("reglages.chapo", langue)}</p>
        </div>
        <div className="tete-page__cote">
          <span className="tampon tampon--rayon">
            {t("reglages.demo", langue, { abonnement: session.boutique.abonnement_hebdo_label })}
          </span>
        </div>
      </div>

      <nav className="bande-ancre" aria-label={t("reglages.aria-nav", langue)}>
        <a href="#comptoir">{t("reglages.nav-comptoir", langue)}</a>
        <a href="#rails">{t("reglages.nav-rails", langue)}</a>
        <a href="#mains">{t("reglages.nav-mains", langue)}</a>
        <a href="#bilan">{t("reglages.nav-bilan", langue)}</a>
      </nav>

      <FormulaireComptoir
        boutique={session.boutique}
        mains={mains}
        autoriseEquipe={session.user.role === "tenancier"}
      />

      <section className="feuille bloc" id="bilan" aria-label={t("reglages.bilan-aria", langue)}>
        <div className="tete-feuille">
          <h2>{t("reglages.bilan-titre", langue)}</h2>
          <span className="tete-feuille__cote">{t("reglages.bilan-cote", langue)}</span>
        </div>
        <dl className="tiroir-lignes">
          <div className="ligne-reglure">
            <dt className="ligne-reglure__nom">{t("reglages.lignes-rayon", langue)}</dt>
            <dd className="ligne-reglure__valeur">{cahier.total}</dd>
          </div>
          <div className="ligne-reglure">
            <dt className="ligne-reglure__nom">{t("reglages.reserve", langue)}</dt>
            <dd className="ligne-reglure__valeur">{fcfaCourt(tableau.reserve)}</dd>
          </div>
          <div className="ligne-reglure">
            <dt className="ligne-reglure__nom">{t("reglages.chiffre-jour", langue)}</dt>
            <dd className="ligne-reglure__valeur">{fcfaCourt(tableau.chiffre)}</dd>
          </div>
          <div className="ligne-reglure">
            <dt className="ligne-reglure__nom">{t("reglages.depenses-30", langue)}</dt>
            <dd className="ligne-reglure__valeur">{depenses.total_label}</dd>
          </div>
          <div className="ligne-reglure">
            <dt className="ligne-reglure__nom">{t("reglages.sous-alerte", langue)}</dt>
            <dd className="ligne-reglure__valeur">{cahier.en_alerte}</dd>
          </div>
        </dl>
        <div className="acts">
          <Link href="/comptoir/tiroir#feuilles" className="lien-simple">
            {t("reglages.exporter", langue)}
          </Link>
          <Link href="/comptoir" className="bouton bouton--petit bouton--doux">
            {t("reglages.retour", langue)}
          </Link>
        </div>
      </section>
    </div>
  );
}
