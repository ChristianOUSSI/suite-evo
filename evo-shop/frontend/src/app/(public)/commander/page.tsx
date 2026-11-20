import type { Metadata } from "next";

import { Bascules } from "@/components/bascules";
import { FormulaireCommande } from "@/components/formulaire-commande";
import { NomProduit } from "@/components/marque";
import { MentionDemo } from "@/components/mention-demo";
import { lirePublique } from "@/lib/api";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { BoutiquePublique } from "@/lib/types";

import "../../../styles/boutique.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Order from the shop" : "Commander à la boutique" };
}

export default async function PageCommander() {
  const langue = await langueCourante();
  const t = traduire(langue).t;

  let corps: BoutiquePublique | null = null;
  try {
    corps = await lirePublique<BoutiquePublique>("/public/boutique", langue);
  } catch {
    corps = null;
  }

  const boutique = corps?.boutique ?? null;
  const produits = corps?.produits ?? [];

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" sous={boutique?.nom ?? "evo-shop"} />
          <Bascules langue={langue} />
        </div>
      </header>
      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit standard">
          <div className="standard__tete">
            <span className="cadc-badge cadc-badge--acier">{boutique?.nom ?? "evo-shop"}</span>
            <h1>{t("commander.titre")}</h1>
            <p>{t("commander.chapo")}</p>
          </div>

          {boutique && produits.length > 0 ? (
            <FormulaireCommande langue={langue} produits={produits} />
          ) : (
            <p className="cadc-note">{t("commander.vide")}</p>
          )}

          {boutique?.telephone ? (
            <p className="cadc-note">
              <a href={`tel:${boutique.telephone.replace(/\D/g, "")}`}>
                {boutique.telephone_display}
              </a>
            </p>
          ) : null}

          <MentionDemo langue={langue} />
        </div>
      </main>
    </div>
  );
}
