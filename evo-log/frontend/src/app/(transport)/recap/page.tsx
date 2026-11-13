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

  const statuts = Object.entries(resume.par_statut).sort((a, b) => b[1] - a[1]);

  return (
    <div className="cadc-gabarit log">
      <div className="log__tete">
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
          <span className="souche__legende">{t("recap.deposes")}</span>
          <span className="souche__valeur">{resume.deposes}</span>
          <span className="souche__aide">
            {t("recap.distribues")} : {resume.par_statut.distribue ?? 0} · {resume.poids_mois} kg
          </span>
        </div>
        <div className="souche">
          <span className="souche__legende">{t("recap.frais_mois")}</span>
          <span className="souche__valeur">{f.fcfa(resume.frais_mois)}</span>
          <span className="souche__aide">
            {t("recap.a_percevoir")} : {f.fcfa(resume.a_percevoir)}
          </span>
        </div>
      </div>

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

      <section className="cadc-carte" aria-label={t("recap.par_trajet")}>
        <div className="cadc-tete">
          <h2>{t("recap.par_trajet")}</h2>
        </div>
        <ul className="cadc-liste cadc-pile cadc-pile--serree">
          {resume.par_trajet.map((un) => (
            <li className="cadc-ligne" key={un.trajet}>
              <span className="cadc-ligne__nom">
                {un.trajet}
                <small>{un.colis} {t("accueil.colis")}</small>
              </span>
              <span className="cadc-ligne__valeur">{f.fcfa(un.frais)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="cadc-carte" aria-label={t("recap.par_genre")}>
        <div className="cadc-tete">
          <h2>{t("recap.par_genre")}</h2>
        </div>
        <ul className="cadc-liste cadc-pile cadc-pile--serree">
          {resume.par_genre.map((un) => (
            <li className="cadc-ligne" key={un.genre}>
              <span className="cadc-ligne__nom">{t(`genre.${un.genre}`)}</span>
              <span className="cadc-ligne__valeur">{un.colis}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="cadc-carte">
        <div className="cadc-acts">
          <a className="cadc-bouton cadc-bouton--doux" href="/api/exports/colis.csv" download>{t("recap.csv")} · {t("nav.colis")}</a>
          <a className="cadc-bouton cadc-bouton--doux" href="/api/exports/suivis.csv" download>{t("recap.csv")} · {t("nav.colis")}</a>
        </div>
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
