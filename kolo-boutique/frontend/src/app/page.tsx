import Link from "next/link";

import { Icone } from "@/components/icone";
import { MentionDemo } from "@/components/mention-demo";
import { NomComptoir } from "@/components/marque";
import { t } from "@/lib/langue";
import { langueServeur } from "@/lib/langue-serveur";

import "../styles/entree.css";

const GESTES = [
  { num: "01", titre: "geste.1-titre", texte: "geste.1-texte" },
  { num: "02", titre: "geste.2-titre", texte: "geste.2-texte" },
  { num: "03", titre: "geste.3-titre", texte: "geste.3-texte" },
  { num: "04", titre: "geste.4-titre", texte: "geste.4-texte" },
] as const;

export default async function Presentation() {
  const langue = await langueServeur();
  return (
    <div className="entree">
      <header className="fronton">
        <div className="gabarit fronton__rangee">
          <NomComptoir langue={langue} />
          <nav className="entree__nav" aria-label={t("landing.aria-nav", langue)}>
            <Link href="/connexion" className="bouton bouton--petit">
              {t("landing.ouvrir", langue)}
            </Link>
          </nav>
        </div>
      </header>

      <main id="contenu">
        <section className="gabarit entree__accueil" aria-label={t("landing.aria-promesse", langue)}>
          <div>
            <span className="sur-titre">
              <Icone nom="voix" taille={13} /> {t("landing.sur-titre", langue)}
            </span>
            <h1 className="display">{t("landing.titre", langue)}</h1>
            <p className="entree__chapo">{t("landing.chapo", langue)}</p>
            <div className="acts">
              <Link href="/connexion" className="bouton bouton--encre">
                {t("landing.ouvrir", langue)}
                <span className="bouton__fleche">
                  <Icone nom="fleche" taille={15} />
                </span>
              </Link>
              <span className="entree__prix">
                3&nbsp;000&nbsp;FCFA <small>{t("landing.prix", langue)}</small>
              </span>
            </div>
            <MentionDemo texte={t("landing.demo", langue)} langue={langue} />
          </div>

          <div className="entree__carte feuille feuille--decalee" aria-hidden="true">
            <p className="entree__carte-tete">{t("landing.carte-tete", langue)}</p>
            <p className="entree__dictee">« 2 fanta 900 momo »</p>
            <ul className="entree__ecritures">
              <li>
                <span>Soda Fanta 1,5 L</span>
                <span className="mono">-2 · 1&nbsp;800</span>
              </li>
              <li>
                <span>Rachat spaghetti</span>
                <span className="mono">+10 · 5&nbsp;200</span>
              </li>
              <li>
                <span>Taxi Bonanjo</span>
                <span className="mono">-1&nbsp;500</span>
              </li>
            </ul>
            <p className="entree__carte-pied">
              {t("landing.carte-pied", langue)} <span className="mono">4&nbsp;180 FCFA</span>
            </p>
          </div>
        </section>

        <section className="gabarit" aria-label={t("landing.aria-gestes", langue)}>
          <div className="tete-feuille">
            <h2>{t("landing.gestes-titre", langue)}</h2>
            <span className="tete-feuille__cote">{t("landing.gestes-cote", langue)}</span>
          </div>
          <ol className="entree__gestes">
            {GESTES.map((geste) => (
              <li className="entree__geste" key={geste.num}>
                <span className="entree__geste-num mono">{geste.num}</span>
                <h3>{t(geste.titre, langue)}</h3>
                <p>{t(geste.texte, langue)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="gabarit entree__garde" aria-label={t("landing.aria-coupe", langue)}>
          <div className="feuille bloc">
            <div className="tete-feuille">
              <h2>{t("landing.coupe-titre", langue)}</h2>
              <span className="tete-feuille__cote">{t("landing.coupe-cote", langue)}</span>
            </div>
            <ul className="entree__liste">
              <li>
                <Icone nom="croix" taille={15} /> {t("landing.coupe-1", langue)}
              </li>
              <li>
                <Icone nom="croix" taille={15} /> {t("landing.coupe-2", langue)}
              </li>
              <li>
                <Icone nom="croix" taille={15} /> {t("landing.coupe-3", langue)}
              </li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="pied-page">
        <div className="gabarit pied-page__rangee">
          <p className="pied-page__note">{t("landing.pied-note", langue)}</p>
          <div className="pied-page__meta">
            <span>CODE AXIS DIGITAL CAMEROON</span>
            <span>Douala</span>
            <Link href="/connexion">Comptoir</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
