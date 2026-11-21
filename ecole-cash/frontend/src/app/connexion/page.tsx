import type { Metadata } from "next";
import Link from "next/link";

import { FormulaireConnexion } from "@/components/formulaire-connexion";
import { CommutateurLangue } from "@/components/commutateur-langue";
import { Wordmark } from "@/components/brand";
import { Icone } from "@/components/icone";
import { t } from "@/lib/langue";
import { langueServeur } from "@/lib/langue-serveur";

import "../../styles/entree.css";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueServeur();
  return {
    title: t("connexion.titre", langue),
    description: t("meta.connexion", langue),
  };
}

export default async function Connexion() {
  const langue = await langueServeur();
  return (
    <div className="entree">
      <header className="masthead">
        <div className="shell masthead__row">
          <Wordmark href="/" langue={langue} />
          <CommutateurLangue langue={langue} />
          <span className="stamp stamp--gold stamp--straight">
            {t("connexion.stamp", langue)}
          </span>
        </div>
      </header>

      <main id="contenu" className="shell entree__corps">
        <div className="entree__promo">
          <span className="kicker">{t("connexion.kicker", langue)}</span>
          <h1 className="display">{t("connexion.titre_promo", langue)}</h1>
          <p>{t("connexion.intro", langue)}</p>
          <ul className="entree__liste">
            <li>
              <Icone nom="check" taille={16} />
              {t("connexion.liste1", langue)}
            </li>
            <li>
              <Icone nom="check" taille={16} />
              {t("connexion.liste2", langue)}
            </li>
            <li>
              <Icone nom="check" taille={16} />
              {t("connexion.liste3", langue)}
            </li>
          </ul>
        </div>

        <FormulaireConnexion langue={langue} />
      </main>

      <footer className="site-footer">
        <div className="shell site-footer__row">
          <p className="site-footer__note">{t("connexion.note", langue)}</p>
          <div className="site-footer__meta">
            <span>{t("connexion.prix", langue)}</span>
            <Link href="/">{t("connexion.accueil", langue)}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
