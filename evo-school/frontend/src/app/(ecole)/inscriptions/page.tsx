import type { Metadata } from "next";

import { InscriptionsGerant } from "@/components/inscriptions-gerant";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeDemandes } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Enrollment requests" : "Demandes d'inscription" };
}

export default async function PageInscriptions() {
  const session = await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const donnees = await lire<ListeDemandes>("/inscriptions", langue);
  const responsable = session.user.role === "responsable";

  return (
    <div className="cadc-gabarit ecole">
      <div className="ecole__tete">
        <span className="cadc-badge cadc-badge--acier">
          {donnees.demandees}/{donnees.total} {t("inscriptions.titre")}
        </span>
        <h1>{t("inscriptions.titre")}</h1>
        <p>{t("inscriptions.chapo")}</p>
      </div>

      <InscriptionsGerant
        demandes={donnees.demandes ?? []}
        langue={langue}
        responsable={responsable}
      />
    </div>
  );
}
