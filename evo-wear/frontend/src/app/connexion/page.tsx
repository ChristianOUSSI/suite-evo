import type { Metadata } from "next";
import Link from "next/link";

import { Bascules } from "@/components/bascules";
import { FormulaireSeance } from "@/components/formulaire-seance";
import { NomProduit } from "@/components/marque";
import { langueCourante, seance } from "@/lib/session";
import { traduire } from "@/lib/langue";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return {
    title: langue === "en" ? "Open the boutique" : "Open the boutique",
  };
}

export default async function PageConnexion() {
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const courante = await seance();

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" />
          <Bascules langue={langue} />
        </div>
      </header>

      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit seance">
          <div className="cadc-pile">
            <span className="cadc-badge cadc-badge--acier">
              CODE AXIS DIGITAL CAMEROON
            </span>
            <h1 style={{ fontSize: "clamp(1.9rem,8vw,2.8rem)" }}>{t("seance.titre")}</h1>
            <p className="entree__chapo">{t("seance.chapo")}</p>

            <ul className="cadc-liste cadc-pile cadc-pile--serree">
              <li className="cadc-ligne">
                <span className="cadc-ligne__nom">{t("nav.articles")}</span>
                <span className="cadc-ligne__valeur">{t("articles.chapo")}</span>
              </li>
              <li className="cadc-ligne">
                <span className="cadc-ligne__nom">{t("nav.clients")}</span>
                <span className="cadc-ligne__valeur">{t("clients.chapo")}</span>
              </li>
              <li className="cadc-ligne">
                <span className="cadc-ligne__nom">{t("nav.recap")}</span>
                <span className="cadc-ligne__valeur">{t("recap.chapo")}</span>
              </li>
            </ul>

            <p className="cadc-note">{t("commun.dejaDemo")}</p>
          </div>

          {courante ? (
            <div className="cadc-carte cadc-pile">
              <h2>{t("accueil.titre")}</h2>
              <p className="cadc-champ__aide">
                {courante.user.nom} · {courante.organisation.nom}
              </p>
              <div className="cadc-acts">
                <Link href="/" className="cadc-bouton cadc-bouton--premier">
                  {t("entree.ouvrir")}
                </Link>
              </div>
            </div>
          ) : (
            <FormulaireSeance langue={langue} />
          )}
        </div>
      </main>
    </div>
  );
}
