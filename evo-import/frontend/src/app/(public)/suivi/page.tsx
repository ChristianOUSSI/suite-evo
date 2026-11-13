import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { SuiviGerant } from "@/components/suivi-gerant";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return {
    title: langue === "en" ? "Track a shipment" : "Suivre un envoi",
    description: langue === "en"
      ? "Track your shipment by its tracking number — no account needed."
      : "Suivez votre envoi avec son numéro de suivi — aucun compte n'est demandé.",
  };
}

export default async function PageSuivi() {
  const langue = await langueCourante();
  const t = traduire(langue).t;

  return (
    <div className="cadc-gabarit standard">
      <div className="standard__tete">
        <span className="cadc-badge cadc-badge--acier">{t("nav.envois")}</span>
        <h1>{t("suivi.titre")}</h1>
        <p>{t("suivi.chapo")}</p>
      </div>
      <Suspense>
        <SuiviGerant langue={langue} />
      </Suspense>
      <p className="cadc-note cadc-note--acier" style={{ marginTop: 24 }}>
        <Link href="/connexion" className="cadc-bouton cadc-bouton--doux cadc-bouton--petit">
          {t("commun.retour")}
        </Link>
      </p>
    </div>
  );
}
