import type { Metadata } from "next";

import { ActesGerant } from "@/components/actes-gerant";
import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeActes, ListePatients } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Records" : "Les actes" };
}

export default async function PageActes() {
  const session = await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const [actes, patients] = await Promise.all([
    lire<ListeActes>("/actes?limite=300", langue),
    lire<ListePatients>("/patients", langue),
  ]);
  const responsable = session.user.role === "responsable";

  return (
    <div className="cadc-gabarit clinique">
      <div className="clinique__tete">
        <span className="cadc-badge cadc-badge--acier">
          {actes.actes.length} {t("nav.actes")}
        </span>
        <h1>{t("actes.titre")}</h1>
        <p>{t("actes.chapo")}</p>
      </div>

      <section className="cadc-carte" aria-label={t("actes.nouveau")}>
        <ActesGerant actes={actes.actes} patients={patients.patients} langue={langue} responsable={responsable} />
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
