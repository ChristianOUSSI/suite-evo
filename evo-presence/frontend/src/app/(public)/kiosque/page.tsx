import type { Metadata } from "next";
import Link from "next/link";

import { Bascules } from "@/components/bascules";
import { KiosquePointage } from "@/components/kiosque-pointage";
import { NomProduit } from "@/components/marque";
import { lireOuRien } from "@/lib/api";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { EcranPointage } from "@/lib/types";

import "../../../styles/presence.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return {
    title: langue === "en" ? "Clock in or out" : "Pointer sa présence",
    robots: { index: false, follow: false },
  };
}

export default async function PageKiosque() {
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const ecran = await lireOuRien<EcranPointage>("/public/pointage", langue);
  const entreprise = ecran?.entreprise ?? null;

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" sous={entreprise?.nom ?? "evo-presence"} />
          <Bascules langue={langue} />
        </div>
      </header>
      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit--etroit cadc-pile">
          <div className="presence__tete">
            <span className="cadc-badge cadc-badge--acier">
              {entreprise ? `${entreprise.nom} · ${entreprise.ville}` : "evo-presence"}
            </span>
            <h1>{t("kiosque.titre")}</h1>
            <p>{t("kiosque.chapo")}</p>
          </div>

          {entreprise ? (
            <KiosquePointage langue={langue} />
          ) : (
            <p className="cadc-note">{t("kiosque.vide")}</p>
          )}

          <div className="cadc-acts">
            <Link href="/verifier" className="cadc-bouton cadc-bouton--doux">
              {t("kiosque.verifier")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
