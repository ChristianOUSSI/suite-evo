import type { Metadata } from "next";

import { PatientsGerant } from "@/components/patients-gerant";
import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListePatients } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Patients" : "Les patients" };
}

export default async function PagePatients({
  searchParams,
}: {
  searchParams: Promise<{ detteurs?: string }>;
}) {
  const session = await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const params = await searchParams;

  const liste = await lire<ListePatients>(
    params.detteurs === "1" ? "/patients?detteurs=true" : "/patients",
    langue,
  );
  const responsable = session.user.role === "responsable";

  return (
    <div className="cadc-gabarit clinique">
      <div className="clinique__tete">
        <span className="cadc-badge cadc-badge--acier">
          {liste.actifs}/{liste.total} {t("nav.patients")}
        </span>
        <h1>{t("patients.titre")}</h1>
        <p>{t("patients.chapo")}</p>
      </div>

      <section className="cadc-carte" aria-label={t("patients.nouveau")}>
        <PatientsGerant patients={liste.patients} langue={langue} responsable={responsable} />
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
