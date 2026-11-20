import type { Metadata } from "next";

import { Bascules } from "@/components/bascules";
import { FormulaireDevis } from "@/components/formulaire-devis";
import { NomProduit } from "@/components/marque";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Request a quote" : "Demander un devis" };
}

export default async function PageDevis() {
  const langue = await langueCourante();
  const t = traduire(langue).t;

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" />
          <Bascules langue={langue} />
        </div>
      </header>
      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit import">
          <div className="import__tete">
            <span className="cadc-badge cadc-badge--acier">{t("devis.titre")}</span>
            <h1>{t("devis.titre")}</h1>
            <p>{t("devis.chapo")}</p>
          </div>
          <FormulaireDevis langue={langue} />
        </div>
      </main>
    </div>
  );
}
