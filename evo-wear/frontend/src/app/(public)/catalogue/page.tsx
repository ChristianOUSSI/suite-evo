import type { Metadata } from "next";

import { Bascules } from "@/components/bascules";
import { NomProduit } from "@/components/marque";
import { lirePublique } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { Catalogue } from "@/lib/types";

import "../../../styles/wear.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "The catalogue" : "Le catalogue" };
}

export default async function PageCatalogue() {
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);

  let catalogue: Catalogue | null = null;
  try {
    catalogue = await lirePublique<Catalogue>("/public/catalogue", langue);
  } catch {
    catalogue = null;
  }

  const boutique = catalogue?.boutique ?? null;
  const articles = catalogue?.articles ?? [];

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" sous={boutique?.nom ?? "evo-wear"} />
          <Bascules langue={langue} />
        </div>
      </header>
      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit standard">
          <div className="standard__tete">
            <span className="cadc-badge cadc-badge--acier">{boutique?.nom ?? "evo-wear"}</span>
            <h1>{t("catalogue.titre")}</h1>
            <p>{t("catalogue.chapo")}</p>
          </div>

          {articles.length === 0 ? (
            <p className="cadc-note">{t("catalogue.vide")}</p>
          ) : (
            <ul className="standard-grille">
              {articles.map((un) => (
                <li className="appel" key={un.id}>
                  <span className="appel__cat">
                    {t(`categorie.${un.categorie}`)} · {un.taille}
                  </span>
                  <span className="appel__titre">{un.nom}</span>
                  <span className="appel__prix">{f.fcfa(un.prix_vente)}</span>
                  <p className="appel__description">
                    {un.couleur ? `${un.couleur} · ` : ""}
                    {t("articles.stock")} {un.stock}
                  </p>
                  {un.note ? <p className="appel__lieu">{un.note}</p> : null}
                  {boutique?.telephone ? (
                    <p className="appel__lieu">
                      <a href={`tel:${boutique.telephone.replace(/\D/g, "")}`}>
                        {t("catalogue.contact")} · {boutique.telephone_display}
                      </a>
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
