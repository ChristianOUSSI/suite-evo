import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Bascules } from "@/components/bascules";
import { NomProduit } from "@/components/marque";
import { lirePublique } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { SuiviPublic, SuiviReponse } from "@/lib/types";

import "../../../../styles/log.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Parcel tracking" : "Suivi du colis" };
}

export default async function PageSuiviNumero({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);
  const { numero } = await params;

  let suivi: SuiviPublic | null = null;
  let lien = "";
  try {
    const corps = await lirePublique<SuiviReponse>(
      `/public/suivi/${encodeURIComponent(numero)}`,
      langue,
    );
    suivi = corps.colis;
    lien = corps.lien ?? "";
  } catch {
    suivi = null;
  }

  if (!suivi) {
    notFound();
  }

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" sous={suivi.transporteur} />
          <Bascules langue={langue} />
        </div>
      </header>
      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit log">
          <div className="log__tete">
            <span className="cadc-badge cadc-badge--acier">{suivi.numero}</span>
            <h1>{t("suivi.trouve")}</h1>
            <p>
              {t(`statut.${suivi.statut}`)} · {suivi.depart} → {suivi.arrivee}
            </p>
          </div>

          <section className="cadc-carte">
            <ul className="cadc-liste cadc-pile cadc-pile--serree">
              <li className="cadc-ligne">
                <span className="cadc-ligne__nom">{t("suivi.genre")}</span>
                <span className="cadc-ligne__valeur">{t(`genre.${suivi.genre}`)}</span>
              </li>
              <li className="cadc-ligne">
                <span className="cadc-ligne__nom">{t("suivi.trajet")}</span>
                <span className="cadc-ligne__valeur">
                  {suivi.depart} → {suivi.arrivee}
                </span>
              </li>
              <li className="cadc-ligne">
                <span className="cadc-ligne__nom">{t("suivi.depot")}</span>
                <span className="cadc-ligne__valeur">{f.jourDate(suivi.date_depot)}</span>
              </li>
              {suivi.date_livraison ? (
                <li className="cadc-ligne">
                  <span className="cadc-ligne__nom">{t("suivi.livraison")}</span>
                  <span className="cadc-ligne__valeur">{f.jourDate(suivi.date_livraison)}</span>
                </li>
              ) : null}
              <li className="cadc-ligne">
                <span className="cadc-ligne__nom">{t("suivi.transporteur")}</span>
                <span className="cadc-ligne__valeur">
                  {suivi.transporteur} · {suivi.ville}
                  {suivi.telephone_display ? ` · ${suivi.telephone_display}` : ""}
                </span>
              </li>
            </ul>
          </section>

          <div className="cadc-acts">
            {suivi.telephone ? (
              <a className="cadc-bouton cadc-bouton--premier" href={`tel:${suivi.telephone}`}>
                {t("suivi.appeler")}
              </a>
            ) : null}
            <Link href="/suivi" className="cadc-bouton cadc-bouton--doux">
              {t("suivi.chercher")}
            </Link>
            {lien ? (
              <a
                className="cadc-bouton cadc-bouton--doux"
                href={`https://wa.me/?text=${encodeURIComponent(
                  `${suivi.numero} - ${suivi.transporteur} : ${lien}`,
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                {t("suivi.partager")}
              </a>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
