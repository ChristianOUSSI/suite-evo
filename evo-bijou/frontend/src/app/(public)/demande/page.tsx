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
  return { title: langue === "en" ? "Ask about a piece" : "Demander une pièce" };
}

export default async function PageDemande({
  searchParams,
}: {
  searchParams: Promise<{ piece?: string }>;
}) {
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const params = await searchParams;
  const pieceId = params.piece ? Number(params.piece) : null;
  const corps = await lirePublique<Catalogue>("/public/catalogue", langue).catch(() => null);
  const pieces = corps?.pieces ?? [];

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
            <span className="cadc-badge cadc-badge--acier">{corps?.bijouterie?.nom ?? "evo-bijou"}</span>
            <h1>{t("demande.titre")}</h1>
            <p>{t("demande.chapo")}</p>
          </div>
          <FormulaireDemande langue={langue} pieces={pieces} pieceId={pieceId} />
        </div>
      </main>
    </div>
  );
}
