import type { Metadata } from "next";
import Link from "next/link";

import { CommutateurLangue } from "@/components/commutateur-langue";
import { Wordmark } from "@/components/brand";
import { Icone } from "@/components/icone";
import { t } from "@/lib/langue";
import { langueServeur } from "@/lib/langue-serveur";

import "../styles/entree.css";
import "../styles/landing.css";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueServeur();
  return {
    title: "ÉCOLE CASH",
    description: t("meta.accueil", langue),
  };
}

const GESTES = [
  { cle_titre: "geste.encaisser.titre", cle_texte: "geste.encaisser.texte" },
  { cle_titre: "geste.recu.titre", cle_texte: "geste.recu.texte" },
  { cle_titre: "geste.relancer.titre", cle_texte: "geste.relancer.texte" },
  { cle_titre: "geste.compter.titre", cle_texte: "geste.compter.texte" },
];

export default async function Accueil() {
  const langue = await langueServeur();
  return (
    <>
      <header className="masthead">
        <div className="shell masthead__row">
          <Wordmark href="" langue={langue} />
          <nav className="app-nav" aria-label={t("landing.nav.aria", langue)}>
            <Link href="/connexion" className="app-nav__link">
              <Icone nom="caisse" taille={16} />
              {t("landing.ouvrir", langue)}
            </Link>
          </nav>
          <CommutateurLangue langue={langue} />
        </div>
      </header>

      <main id="contenu">
        <section className="shell entree__corps">
          <div className="entree__promo">
            <span className="kicker">{t("landing.kicker", langue)}</span>
            <h1 className="display">{t("landing.titre", langue)}</h1>
            <p>{t("landing.intro", langue)}</p>
            <div className="form-actions">
              <Link href="/connexion" className="btn btn--ink">
                {t("landing.demo", langue)}
                <span className="btn__fleche" aria-hidden="true">
                  <Icone nom="fleche" taille={15} />
                </span>
              </Link>
              <Link href="/verif/DEMO-JETON" className="btn btn--quiet">
                {t("landing.verifier", langue)}
              </Link>
            </div>
          </div>

          <div className="sheet sheet--offset bloc">
            <span className="eyebrow">{t("landing.prix", langue)}</span>
            <p className="prix">15 000 FCFA</p>
            <p className="prix__suite">{t("landing.prix_suite", langue)}</p>
            <hr className="divider divider--ink" />
            <ul className="entree__liste">
              <li>
                <Icone nom="check" taille={16} />
                {t("landing.liste1", langue)}
              </li>
              <li>
                <Icone nom="check" taille={16} />
                {t("landing.liste2", langue)}
              </li>
              <li>
                <Icone nom="check" taille={16} />
                {t("landing.liste3", langue)}
              </li>
            </ul>
          </div>
        </section>

        <section className="shell" aria-label={t("landing.gestes_aria", langue)}>
          <div className="section-head">
            <h2>{t("landing.section_titre", langue)}</h2>
            <span className="section-head__aside">{t("landing.section_aside", langue)}</span>
          </div>
          <ol className="gestes">
            {GESTES.map((geste, index) => (
              <li className="geste" key={geste.cle_titre}>
                <span className="geste__num mono">{String(index + 1).padStart(2, "0")}</span>
                <h3>{t(geste.cle_titre, langue)}</h3>
                <p>{t(geste.cle_texte, langue)}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="site-footer">
        <div className="shell site-footer__row">
          <p className="site-footer__note">{t("landing.note", langue)}</p>
          <div className="site-footer__meta">
            <span>CODE AXIS DIGITAL CAMEROON</span>
            <span>{t("landing.adresse", langue)}</span>
            <Link href="/connexion">{t("landing.connexion", langue)}</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
