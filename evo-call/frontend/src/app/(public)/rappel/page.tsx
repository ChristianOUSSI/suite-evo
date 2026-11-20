import type { Metadata } from "next";
import Link from "next/link";

import { Bascules } from "@/components/bascules";
import { FormulaireRappel } from "@/components/formulaire-rappel";
import { NomProduit } from "@/components/marque";
import { lireOuRien } from "@/lib/api";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { CentrePublique } from "@/lib/types";

import "../../../styles/calls.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return {
    title: langue === "en" ? "Request a callback" : "Demander un rappel",
    robots: { index: false, follow: false },
  };
}

export default async function PageRappel() {
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const page = await lireOuRien<CentrePublique>("/public/centre", langue);
  const centre = page?.centre ?? null;

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" sous={centre?.nom ?? "evo-call"} />
          <Bascules langue={langue} />
        </div>
      </header>
      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit standard">
          <div className="standard__tete">
            <span className="cadc-badge cadc-badge--acier">{centre?.nom ?? "evo-call"}</span>
            <h1>{t("rappel.titre")}</h1>
            <p>{t("rappel.chapo")}</p>
          </div>

          {centre ? (
            <FormulaireRappel langue={langue} />
          ) : (
            <p className="cadc-note">{t("rappel.vide")}</p>
          )}

          {centre?.telephone ? (
            <p className="cadc-note">
              <a href={`tel:${centre.telephone.replace(/\D/g, "")}`}>
                {centre.telephone_display}
              </a>
            </p>
          ) : null}

          <div className="cadc-acts">
            <Link href="/file" className="cadc-bouton cadc-bouton--doux">
              {t("rappel.file")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
