import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Bascules } from "@/components/bascules";
import { NomProduit } from "@/components/marque";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Check a receipt" : "Vérifier un reçu" };
}

export default async function PageVerifier({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const params = await searchParams;
  const code = (params.code ?? "").trim().toUpperCase();

  if (code) {
    redirect(`/verifier/${encodeURIComponent(code)}`);
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
        <div className="cadc-gabarit ecole">
          <div className="ecole__tete">
            <span className="cadc-badge cadc-badge--acier">{t("verifier.titre")}</span>
            <h1>{t("verifier.titre")}</h1>
            <p>{t("verifier.chapo")}</p>
          </div>
          <section className="cadc-carte">
            <form method="get" action="/verifier" className="cadc-pile">
              <label className="cadc-champ">
                <span className="cadc-champ__titre">{t("verifier.code")}</span>
                <input
                  name="code"
                  required
                  maxLength={12}
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
