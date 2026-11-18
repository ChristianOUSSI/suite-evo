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

function duree(secondes: number): string {
  const m = Math.floor(secondes / 60);
  const s = secondes % 60;
  return m ? `${m} min ${s} s` : `${s} s`;
}

export default async function PageRecap({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);
  const params = await searchParams;

  const periode = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.periode ?? "") ? (params.periode as string) : f.moisCourant();
  const resume = await lire<Recap>(`/recap?periode=${periode}`, langue);

  return (
    <div className="cadc-gabarit standard">
      <div className="standard__tete">
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
          <span className="souche__legende">{t("recap.creees")}</span>
          <span className="souche__valeur">{resume.creees_mois}</span>
          <span className="souche__aide">
            {resume.taches} {t("taches.toutes")}
          </span>
        </div>
        <div className="souche">
          <span className="souche__legende">{t("recap.terminees")}</span>
          <span className="souche__valeur" style={{ fontSize: "clamp(1.4rem,6vw,2.2rem)" }}>{resume.terminees_mois}</span>
          <span className="souche__aide">
            {resume.echecs_mois} {t("recap.echecs")}
          </span>
        </div>
        <div className="souche">
          <span className="souche__legende">{t("recap.executions")}</span>
          <span className="souche__valeur" style={{ fontSize: "clamp(1.4rem,6vw,2.2rem)" }}>{resume.executions_mois}</span>
          <span className="souche__aide">
            {duree(resume.secondes_mois)} {t("recap.temps")}
          </span>
        </div>
      </div>

      <section className="cadc-carte" aria-label={t("recap.par_type")}>
        <div className="cadc-tete">
          <h2>{t("recap.par_type")}</h2>
        </div>
        <ul className="cadc-liste cadc-pile cadc-pile--serree">
          {resume.par_type.map((un) => (
            <li className="cadc-ligne" key={un.type}>
              <span className="cadc-ligne__nom">{t(`ttype.${un.type}`)}</span>
              <span className="cadc-ligne__valeur">{un.taches}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="cadc-carte" aria-label={t("recap.par_statut")}>
        <div className="cadc-tete">
          <h2>{t("recap.par_statut")}</h2>
        </div>
        <ul className="cadc-liste cadc-pile cadc-pile--serree">
          {Object.entries(resume.par_statut).map(([statut, n]) => (
            <li className="cadc-ligne" key={statut}>
              <span className="cadc-ligne__nom">{t(`tstatut.${statut}`)}</span>
              <span className="cadc-ligne__valeur">{n}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="cadc-carte">
        <div className="cadc-acts">
          <a className="cadc-bouton cadc-bouton--doux" href="/api/exports/taches.csv" download>{t("recap.csv_taches")}</a>
          <a className="cadc-bouton cadc-bouton--doux" href="/api/exports/executions.csv" download>{t("recap.csv_executions")}</a>
        </div>
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
