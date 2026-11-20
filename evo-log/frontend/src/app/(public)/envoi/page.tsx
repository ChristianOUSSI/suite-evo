import type { Metadata } from "next";

import { Bascules } from "@/components/bascules";
import { FormulaireEnvoi } from "@/components/formulaire-envoi";
import { NomProduit } from "@/components/marque";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Request a shipment" : "Demander un envoi" };
}

export default async function PageEnvoi() {
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
        <div className="cadc-gabarit log">
          <div className="log__tete">
            <span className="cadc-badge cadc-badge--acier">{t("envoi.titre")}</span>
            <h1>{t("envoi.titre")}</h1>
            <p>{t("envoi.chapo")}</p>
          </div>
          <FormulaireEnvoi langue={langue} />
        </div>
      </main>
    </div>
  );
}
