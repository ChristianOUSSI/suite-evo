import type { Metadata } from "next";

import { Bascules } from "@/components/bascules";
import { NomProduit } from "@/components/marque";
import { lirePublique } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { Catalogue } from "@/lib/types";

import "../../../styles/cars.css";

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

  const garage = catalogue?.garage ?? null;
  const voitures = catalogue?.voitures ?? [];
  const pieces = catalogue?.pieces ?? [];

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" sous={garage?.nom ?? "evo-cars"} />
          <Bascules langue={langue} />
        </div>
      </header>
      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit standard">
          <div className="standard__tete">
            <span className="cadc-badge cadc-badge--acier">{garage?.nom ?? "evo-cars"}</span>
            <h1>{t("catalogue.titre")}</h1>
            <p>{t("catalogue.chapo")}</p>
          </div>

          {voitures.length === 0 && pieces.length === 0 ? (
            <p className="cadc-note">{t("catalogue.vide")}</p>
          ) : (
            <>
              {voitures.length > 0 ? (
                <ul className="standard-grille">
                  {voitures.map((un) => (
                    <li className="appel" key={`v${un.id}`}>
                      <span className="appel__cat">
                        {un.marque} · {un.annee}
                      </span>
                      <span className="appel__titre">{un.modele}</span>
                      <span className="appel__prix">{f.fcfa(un.prix)}</span>
                      <p className="appel__description">
                        {un.kilometrage.toLocaleString(langue === "en" ? "en-GB" : "fr-FR")} {t("voitures.km")}
                        {` · ${t(`carburant.${un.carburant}`)} · ${t(`boite.${un.boite}`)}`}
                      </p>
                      {un.note ? <p className="appel__lieu">{un.note}</p> : null}
                      {garage?.telephone ? (
                        <p className="appel__lieu">
                          <a href={`tel:${garage.telephone.replace(/\D/g, "")}`}>
                            {t("catalogue.contact")} · {garage.telephone_display}
                          </a>
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
              {pieces.length > 0 ? (
                <>
                  <h2 style={{ marginTop: 24 }}>{t("catalogue.pieces")}</h2>
                  <ul className="standard-grille">
                    {pieces.map((un) => (
                      <li className="appel" key={`p${un.id}`}>
                        <span className="appel__cat">{un.reference}</span>
                        <span className="appel__titre">{un.designation}</span>
                        <span className="appel__prix">{f.fcfa(un.prix_vente)}</span>
                        <p className="appel__description">
                          {un.compatibilite ? `${un.compatibilite} · ` : ""}
                          {t("pieces.stock")} {un.stock}
                        </p>
                        {garage?.telephone ? (
                          <p className="appel__lieu">
                            <a href={`tel:${garage.telephone.replace(/\D/g, "")}`}>
                              {t("catalogue.contact")} · {garage.telephone_display}
                            </a>
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </>
          )}
          { catalogue?.lien ? (
            <p className="cadc-note">
              <a
                className="cadc-bouton cadc-bouton--doux"
                href={`https://wa.me/?text=${encodeURIComponent(
                  `${ garage?.nom ?? "evo-cars" } - ${voitures.length + pieces.length} ${langue === "en" ? "items" : "articles"} : ${catalogue?.lien}`,
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
