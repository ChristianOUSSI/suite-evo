import Link from "next/link";

import { Bascules } from "@/components/bascules";
import { MentionDemo } from "@/components/mention-demo";
import { NomProduit } from "@/components/marque";
import { formats } from "@/lib/format";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";

const GESTES = ["1", "2", "3", "4"] as const;

export default async function Presentation() {
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" />
          <Bascules langue={langue} />
        </div>
      </header>

      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit entree">
          <section className="entree__hero" aria-label={t("entree.titre")}>
            <span className="cadc-badge cadc-badge--acier">
              CODE AXIS DIGITAL CAMEROON
            </span>
            <h1>{t("entree.titre")}</h1>
            <p className="entree__chapo">{t("entree.chapo")}</p>
            <div className="cadc-acts">
              <Link
                href="/connexion"
                className="cadc-bouton cadc-bouton--grand cadc-bouton--premier"
              >
                {t("entree.ouvrir")}
              </Link>
              <span className="cadc-badge cadc-badge--doux">{t("entree.prix")}</span>
            </div>
            <MentionDemo langue={langue} />
          </section>

          <section aria-label={t("geste.titre")}>
            <div className="cadc-tete">
              <h2>{t("geste.titre")}</h2>
              <span className="cadc-tete__cote">{t("entree.slogan")}</span>
            </div>
            <ol className="entree__gestes">
              {GESTES.map((numero) => (
                <li className="entree__geste" key={numero}>
                  <span className="entree__geste-num">0{numero}</span>
                  <h3>{t(`geste.${numero}.titre`)}</h3>
                  <p>{t(`geste.${numero}.texte`)}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="cadc-carte" aria-label={t("entree.exige")}>
            <div className="cadc-tete">
              <h2>{t("entree.exige")}</h2>
              <span className="cadc-tete__cote">
                {t("reglages.abonnement")} {f.fcfa(10_000)} / {t("commun.mois")}
              </span>
            </div>
            <p className="cadc-note cadc-note--acier">
              {t("entree.exige-aide", { reseaux: t("commun.reseaux") })}
            </p>
            <div className="cadc-acts" style={{ marginTop: 14 }}>
              <Link href="/connexion" className="cadc-bouton">
                {t("entree.ouvrir")}
              </Link>
            </div>
          </section>
        </div>
      </main>

      <footer className="cadc-pied">
        <div className="cadc-gabarit cadc-pied__rangee">
          <span>CODE AXIS DIGITAL CAMEROON · Douala</span>
          <Link href="/connexion">{t("entree.ouvrir")}</Link>
        </div>
      </footer>
    </div>
  );
}
