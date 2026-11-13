import type { Metadata } from "next";
import Link from "next/link";

import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { Appel, ListeAppels } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Callbacks" : "Les rappels" };
}

export default async function PageRappels() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);

  const corps = await lire<ListeAppels>("/appels?statut=rappel", langue);
  const rappels = corps.appels;

  return (
    <div className="cadc-gabarit standard">
      <div className="standard__tete">
        <span className="cadc-badge cadc-badge--acier">{rappels.length}</span>
        <h1>{t("rappels.titre")}</h1>
        <p>{t("rappels.chapo")}</p>
      </div>

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {rappels.map((un: Appel) => (
          <li className="cadc-ligne" key={un.id}>
            <span className="cadc-ligne__nom">
              {un.client_nom || t(`sens.${un.sens}`)}
              <small>
                {un.client_telephone_display || "—"} · {t(`motif.${un.motif}`)}
                {un.agent ? ` · ${un.agent}` : ""}
              </small>
              {un.note ? <small>{un.note}</small> : null}
            </span>
            <span className="cadc-ligne__valeur">
              {un.date_rappel ? (
                <span className="cadc-note cadc-note--acier">{f.jourDate(un.date_rappel)}</span>
              ) : (
                <span className="cadc-note cadc-note--rouge">—</span>
              )}
              <Link href={`/appels`} className="cadc-bouton cadc-bouton--petit cadc-bouton--doux">
                {t("rappels.fait")}
              </Link>
            </span>
          </li>
        ))}
        {rappels.length === 0 ? (
          <li className="cadc-note">{t("rappels.aucun")}</li>
        ) : null}
      </ul>

      <MentionDemo langue={langue} />
    </div>
  );
}
