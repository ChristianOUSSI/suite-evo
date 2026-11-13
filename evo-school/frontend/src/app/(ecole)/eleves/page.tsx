import type { Metadata } from "next";

import { ElevesGerant } from "@/components/eleves-gerant";
import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeClasses, ListeEleves } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Students" : "Les élèves" };
}

export default async function PageEleves({ searchParams }: { searchParams: Promise<{ restants?: string }> }) {
  const session = await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const params = await searchParams;
  const restants = params.restants === "1";

  const [eleves, classes] = await Promise.all([
    lire<ListeEleves>(restants ? "/eleves?restants=true" : "/eleves", langue),
    lire<ListeClasses>("/classes", langue),
  ]);
  const responsable = session.user.role === "responsable";

  return (
    <div className="cadc-gabarit ecole">
      <div className="ecole__tete">
        <span className="cadc-badge cadc-badge--acier">
          {eleves.eleves.length} {t("nav.eleves")}
        </span>
        <h1>{t("eleves.titre")}</h1>
        <p>{t("eleves.chapo")}</p>
      </div>

      <section className="cadc-carte" aria-label={t("eleves.nouveau")}>
        <ElevesGerant eleves={eleves.eleves} classes={classes.classes} langue={langue} responsable={responsable} />
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
