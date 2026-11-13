import type { Metadata } from "next";

import { ClassesGerant } from "@/components/classes-gerant";
import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeClasses } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Classes" : "Les classes" };
}

export default async function PageClasses() {
  const session = await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const liste = await lire<ListeClasses>("/classes", langue);
  const responsable = session.user.role === "responsable";

  return (
    <div className="cadc-gabarit ecole">
      <div className="ecole__tete">
        <span className="cadc-badge cadc-badge--acier">
          {liste.actives}/{liste.total} {t("nav.classes")}
        </span>
        <h1>{t("classes.titre")}</h1>
        <p>{t("classes.chapo")}</p>
      </div>

      <section className="cadc-carte" aria-label={t("classes.nouvelle")}>
        <ClassesGerant classes={liste.classes} langue={langue} responsable={responsable} />
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
