import type { Metadata } from "next";

import { Bascules } from "@/components/bascules";
import { FormulaireRdv } from "@/components/formulaire-rdv";
import { NomProduit } from "@/components/marque";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Request an appointment" : "Demander un rendez-vous" };
}

export default async function PageRdv() {
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
        <div className="cadc-gabarit clinique">
          <div className="clinique__tete">
            <span className="cadc-badge cadc-badge--acier">{t("rdv.titre")}</span>
            <h1>{t("rdv.titre")}</h1>
            <p>{t("rdv.chapo")}</p>
          </div>
          <FormulaireRdv langue={langue} />
        </div>
      </main>
    </div>
  );
}
