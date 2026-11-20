import type { Metadata } from "next";

import { Bascules } from "@/components/bascules";
import { FormulaireInscription } from "@/components/formulaire-inscription";
import { NomProduit } from "@/components/marque";
import { lirePublique } from "@/lib/api";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ClassePublique } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Enroll a child" : "Inscrire un enfant" };
}

export default async function PageInscription() {
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const donnees = await lirePublique<{ classes: ClassePublique[] }>(
    "/public/classes",
    langue,
  );
  const classes = donnees.classes ?? [];

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" />
          <Bascules langue={langue} />
        </div>
      </header>
      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit ecole">
          <div className="ecole__tete">
            <span className="cadc-badge cadc-badge--acier">{t("inscription.titre")}</span>
            <h1>{t("inscription.titre")}</h1>
            <p>{t("inscription.chapo")}</p>
          </div>
          <FormulaireInscription langue={langue} classes={classes} />
        </div>
      </main>
    </div>
  );
}
