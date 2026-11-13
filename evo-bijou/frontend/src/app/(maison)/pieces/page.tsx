import type { Metadata } from "next";

import { PiecesGerant } from "@/components/pieces-gerant";
import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeClients, ListePieces } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Pieces" : "Les pièces" };
}

export default async function PagePieces() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const [corps, clients] = await Promise.all([
    lire<ListePieces>("/pieces", langue),
    lire<ListeClients>("/clients", langue),
  ]);

  return (
    <div className="cadc-gabarit standard">
      <div className="standard__tete">
        <span className="cadc-badge cadc-badge--acier">{corps.total} {t("accueil.pieces")}</span>
        <h1>{t("pieces.titre")}</h1>
        <p>{t("pieces.chapo")}</p>
      </div>

      <PiecesGerant pieces={corps.pieces} clients={clients.clients} langue={langue} />
      <MentionDemo langue={langue} />
    </div>
  );
}
