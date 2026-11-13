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

  const statutsMoto = Object.entries(resume.par_statut_moto).sort((a, b) => b[1] - a[1]);
  const statutsRep = Object.entries(resume.par_statut_rep).sort((a, b) => b[1] - a[1]);

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
          <span className="souche__legende">{t("recap.vendues")}</span>
          <span className="souche__valeur">{resume.vendues_mois}</span>
          <span className="souche__aide">
            {t("recap.vendue")} · {f.court(resume.valeur_vendue_mois)}
          </span>
        </div>
        <div className="souche">
          <span className="souche__legende">{t("recap.atelier")}</span>
          <span className="souche__valeur" style={{ fontSize: "clamp(1.4rem,6vw,2.2rem)" }}>{f.court(resume.encaisse_atelier_mois)}</span>
          <span className="souche__aide">
            {resume.reparations_mois} {t("recap.reparations_mois")}
          </span>
        </div>
      </div>

      <section className="cadc-carte" aria-label={t("recap.par_marque")}>
        <div className="cadc-tete">
          <h2>{t("recap.par_marque")}</h2>
        </div>
        <ul className="cadc-liste cadc-pile cadc-pile--serree">
          {resume.par_marque.map((un) => (
            <li className="cadc-ligne" key={un.marque}>
              <span className="cadc-ligne__nom">{un.marque}</span>
              <span className="cadc-ligne__valeur">{un.motos}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="cadc-carte" aria-label={t("recap.par_statut_moto")}>
        <div className="cadc-tete">
          <h2>{t("recap.par_statut_moto")}</h2>
        </div>
        <ul className="cadc-liste cadc-pile cadc-pile--serree">
          {statutsMoto.map(([statut, n]) => (
            <li className="cadc-ligne" key={statut}>
              <span className="cadc-ligne__nom">{t(`statut.${statut}`)}</span>
              <span className="cadc-ligne__valeur">{n}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="cadc-carte" aria-label={t("recap.par_statut_rep")}>
        <div className="cadc-tete">
          <h2>{t("recap.par_statut_rep")}</h2>
        </div>
        <ul className="cadc-liste cadc-pile cadc-pile--serree">
          {statutsRep.map(([statut, n]) => (
            <li className="cadc-ligne" key={statut}>
              <span className="cadc-ligne__nom">{t(`rstatut.${statut}`)}</span>
              <span className="cadc-ligne__valeur">{n}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="cadc-carte">
        <div className="cadc-acts">
          <a className="cadc-bouton cadc-bouton--doux" href={`/api/exports/motos.csv?periode=${periode}`} download>{t("recap.csv_motos")}</a>
          <a className="cadc-bouton cadc-bouton--doux" href={`/api/exports/reparations.csv?periode=${periode}`} download>{t("recap.csv_reparations")}</a>
          <a className="cadc-bouton cadc-bouton--doux" href="/api/exports/clients.csv" download>{t("recap.csv_clients")}</a>
        </div>
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
