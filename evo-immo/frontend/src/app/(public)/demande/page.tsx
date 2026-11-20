import type { Metadata } from "next";

import { Bascules } from "@/components/bascules";
import { FormulaireDemandePublique } from "@/components/formulaire-demande-publique";
import { NomProduit } from "@/components/marque";
import { lirePublique } from "@/lib/api";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { AnnoncesPubliques } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Ask about a property" : "Demander un bien" };
}

export default async function PageDemande({
  searchParams,
}: {
  searchParams: Promise<{ bien?: string }>;
}) {
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const params = await searchParams;
  const bienId = params.bien ? Number(params.bien) : null;
  const corps = await lirePublique<AnnoncesPubliques>("/public/annonces", langue).catch(
    () => null,
  );
  const annonces = corps?.annonces ?? [];

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" />
          <Bascules langue={langue} />
        </div>
      </header>
      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit immo">
          <div className="immo__tete">
            <span className="cadc-badge cadc-badge--acier">{t("demande.titre")}</span>
            <h1>{t("demande.titre")}</h1>
            <p>{t("demande.chapo")}</p>
          </div>
          <FormulaireDemandePublique langue={langue} annonces={annonces} bienId={bienId} />
        </div>
      </main>
    </div>
  );
}
