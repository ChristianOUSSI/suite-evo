import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Bascules } from "@/components/bascules";
import { NomProduit } from "@/components/marque";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";

import "../../../styles/log.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Track a parcel" : "Suivre un colis" };
}

export default async function PageSuivi({
  searchParams,
}: {
  searchParams: Promise<{ numero?: string }>;
}) {
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const params = await searchParams;
  const numero = (params.numero ?? "").trim().toUpperCase();

  if (numero) {
    redirect(`/suivi/${encodeURIComponent(numero)}`);
  }

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" />
          <Bascules langue={langue} />
        </div>
      </header>
      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit log">
          <div className="log__tete">
            <span className="cadc-badge cadc-badge--acier">{t("suivi.titre")}</span>
            <h1>{t("suivi.titre")}</h1>
            <p>{t("suivi.chapo")}</p>
          </div>
          <section className="cadc-carte">
            <form method="get" action="/suivi" className="cadc-pile">
              <label className="cadc-champ">
                <span className="cadc-champ__titre">{t("suivi.numero")}</span>
                <input
                  name="numero"
                  required
                  maxLength={10}
                  autoComplete="off"
                  placeholder="K3JKTQ3EF6"
                  style={{ textTransform: "uppercase", fontFamily: "var(--cadc-mono)" }}
                />
              </label>
              <div className="cadc-acts">
                <button type="submit" className="cadc-bouton cadc-bouton--premier">
                  {t("suivi.chercher")}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
