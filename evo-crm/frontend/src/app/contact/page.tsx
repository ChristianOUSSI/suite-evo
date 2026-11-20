import type { Metadata } from "next";
import Link from "next/link";

import { Bascules } from "@/components/bascules";
import { FormulaireContact } from "@/components/formulaire-contact";
import { NomProduit } from "@/components/marque";
import { lireOuRien } from "@/lib/api";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { PageContact } from "@/lib/types";

import "../../styles/carnet.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return {
    title: langue === "en" ? "Contact the company" : "Écrire à l'entreprise",
    robots: { index: false, follow: false },
  };
}

export default async function PageContact() {
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const page = await lireOuRien<PageContact>("/public/entreprise", langue);
  const entreprise = page?.entreprise ?? null;

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" />
          <Bascules langue={langue} />
        </div>
      </header>
      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit--etroit cadc-pile">
          <div className="carnet__tete">
            <span className="cadc-badge cadc-badge--acier">
              {entreprise?.nom ?? "evo-crm"}
            </span>
            <h1>{t("contact.titre")}</h1>
            <p>{t("contact.chapo")}</p>
          </div>

          {entreprise ? (
            <FormulaireContact langue={langue} />
          ) : (
            <p className="cadc-note">{t("contact.vide")}</p>
          )}

          {entreprise?.telephone ? (
            <p className="cadc-note">
              <a href={`tel:${entreprise.telephone.replace(/\D/g, "")}`}>
                {entreprise.telephone_display}
              </a>
            </p>
          ) : null}

          <div className="cadc-acts">
            <Link href="/" className="cadc-bouton cadc-bouton--doux">
              {t("commun.retour")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
