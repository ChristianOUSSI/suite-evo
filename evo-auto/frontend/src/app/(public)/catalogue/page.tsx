import type { Metadata } from "next";

import { Bascules } from "@/components/bascules";
import { NomProduit } from "@/components/marque";
import { lirePublique } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { Catalogue } from "@/lib/types";

import "../../../styles/auto.css";

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

  const concessionnaire = catalogue?.concessionnaire ?? null;
  const vehicules = catalogue?.vehicules ?? [];

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" sous={concessionnaire?.nom ?? "evo-auto"} />
          <Bascules langue={langue} />
        </div>
      </header>
      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit standard">
          <div className="standard__tete">
            <span className="cadc-badge cadc-badge--acier">{concessionnaire?.nom ?? "evo-auto"}</span>
            <h1>{t("catalogue.titre")}</h1>
            <p>{t("catalogue.chapo")}</p>
          </div>

          {vehicules.length === 0 ? (
            <p className="cadc-note">{t("catalogue.aucun")}</p>
          ) : (
            <ul className="standard-grille">
              {vehicules.map((un) => (
                <li className="appel" key={un.id}>
                  <span className="appel__cat">
                    {un.marque} · {un.annee}
                  </span>
                  <span className="appel__titre">{un.modele}</span>
                  <span className="appel__prix">{f.fcfa(un.prix)}</span>
                  <p className="appel__description">
                    {un.kilometrage.toLocaleString(langue === "en" ? "en-GB" : "fr-FR")} {t("vehicules.km")} · {t(`carburant.${un.carburant}`)} · {t(`boite.${un.boite}`)}
                  </p>
                  {un.note ? <p className="appel__lieu">{un.note}</p> : null}
                  {concessionnaire?.telephone ? (
                    <p className="appel__lieu">
                      <a href={`tel:${concessionnaire.telephone.replace(/\D/g, "")}`}>
                        {t("catalogue.appeler")} · {concessionnaire.telephone_display}
                      </a>
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          {catalogue?.lien && vehicules.length > 0 ? (
            <p className="cadc-note">
              <a
                className="cadc-bouton cadc-bouton--doux"
                href={`https://wa.me/?text=${encodeURIComponent(
                  `${concessionnaire?.nom ?? "evo-auto"} - ${vehicules.length} ${langue === "en" ? "vehicles for sale" : "véhicules à vendre"} : ${catalogue.lien}`,
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
