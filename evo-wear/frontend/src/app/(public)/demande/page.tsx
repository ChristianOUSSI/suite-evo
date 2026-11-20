import type { Metadata } from "next";
import { Suspense } from "react";

import { Bascules } from "@/components/bascules";
import { FormulaireDemande } from "@/components/formulaire-demande";
import { NomProduit } from "@/components/marque";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";

import "../../../styles/wear.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Ask for an item" : "Demander un article" };
}

export default async function PageDemande() {
  const langue = await langueCourante();
  const t = traduire(langue).t;

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" sous={langue === "en" ? "evo-wear" : "evo-wear"} />
          <Bascules langue={langue} />
        </div>
      </header>
      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit standard">
          <div className="standard__tete">
            <h1>{t("demande.titre")}</h1>
            <p>{t("demande.chapo")}</p>
          </div>
          <Suspense>
            <FormulaireDemande langue={langue} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
