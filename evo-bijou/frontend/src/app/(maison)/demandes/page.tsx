import type { Metadata } from "next";

import { DemandesGerant } from "@/components/demandes-gerant";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeDemandes } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Reservation requests" : "Demandes de réservation" };
}

export default async function PageDemandes() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const donnees = await lire<ListeDemandes>("/demandes", langue);

  return (
    <div className="cadc-gabarit standard">
      <div className="standard__tete">
        <span className="cadc-badge cadc-badge--acier">
          {donnees.en_attente}/{donnees.total} {t("demandes.titre")}
        </span>
        <h1>{t("demandes.titre")}</h1>
        <p>{t("demandes.chapo")}</p>
      </div>

      <DemandesGerant demandes={donnees.demandes ?? []} langue={langue} />
    </div>
  );
}
