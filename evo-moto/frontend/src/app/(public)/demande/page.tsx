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
  searchParams: Promise<{ moto?: string }>;
}) {
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const params = await searchParams;
  const motoId = params.moto ? Number(params.moto) : null;
  const corps = await lirePublique<Catalogue>("/public/catalogue", langue).catch(() => null);
  const motos = corps?.motos ?? [];

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
            <span className="cadc-badge cadc-badge--acier">{corps?.garage?.nom ?? "evo-moto"}</span>
            <h1>{t("demande.titre")}</h1>
            <p>{t("demande.chapo")}</p>
          </div>
          <FormulaireDemande langue={langue} motos={motos} motoId={motoId} />
        </div>
      </main>
    </div>
  );
}
