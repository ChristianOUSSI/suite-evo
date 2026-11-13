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

export default async function PageRecap({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);
  const params = await searchParams;

  const periode = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.periode ?? "")
    ? (params.periode as string)
    : f.moisCourant();

  const resume = await lire<Recap>(`/recap?periode=${periode}`, langue);

  return (
    <div className="cadc-gabarit hotel">
      <div className="hotel__tete">
        <span className="cadc-badge cadc-badge--acier">{t("nav.recap")}</span>
        <h1>{t("recap.titre")}</h1>
        <p>{t("recap.chapo")}</p>
      </div>

      <section className="cadc-carte" aria-label={t("recap.periode")}>
        <div className="cadc-acts">
          <Link href={`/recap?periode=${decalagePeriode(periode, -1)}`} className="cadc-bouton cadc-bouton--doux cadc-bouton--petit">
            {t("recap.avant")}
          </Link>
          <strong style={{ alignSelf: "center" }}>{f.moisDe(periode)}</strong>
          <Link href={`/recap?periode=${decalagePeriode(periode, 1)}`} className="cadc-bouton cadc-bouton--doux cadc-bouton--petit">
            {t("recap.apres")}
          </Link>
        </div>
      </section>

      <div className="portails">
        <div className="souche">
          <span className="souche__legende">{t("recap.montant")}</span>
          <span className="souche__valeur">{f.fcfa(resume.montant)}</span>
          <span className="souche__aide">
            {resume.nuits_vendues}/{resume.capacite_nuits} {t("recap.nuits")} ·{" "}
            {f.pourcentage(resume.taux_occupation)} {t("recap.occupation")} ·{" "}
            {resume.arrivees} {t("recap.arrivees")}
          </span>
        </div>
      </div>

      <section className="cadc-carte" aria-label={t("recap.par_chambre")}>
        <div className="cadc-tete">
          <h2>{t("recap.par_chambre")}</h2>
        </div>
        <ul className="cadc-liste cadc-pile cadc-pile--serree">
          {resume.par_chambre.map((un) => (
            <li className="cadc-ligne" key={un.chambre_id}>
              <span className="cadc-ligne__nom">
                {un.numero}
                <small>{t(`type.${un.type}`)}</small>
              </span>
              <span className="cadc-ligne__valeur">
                {un.nuits} {t("sejours.nuits")}
                <br />
                <small>{f.fcfa(un.montant)}</small>
              </span>
            </li>
          ))}
        </ul>
        <div className="cadc-acts" style={{ marginTop: 12 }}>
          <a className="cadc-bouton cadc-bouton--doux" href={`/api/exports/recap.csv?periode=${periode}`} download>
            {t("recap.csv")}
          </a>
        </div>
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
