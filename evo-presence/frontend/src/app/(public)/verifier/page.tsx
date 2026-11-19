import type { Metadata } from "next";

import { VerifCode } from "@/components/verif-code";
import { MentionDemo } from "@/components/mention-demo";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return {
    title: langue === "en" ? "Check a month" : "Vérifier un mois",
    robots: { index: true, follow: true },
  };
}

export default async function PageVerif() {
  const langue = await langueCourante();
  const t = traduire(langue).t;

  return (
    <div className="cadc-gabarit--etroit cadc-pile verif">
      <div className="presence__tete">
        <span className="cadc-badge cadc-badge--acier">CODE AXIS DIGITAL CAMEROON</span>
        <h1>{t("bulletin.titre")}</h1>
        <p>{t("bulletin.chapo")}</p>
      </div>

      <section className="cadc-carte" aria-label={t("bulletin.code")}>
        <VerifCode langue={langue} />
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
