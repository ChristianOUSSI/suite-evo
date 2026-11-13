import type { Metadata } from "next";
import Link from "next/link";

import { FormulaireSeance } from "@/components/formulaire-seance";
import { NomProduit } from "@/components/marque";
import { Bascules } from "@/components/bascules";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return {
    title: langue === "en" ? "Open the circle" : "Ouvrir le cercle",
  };
}

export default async function Seance() {
  const langue = await langueCourante();
  const t = traduire(langue).t;

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" photo />
          <Bascules langue={langue} />
        </div>
      </header>

      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit--etroit seance">
          <div className="cadc-pile">
            <h1>{t("seance.titre")}</h1>
            <p style={{ color: "var(--cadc-encre-2)" }}>{t("seance.chapo")}</p>
            <div className="seance__cartes">
              <span className="cadc-badge cadc-badge--acier">
                {langue === "en" ? "Douala · Ndokoti" : "Douala · Ndokoti"}
              </span>
              <span className="cadc-badge cadc-badge--doux">
                {langue === "en" ? "9 members" : "9 membres"}
              </span>
              <span className="cadc-badge cadc-badge--doux">
                {langue === "en" ? "monthly, day 5" : "mensuel, le 5"}
              </span>
            </div>
            <Link href="/" className="cadc-bouton cadc-bouton--doux" style={{ width: "fit-content" }}>
              {langue === "en" ? "Back to the presentation" : "Retour à la présentation"}
            </Link>
          </div>

          <FormulaireSeance langue={langue} />
        </div>
      </main>
    </div>
  );
}
