import type { Metadata } from "next";
import Link from "next/link";

import { RelanceActions } from "@/components/relance-actions";
import { lire } from "@/lib/api";
import { formats, retard } from "@/lib/format";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { FileDeRelances, Relance } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Reminders" : "Les relances" };
}

export default async function PageRelances() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);

  const file = await lire<FileDeRelances>("/relances", langue);
  const aujourdhui = file.du_jour.filter((un) => un.retard === 0);
  const total = file.en_retard.length + aujourdhui.length + file.a_venir.length;

  return (
    <div className="cadc-gabarit cadc-pile">
      <div className="carnet__tete">
        <span className="cadc-badge cadc-badge--acier">
          {file.en_retard.length} · {aujourdhui.length} · {file.a_venir.length}
        </span>
        <h1>{t("relance.titre")}</h1>
        <p>{t("relance.chapo")}</p>
      </div>

      {total === 0 ? (
        <p className="cadc-vide">
          <h3>{t("relance.aucune")}</h3>
          <Link href="/clients" className="cadc-bouton cadc-bouton--premier">
            {t("nav.clients")}
          </Link>
        </p>
      ) : null}

      {file.en_retard.length > 0 ? (
        <section className="cadc-carte" aria-label={t("stat.retards")}>
          <div className="cadc-tete">
            <h2>{t("stat.retards")}</h2>
            <span className="cadc-tete__cote">{file.en_retard.length}</span>
          </div>
          <div className="file">
            {file.en_retard.map((relance) => (
              <Rangee key={relance.id} relance={relance} enRetard langue={langue} t={t} f={f} />
            ))}
          </div>
        </section>
      ) : null}

      {aujourdhui.length > 0 ? (
        <section className="cadc-carte" aria-label={t("relance.due_le")}>
          <div className="cadc-tete">
            <h2>{t("carnet.titre")}</h2>
            <span className="cadc-tete__cote">{aujourdhui.length}</span>
          </div>
          <div className="file">
            {aujourdhui.map((relance) => (
              <Rangee key={relance.id} relance={relance} langue={langue} t={t} f={f} />
            ))}
          </div>
        </section>
      ) : null}

      {file.a_venir.length > 0 ? (
        <section className="cadc-carte" aria-label={t("carnet.prochain")}>
          <div className="cadc-tete">
            <h2>{t("carnet.prochain")}</h2>
            <span className="cadc-tete__cote">{file.a_venir.length}</span>
          </div>
          <div className="file">
            {file.a_venir.map((relance) => (
              <Rangee key={relance.id} relance={relance} langue={langue} t={t} f={f} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Rangee({
  relance,
  enRetard,
  langue,
  t,
  f,
}: {
  relance: Relance;
  enRetard?: boolean;
  langue: string;
  t: (cle: string, vars?: Record<string, string | number>) => string;
  f: ReturnType<typeof formats>;
}) {
  return (
    <div className="cadc-pile cadc-pile--serree">
      <div
        className={`due${enRetard ? " due--retard" : ""}${
          relance.origine === "devis" ? " due--devis" : ""
        }`}
      >
        <span className="due__rail" aria-hidden />
        <span>
          <span className="due__nom">
            <Link href={`/clients/${relance.client_id}`}>{relance.client}</Link>
          </span>
          <span className="due__motif">
            {relance.origine === "devis" && !relance.motif
              ? t("relance.devis")
              : relance.motif}
          </span>
        </span>
        <span className="due__cote">
          {f.date(relance.due_le)}
          <br />
          {retard(relance.retard, t)}
        </span>
      </div>
      <RelanceActions relanceId={relance.id} langue={langue} />
    </div>
  );
}
