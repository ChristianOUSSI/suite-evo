import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Bascules } from "@/components/bascules";
import { NomProduit } from "@/components/marque";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";

import "../../../styles/docs.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Check a reference" : "Vérifier une référence" };
}

export default async function PageVerifier({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const params = await searchParams;
  const reference = (params.reference ?? "").trim().toUpperCase();

  if (reference) {
    redirect(`/verifier/${encodeURIComponent(reference)}`);
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
        <div className="cadc-gabarit classeur">
          <div className="classeur__tete">
            <span className="cadc-badge cadc-badge--acier">{t("verifier.titre")}</span>
            <h1>{t("verifier.titre")}</h1>
            <p>{t("verifier.chapo")}</p>
          </div>
          <section className="cadc-carte">
            <form method="get" action="/verifier" className="cadc-pile">
              <label className="cadc-champ">
                <span className="cadc-champ__titre">{t("verifier.reference")}</span>
                <input
                  name="reference"
                  required
                  maxLength={10}
                  autoComplete="off"
                  placeholder="K3JKTQ3EF6"
                  style={{ textTransform: "uppercase", fontFamily: "var(--cadc-mono)" }}
                />
              </label>
              <div className="cadc-acts">
                <button type="submit" className="cadc-bouton cadc-bouton--premier">
                  {t("verifier.chercher")}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
