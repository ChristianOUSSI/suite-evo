import type { Metadata } from "next";
import Link from "next/link";

import { Bascules } from "@/components/bascules";
import { FormulaireDemande } from "@/components/formulaire-demande";
import { NomProduit } from "@/components/marque";
import { lireOuRien } from "@/lib/api";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { MaisonPublique } from "@/lib/types";

import "../../../styles/docs.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return {
    title: langue === "en" ? "Request a document" : "Demander un document",
    robots: { index: false, follow: false },
  };
}

export default async function PageDemande() {
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const page = await lireOuRien<MaisonPublique>("/public/maison", langue);
  const maison = page?.maison ?? null;

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" />
          <Bascules langue={langue} />
        </div>
      </header>
      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit classeur">
          <div className="classeur__tete">
            <span className="cadc-badge cadc-badge--acier">
              {maison?.nom ?? "evo-docs"}
            </span>
            <h1>{t("demande.titre")}</h1>
            <p>{t("demande.chapo")}</p>
          </div>
          <FormulaireDemande langue={langue} />
          {maison?.telephone ? (
            <p className="cadc-note">
              <a href={`tel:${maison.telephone.replace(/\D/g, "")}`}>
                {maison.telephone_display}
              </a>
            </p>
          ) : null}
          <div className="cadc-acts">
            <Link href="/verifier" className="cadc-bouton cadc-bouton--doux">
              {t("verifier.titre")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
