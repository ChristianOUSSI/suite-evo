import type { Metadata } from "next";
import Link from "next/link";

import { Bascules } from "@/components/bascules";
import { NomProduit } from "@/components/marque";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return {
    title: langue === "en" ? "Page not found" : "Page introuvable",
    robots: { index: false, follow: false },
  };
}

export default async function PagePerdue() {
  const langue = await langueCourante();
  const t = traduire(langue).t;

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" />
          <Bascules langue={langue} />
        </div>
      </header>

      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit--etroit cadc-pile">
          <span className="cadc-badge cadc-badge--rouge">404</span>
          <h1 style={{ fontSize: "clamp(1.7rem,7vw,2.4rem)" }}>{t("commun.page-perdue")}</h1>
          <p style={{ color: "var(--cadc-encre-2)" }}>{t("commun.page-perdue-aide")}</p>
          <div className="cadc-acts">
            <Link href="/accueil" className="cadc-bouton cadc-bouton--premier">
              {t("nav.accueil")}
            </Link>
            <Link href="/articles" className="cadc-bouton">
              {t("nav.articles")}
            </Link>
            <Link href="/" className="cadc-bouton cadc-bouton--doux">
              {t("commun.retour")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
