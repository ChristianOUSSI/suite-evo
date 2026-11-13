import type { Metadata } from "next";
import Link from "next/link";

import { Bascules } from "@/components/bascules";
import { MentionDemo } from "@/components/mention-demo";
import { NomProduit } from "@/components/marque";
import { lirePublique } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { AnnoncesPubliques } from "@/lib/types";

import "../../../styles/immo.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return {
    title: langue === "en" ? "Listings" : "Les annonces",
    description:
      langue === "en"
        ? "Available properties from the agency — no account needed."
        : "Les biens disponibles de l'agence — aucun compte demandé.",
  };
}

export default async function PageAnnonces() {
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);

  const corps = await lirePublique<AnnoncesPubliques>("/public/annonces", langue).catch(() => null);
  const annonces = corps?.annonces ?? [];
  const agence = corps?.agence;

  const textePartage =
    langue === "en"
      ? `Discover the properties of ${agence?.nom ?? "the agency"}: ${annonces.length} available. ${typeof window !== "undefined" ? window.location.href : ""}`
      : `Découvrez les biens de ${agence?.nom ?? "l'agence"} : ${annonces.length} disponibles. ${typeof window !== "undefined" ? window.location.href : ""}`;

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" sous={agence?.nom} />
          <Bascules langue={langue} />
        </div>
      </header>

      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit immo">
          <div className="immo__tete">
            <span className="cadc-badge cadc-badge--acier">{annonces.length}</span>
            <h1>{t("annonces.titre")}</h1>
            <p>{t("annonces.chapo")}</p>
          </div>

          {agence ? (
            <section className="cadc-carte">
              <div className="cadc-tete">
                <h2>{agence.nom}</h2>
                <span className="cadc-tete__cote">
                  {agence.quartier || agence.ville}
                  {agence.telephone_display ? ` · ${agence.telephone_display}` : ""}
                </span>
              </div>
            </section>
          ) : null}

          {annonces.length === 0 ? (
            <p className="cadc-note cadc-note--acier">{t("annonces.aucune")}</p>
          ) : (
            <ul className="cadc-liste cadc-pile cadc-pile--serree">
              {annonces.map((un) => (
                <li className="cadc-ligne" key={un.id}>
                  <span className="cadc-ligne__nom">
                    {un.titre || `${t(`type.${un.type}`)} — ${un.quartier || un.ville}`}
                    <small>
                      {t(`type.${un.type}`)} · {un.ville}{un.quartier ? `, ${un.quartier}` : ""}
                      {un.surface_m2 ? ` · ${un.surface_m2} m²` : ""}
                      {un.chambres ? ` · ${un.chambres} ${t("annonces.chambres")}` : ""}
                    </small>
                    {un.description ? <small>{un.description}</small> : null}
                  </span>
                  <span className="cadc-ligne__valeur">
                    <strong>{f.fcfa(un.prix)}</strong>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="cadc-acts">
            <a
              className="cadc-bouton cadc-bouton--premier"
              href={`https://wa.me/?text=${encodeURIComponent(textePartage)}`}
              target="_blank"
              rel="noreferrer"
            >
              {t("annonces.partager")}
            </a>
            <Link href="/" className="cadc-bouton cadc-bouton--doux">
              evo-immo
            </Link>
          </div>

          <MentionDemo langue={langue} />
        </div>
      </main>
    </div>
  );
}
