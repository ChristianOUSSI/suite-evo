import type { Metadata } from "next";

import { ClientsGerant } from "@/components/clients-gerant";
import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeClients } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Guests" : "Les clients" };
}

export default async function PageClients() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const liste = await lire<ListeClients>("/clients", langue);

  return (
    <div className="cadc-gabarit hotel">
      <div className="hotel__tete">
        <span className="cadc-badge cadc-badge--acier">
          {liste.actifs} {t("clients.nom").toLowerCase()} · {liste.total - liste.actifs} —
        </span>
        <h1>{t("clients.titre")}</h1>
        <p>{t("clients.chapo")}</p>
      </div>

      <section className="cadc-carte" aria-label={t("clients.nouveau")}>
        <ClientsGerant clients={liste.clients} langue={langue} />
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
