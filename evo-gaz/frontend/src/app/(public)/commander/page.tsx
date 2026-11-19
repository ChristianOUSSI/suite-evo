import type { Metadata } from "next";

import { Bascules } from "@/components/bascules";
import { FormulaireCommande } from "@/components/formulaire-commande";
import { NomProduit } from "@/components/marque";
import { lirePublique } from "@/lib/api";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { Depot } from "@/lib/types";

import "../../../styles/gaz.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Order gas" : "Commander du gaz" };
}

export default async function PageCommander() {
  const langue = await langueCourante();
  const t = traduire(langue).t;

  let depot: Depot | null = null;
  try {
    depot = await lirePublique<Depot>("/public/depot", langue);
  } catch {
    depot = null;
  }

  const magasin = depot?.depot ?? null;

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" sous={magasin?.nom ?? "evo-gaz"} />
          <Bascules langue={langue} />
        </div>
      </header>
      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit standard">
          <div className="standard__tete">
            <span className="cadc-badge cadc-badge--acier">{magasin?.nom ?? "evo-gaz"}</span>
            <h1>{t("commander.titre")}</h1>
            <p>{t("commander.chapo")}</p>
          </div>

          {magasin ? (
            <FormulaireCommande langue={langue} />
          ) : (
            <p className="cadc-note">{t("commander.vide")}</p>
          )}

          {magasin?.telephone ? (
            <p className="cadc-note">
              <a href={`tel:${magasin.telephone.replace(/\D/g, "")}`}>
                {magasin.telephone_display}
              </a>
            </p>
          ) : null}

          {depot?.lien ? (
            <p className="cadc-note">
              <a
                className="cadc-bouton cadc-bouton--doux"
                href={`https://wa.me/?text=${encodeURIComponent(
                  `${magasin?.nom ?? "evo-gaz"} - ${langue === "en" ? "order gas" : "commander du gaz"} : ${depot.lien}`,
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                {t("commander.partager")}
              </a>
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
