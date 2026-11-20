import type { Metadata } from "next";

import { RendezVousGerant } from "@/components/rendez-vous-gerant";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeRendezVous } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Appointments" : "Rendez-vous" };
}

export default async function PageRendezVous() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const donnees = await lire<ListeRendezVous>("/rendez-vous", langue);

  return (
    <div className="cadc-gabarit clinique">
      <div className="clinique__tete">
        <span className="cadc-badge cadc-badge--acier">
          {donnees.demandes}/{donnees.total} {t("rdvs.titre")}
        </span>
        <h1>{t("rdvs.titre")}</h1>
        <p>{t("rdvs.chapo")}</p>
      </div>

      <RendezVousGerant rendezVous={donnees.rendez_vous ?? []} langue={langue} />
    </div>
  );
}
