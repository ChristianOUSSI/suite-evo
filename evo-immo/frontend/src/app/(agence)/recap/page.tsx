import type { Metadata } from "next";
import Link from "next/link";

import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { Recap } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "The month" : "Le mois" };
}

function decalagePeriode(periode: string, n: number): string {
  const [annee, mois] = periode.split("-").map(Number);
  const total = annee * 12 + (mois - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

export default async function PageRecap({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);
  const params = await searchParams;

  const periode = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.periode ?? "") ? (params.periode as string) : f.moisCourant();
  const resume = await lire<Recap>(`/recap?periode=${periode}`, langue);

  const issues = Object.entries(resume.par_issue).sort((a, b) => b[1] - a[1]);

  return (
    <div className="cadc-gabarit immo">
      <div className="immo__tete">
        <span className="cadc-badge cadc-badge--acier">{t("nav.recap")}</span>
        <h1>{t("recap.titre")}</h1>
        <p>{t("recap.chapo")}</p>
      </div>

      <section className="cadc-carte" aria-label={t("recap.periode")}>
        <div className="cadc-acts">
          <Link href={`/recap?periode=${decalagePeriode(periode, -1)}`} className="cadc-bouton cadc-bouton--doux cadc-bouton--petit">{t("recap.avant")}</Link>
          <strong style={{ alignSelf: "center" }}>{f.moisDe(periode)}</strong>
          <Link href={`/recap?periode=${decalagePeriode(periode, 1)}`} className="cadc-bouton cadc-bouton--doux cadc-bouton--petit">{t("recap.apres")}</Link>
        </div>
      </section>

      <div className="portails">
        <div className="souche">
          <span className="souche__legende">{t("recap.visites")}</span>
          <span className="souche__valeur">{resume.visites}</span>
          <span className="souche__aide">
            {resume.demandes} {t("recap.demandes")}
          </span>
        </div>
        <div className="souche">
          <span className="souche__legende">{t("recap.ventes_mois")}</span>
          <span className="souche__valeur">{f.fcfa(resume.ventes_mois)}</span>
          <span className="souche__aide">
            {t("recap.ventes_total")} : {f.fcfa(resume.ventes_total)}
          </span>
        </div>
      </div>

      <section className="cadc-carte" aria-label={t("recap.par_issue")}>
        <div className="cadc-tete">
          <h2>{t("recap.par_issue")}</h2>
        </div>
        <ul className="cadc-liste cadc-pile cadc-pile--serree">
          {issues.map(([issue, n]) => (
            <li className="cadc-ligne" key={issue}>
              <span className="cadc-ligne__nom">{t(`issue.${issue}`)}</span>
              <span className="cadc-ligne__valeur">{n}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="cadc-carte" aria-label={t("recap.par_type")}>
        <div className="cadc-tete">
          <h2>{t("recap.par_type")}</h2>
        </div>
        <ul className="cadc-liste cadc-pile cadc-pile--serree">
          {resume.par_type.map((un) => (
            <li className="cadc-ligne" key={un.type}>
              <span className="cadc-ligne__nom">
                {t(`type.${un.type}`)}
                <small>{un.biens} {t("accueil.biens")}</small>
              </span>
              <span className="cadc-ligne__valeur">{f.fcfa(un.valeur)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="cadc-carte" aria-label={t("recap.par_quartier")}>
        <div className="cadc-tete">
          <h2>{t("recap.par_quartier")}</h2>
        </div>
        <ul className="cadc-liste cadc-pile cadc-pile--serree">
          {resume.par_quartier.map((un) => (
            <li className="cadc-ligne" key={un.quartier}>
              <span className="cadc-ligne__nom">{un.quartier}</span>
              <span className="cadc-ligne__valeur">{un.demandes}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="cadc-carte">
        <div className="cadc-acts">
          <a className="cadc-bouton cadc-bouton--doux" href="/api/exports/biens.csv" download>{t("recap.csv")} · {t("nav.biens")}</a>
          <a className="cadc-bouton cadc-bouton--doux" href="/api/exports/demandes.csv" download>{t("recap.csv")} · {t("nav.demandes")}</a>
          <a className="cadc-bouton cadc-bouton--doux" href="/api/exports/visites.csv" download>{t("recap.csv")} · {t("nav.visites")}</a>
        </div>
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
