import type { Metadata } from "next";

import { Bascules } from "@/components/bascules";
import { FormulaireCommandePublique } from "@/components/formulaire-commande-publique";
import { NomProduit } from "@/components/marque";
import { lirePublique } from "@/lib/api";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { BoutiquePublique } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Order an item" : "Commander un article" };
}

export default async function PageCommander({
  searchParams,
}: {
  searchParams: Promise<{ annonce?: string }>;
}) {
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const params = await searchParams;
  const annonceId = params.annonce ? Number(params.annonce) : null;
  const corps = await lirePublique<BoutiquePublique>("/public/annonces", langue).catch(
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
        <div className="cadc-gabarit market">
          <div className="market__tete">
            <span className="cadc-badge cadc-badge--acier">{t("commander.titre")}</span>
            <h1>{t("commander.titre")}</h1>
            <p>{t("commander.chapo")}</p>
          </div>
          <FormulaireCommandePublique langue={langue} annonces={annonces} annonceId={annonceId} />
        </div>
      </main>
    </div>
  );
}
