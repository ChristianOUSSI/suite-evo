import type { Metadata } from "next";

import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { Journal } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "The log" : "Le journal" };
}

export default async function PageJournal() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);

  const journal = await lire<Journal>("/journal?jours=30", langue);

  return (
    <div className="cadc-gabarit chantier">
      <div className="chantier__tete">
        <span className="cadc-badge cadc-badge--acier">
          {journal.lignes.length} {t("commun.pointages")}
        </span>
        <h1>{t("journal.titre")}</h1>
        <p>{t("journal.chapo")}</p>
      </div>

      <section className="cadc-carte" aria-label={t("journal.titre")}>
        {journal.lignes.length === 0 ? (
          <p className="cadc-note">{t("journal.vide")}</p>
        ) : (
          <ul className="cadc-liste cadc-pile cadc-pile--serree">
            {journal.lignes.map((ligne) => (
              <li className="cadc-ligne" key={ligne.id}>
                <span className="cadc-ligne__nom">
                  {ligne.employe}
                  <small>
                    {f.date(ligne.jour)}
                    {ligne.service ? ` · ${ligne.service}` : ""}
                    {ligne.note ? ` · ${ligne.note}` : ""}
                  </small>
                </span>
                <span className="cadc-ligne__valeur">
                  {ligne.arrivee || "-"} → {ligne.depart || "-"}
                  <br />
                  <span
                    className={`cadc-badge ${
                      ligne.statut === "present"
                        ? "cadc-badge--vert"
                        : ligne.statut === "retard"
                          ? "cadc-badge--doux"
                          : "cadc-badge--rouge"
                    }`}
                  >
                    {t(`etat.${ligne.statut}`)}
                  </span>
                  {ligne.par ? <small style={{ display: "block" }}>{ligne.par}</small> : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
