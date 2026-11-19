import type { Metadata } from "next";

import { Bascules } from "@/components/bascules";
import { NomProduit } from "@/components/marque";
import { lirePublique } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { BoutiquePublique } from "@/lib/types";

import "../../../styles/market.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Shop listings" : "Les articles de la boutique" };
}

export default async function PageAnnoncesPubliques({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string }>;
}) {
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);
  const params = await searchParams;
  const categorie = params.categorie ?? "";

  const corps = await lirePublique<BoutiquePublique>("/public/annonces", langue);
  const boutique = corps.boutique;
  const annonces = corps.annonces.filter(
    (un) => !categorie || un.categorie === categorie,
  );

  const categories = [...new Set(corps.annonces.map((un) => un.categorie))];

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" sous={boutique?.nom ?? "CODE AXIS DIGITAL CAMEROON"} />
          <Bascules langue={langue} />
        </div>
      </header>
      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit marche">
          <div className="marche__tete">
            <span className="cadc-badge cadc-badge--acier">{t("pub.titre")}</span>
            <h1>{boutique?.nom ?? t("pub.boutique")}</h1>
            <p>{t("pub.chapo")}</p>
            {boutique ? (
              <p className="cadc-champ__aide">
                {boutique.ville}
                {boutique.quartier ? ` · ${boutique.quartier}` : ""}
                {boutique.telephone_display ? ` · ${boutique.telephone_display}` : ""}
              </p>
            ) : null}
          </div>

          {categories.length > 1 ? (
            <nav className="cadc-acts" aria-label={t("annonces.categorie")}>
              <a
                href="/catalogue"
                className={`cadc-bouton cadc-bouton--petit${!categorie ? " cadc-bouton--premier" : " cadc-bouton--doux"}`}
              >
                {t("pub.cat-choix")}
              </a>
              {categories.map((un) => (
                <a
                  key={un}
                  href={`/catalogue?categorie=${encodeURIComponent(un)}`}
                  className={`cadc-bouton cadc-bouton--petit${categorie === un ? " cadc-bouton--premier" : " cadc-bouton--doux"}`}
                >
                  {t(`categorie.${un}`)}
                </a>
              ))}
            </nav>
          ) : null}

          {annonces.length === 0 ? (
            <p className="cadc-note">{t("pub.vide")}</p>
          ) : (
            <ul className="annonces-grille">
              {annonces.map((un) => (
                <li className="annonce" key={un.id}>
                  <span className="annonce__cat">{t(`categorie.${un.categorie}`)}</span>
                  <strong className="annonce__titre">{un.titre}</strong>
                  <span className="annonce__prix">{f.fcfa(un.prix)}</span>
                  {un.description ? <p className="annonce__description">{un.description}</p> : null}
                  <span className="annonce__lieu">
                    {un.quartier ? `${un.quartier} · ` : ""}
                    {un.ville} · {un.stock > 0 ? `${un.stock} ${t("pub.stock")}` : t("pub.rupture")}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {boutique?.telephone ? (
            <div className="cadc-acts">
              <a className="cadc-bouton cadc-bouton--grand cadc-bouton--premier" href={`tel:${boutique.telephone}`}>
                {t("pub.appeler")}
              </a>
            </div>
          ) : null}
          { corps.lien ? (
            <p className="cadc-note">
              <a
                className="cadc-bouton cadc-bouton--doux"
                href={`https://wa.me/?text=${encodeURIComponent(
                  `${ boutique?.nom ?? "evo-market" } - ${annonces.length} ${langue === "en" ? "items" : "articles"} : ${corps.lien}`,
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                {t("pub.partager")}
              </a>
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
