import type { Metadata } from "next";

import { MentionDemo } from "@/components/mention-demo";
import { PortailPointage } from "@/components/portail-pointage";
import { lire } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { Equipe, Etat } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Today's roll" : "Le pointage" };
}

export default async function PagePointage() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);

  const etat = await lire<Etat>("/etat", langue);
  const feuille = await lire<Equipe>(`/pointage?jour=${etat.jour}`, langue);

  const fini = etat.a_pointer === 0 && etat.effectif > 0;

  return (
    <div className="cadc-gabarit presence">
      <div className="presence__tete">
        <span className="cadc-badge cadc-badge--acier">{f.jourDate(etat.jour)}</span>
        <h1>{t("pointage.titre")}</h1>
        <p>{t("pointage.chapo")}</p>
      </div>

      <div className="portails">
        <section className="portail" aria-label={t("pointage.a_pointer")}>
          <span>
            <strong
              style={{
                display: "block",
                fontFamily: "var(--cadc-mono)",
                fontSize: "clamp(1.9rem,8vw,2.8rem)",
                lineHeight: 1.1,
              }}
            >
              {etat.a_pointer}
            </strong>
            <span className="cadc-champ__aide">
              {t("pointage.a_pointer")} · {etat.pointes}/{etat.effectif}{" "}
              {t("pointage.pointees")}
            </span>
          </span>
          <span className="portail__reste">
            {etat.par_statut.present} {t("etat.present")} · {etat.par_statut.retard}{" "}
            {t("etat.retard")} · {etat.par_statut.absent} {t("etat.absent")}
          </span>
        </section>
      </div>

      {fini ? <p className="cadc-note cadc-note--vert">{t("pointage.tout_fait")}</p> : null}

      <section className="cadc-carte" aria-label={t("pointage.titre")}>
        <div className="cadc-tete">
          <h2>{t("pointage.sur")} {f.date(etat.jour)}</h2>
        </div>
        <PortailPointage
          equipeInitiale={feuille.equipe}
          jourInitial={etat.jour}
          langue={langue}
        />
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
