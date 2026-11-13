import type { Metadata } from "next";

import { LivraisonsGerant } from "@/components/livraisons-gerant";
import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeClients, ListeLivraisons } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Deliveries" : "Les livraisons" };
}

export default async function PageLivraisons() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const [corps, clients] = await Promise.all([
    lire<ListeLivraisons>("/livraisons", langue),
    lire<ListeClients>("/clients", langue),
  ]);

  return (
    <div className="cadc-gabarit standard">
      <div className="standard__tete">
        <span className="cadc-badge cadc-badge--acier">{corps.total} {t("accueil.livraisons")}</span>
        <h1>{t("livraisons.titre")}</h1>
        <p>{t("livraisons.chapo")}</p>
      </div>

      <LivraisonsGerant livraisons={corps.livraisons} clients={clients.clients} langue={langue} />
      <MentionDemo langue={langue} />
    </div>
  );
}
