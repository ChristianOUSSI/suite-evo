import type { Metadata } from "next";

import { Bascules } from "@/components/bascules";
import { FormulaireDemande } from "@/components/formulaire-demande";
import { NomProduit } from "@/components/marque";
import { lirePublique } from "@/lib/api";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { Catalogue } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Write to the garage" : "Écrire au garage" };
}

export default async function PageDemande({
  searchParams,
}: {
  searchParams: Promise<{ voiture?: string; piece?: string }>;
}) {
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const params = await searchParams;
  const voitureId = params.voiture ? Number(params.voiture) : null;
  const pieceId = params.piece ? Number(params.piece) : null;
  const corps = await lirePublique<Catalogue>("/public/catalogue", langue).catch(() => null);

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" />
          <Bascules langue={langue} />
        </div>
      </header>
      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit standard">
          <div className="standard__tete">
            <span className="cadc-badge cadc-badge--acier">{corps?.garage?.nom ?? "evo-cars"}</span>
            <h1>{t("demande.titre")}</h1>
            <p>{t("demande.chapo")}</p>
          </div>
          <FormulaireDemande
            langue={langue}
            catalogue={corps}
            voitureId={voitureId}
            pieceId={pieceId}
          />
        </div>
      </main>
    </div>
  );
}
