import type { Metadata } from "next";
import Link from "next/link";

import { Bascules } from "@/components/bascules";
import { NomProduit } from "@/components/marque";
import { lirePublique } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { Catalogue } from "@/lib/types";

import "../../../styles/bijou.css";

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

  const bijouterie = catalogue?.bijouterie ?? null;
  const pieces = catalogue?.pieces ?? [];

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" sous={bijouterie?.nom ?? "evo-bijou"} />
          <Bascules langue={langue} />
        </div>
      </header>
      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit standard">
          <div className="standard__tete">
            <span className="cadc-badge cadc-badge--acier">{bijouterie?.nom ?? "evo-bijou"}</span>
            <h1>{t("catalogue.titre")}</h1>
            <p>{t("catalogue.chapo")}</p>
          </div>

          {pieces.length === 0 ? (
            <p className="cadc-note">{t("catalogue.vide")}</p>
          ) : (
            <ul className="standard-grille">
              {pieces.map((un) => (
                <li className="appel" key={un.id}>
                  <span className="appel__cat">
                    {un.reference} · {t(`matiere.${un.matiere}`)}
                  </span>
                  <span className="appel__titre">{un.nom}</span>
                  <span className="appel__prix">{f.fcfa(un.prix_vente)}</span>
                  <p className="appel__description">
                    {un.poids_grammes > 0 ? `${un.poids_grammes.toLocaleString(langue === "en" ? "en-GB" : "fr-FR")} g` : ""}
                    {un.carat ? ` · ${un.carat} ct` : ""}
                  </p>
                  {un.note ? <p className="appel__lieu">{un.note}</p> : null}
                  {bijouterie?.telephone ? (
                    <p className="appel__lieu">
                      <a href={`tel:${bijouterie.telephone.replace(/\D/g, "")}`}>
                        {t("catalogue.contact")} · {bijouterie.telephone_display}
                      </a>
                    </p>
                  ) : null}
                  <p className="appel__lieu">
                    <Link href={`/demande?piece=${un.id}`}>{t("catalogue.demander")}</Link>
                  </p>
                </li>
              ))}
            </ul>
          )}
          { catalogue?.lien ? (
            <p className="cadc-note">
              <a
                className="cadc-bouton cadc-bouton--doux"
                href={`https://wa.me/?text=${encodeURIComponent(
                  `${ bijouterie?.nom ?? "evo-bijou" } - ${pieces.length} ${langue === "en" ? "items" : "articles"} : ${catalogue?.lien}`,
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                {t("catalogue.partager")}
              </a>
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
