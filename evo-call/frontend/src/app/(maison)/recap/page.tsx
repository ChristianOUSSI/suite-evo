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
  const minutes = Math.floor(secondes / 60);
  const reste = secondes % 60;
  if (minutes === 0) return `${reste} s`;
  return reste ? `${minutes} min ${reste} s` : `${minutes} min`;
}

export default async function PageRecap({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);
  const params = await searchParams;

  const periode = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.periode ?? "") ? (params.periode as string) : f.moisCourant();
  const resume = await lire<Recap>(`/recap?periode=${periode}`, langue);

  const statuts = Object.entries(resume.par_statut).sort((a, b) => b[1] - a[1]);

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
          <span className="souche__legende">{t("recap.appels")}</span>
          <span className="souche__valeur">{resume.appels_mois}</span>
          <span className="souche__aide">
            {resume.appels} {t("recap.total")}
          </span>
        </div>
        <div className="souche">
          <span className="souche__legende">{t("recap.duree")}</span>
          <span className="souche__valeur" style={{ fontSize: "clamp(1.4rem,6vw,2.2rem)" }}>{duree(resume.duree_totale)}</span>
          <span className="souche__aide">
            {t("recap.duree_moyenne")} · {duree(resume.duree_moyenne)}
          </span>
        </div>
      </div>

      <section className="cadc-carte" aria-label={t("recap.par_agent")}>
        <div className="cadc-tete">
          <h2>{t("recap.par_agent")}</h2>
        </div>
        <ul className="cadc-liste cadc-pile cadc-pile--serree">
          {resume.par_agent.map((un) => (
            <li className="cadc-ligne" key={un.agent}>
              <span className="cadc-ligne__nom">{un.agent}</span>
              <span className="cadc-ligne__valeur">
                {un.appels} · {duree(un.duree)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="cadc-carte" aria-label={t("recap.par_motif")}>
        <div className="cadc-tete">
          <h2>{t("recap.par_motif")}</h2>
        </div>
        <ul className="cadc-liste cadc-pile cadc-pile--serree">
          {resume.par_motif.map((un) => (
            <li className="cadc-ligne" key={un.motif}>
              <span className="cadc-ligne__nom">{t(`motif.${un.motif}`)}</span>
              <span className="cadc-ligne__valeur">{un.appels}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="cadc-carte" aria-label={t("recap.par_statut")}>
        <div className="cadc-tete">
          <h2>{t("recap.par_statut")}</h2>
        </div>
        <ul className="cadc-liste cadc-pile cadc-pile--serree">
          {statuts.map(([statut, n]) => (
            <li className="cadc-ligne" key={statut}>
              <span className="cadc-ligne__nom">{t(`statut.${statut}`)}</span>
              <span className="cadc-ligne__valeur">{n}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="cadc-carte">
        <div className="cadc-acts">
          <a className="cadc-bouton cadc-bouton--doux" href={`/api/exports/appels.csv?periode=${periode}`} download>{t("recap.csv")}</a>
        </div>
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
