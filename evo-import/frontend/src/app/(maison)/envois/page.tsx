import type { Metadata } from "next";

import { EnvoisGerant } from "@/components/envois-gerant";
import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeClients, ListeEnvois } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Shipments" : "Les envois" };
}

export default async function PageEnvois() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const [corps, clients] = await Promise.all([
    lire<ListeEnvois>("/envois", langue),
    lire<ListeClients>("/clients", langue),
  ]);

  return (
    <div className="cadc-gabarit standard">
      <div className="standard__tete">
        <span className="cadc-badge cadc-badge--acier">{corps.total} {t("accueil.envois")}</span>
        <h1>{t("envois.titre")}</h1>
        <p>{t("envois.chapo")}</p>
      </div>

      <EnvoisGerant envois={corps.envois} clients={clients.clients} langue={langue} />
      <MentionDemo langue={langue} />
    </div>
  );
}
