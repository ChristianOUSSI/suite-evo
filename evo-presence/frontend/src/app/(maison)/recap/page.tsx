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
  searchParams: Promise<{ periode?: string; tous?: string }>;
}) {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);
  const params = await searchParams;

  const periode = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.periode ?? "")
    ? (params.periode as string)
    : f.moisCourant();
  const tous = params.tous === "1";

  const resume = await lire<Recap>(`/recap?periode=${periode}&tous=${tous ? "true" : "false"}`, langue);

  return (
    <div className="cadc-gabarit presence">
      <div className="presence__tete">
        <span className="cadc-badge cadc-badge--acier">{t("nav.recap")}</span>
        <h1>{t("recap.titre")}</h1>
        <p>{t("recap.chapo")}</p>
      </div>

      <section className="cadc-carte" aria-label={t("recap.periode")}>
        <div className="cadc-acts">
          <Link href={`/recap?periode=${decalagePeriode(periode, -1)}${tous ? "&tous=1" : ""}`} className="cadc-bouton cadc-bouton--doux cadc-bouton--petit">
            {t("recap.avant")}
          </Link>
          <strong style={{ alignSelf: "center" }}>{f.moisDe(periode)}</strong>
          <Link href={`/recap?periode=${decalagePeriode(periode, 1)}${tous ? "&tous=1" : ""}`} className="cadc-bouton cadc-bouton--doux cadc-bouton--petit">
            {t("recap.apres")}
          </Link>
          <Link href={`/recap?periode=${periode}${tous ? "" : "&tous=1"}`} className="cadc-bouton cadc-bouton--doux cadc-bouton--petit">
            {tous ? t("employes.dans") : t("recap.tous")}
          </Link>
        </div>
      </section>

      {resume.lignes.length === 0 ? (
        <p className="cadc-note">{t("recap.vide")}</p>
      ) : (
        <>
          <div className="portails">
            <div className="souche">
              <span className="souche__legende">{t("recap.total_heures")}</span>
              <span className="souche__valeur">{resume.total_heures}</span>
              <span className="souche__aide">
                {resume.effectif} {t("recap.effectif")} · {resume.total_presents} {t("recap.presents")} ·{" "}
                {resume.total_retards} {t("recap.retards")} · {resume.total_absents} {t("recap.absents")}
              </span>
            </div>
          </div>

          <section className="cadc-carte" aria-label={f.moisDe(periode)}>
            <div className="feuille">
              {resume.lignes.map((ligne) => (
                <article className="feuille__ligne" key={ligne.employe_id}>
                  <span className="feuille__nom">
                    {ligne.nom}
                    <small>
                      {ligne.service}
                      {ligne.telephone ? ` · ${f.telephone(ligne.telephone)}` : ""}
                    </small>
                    <span className="etats-ligne">
                      <span>{ligne.presents} {t("recap.presents")}</span>
                      <span>{ligne.retards} {t("recap.retards")}</span>
                      <span>{ligne.absents} {t("recap.absents")}</span>
                    </span>
                  </span>
                  <span className="feuille__jours">
                    {ligne.jours} {t("commun.jours")}
                    <br />
                    <small>{ligne.heures} {t("recap.heures")}</small>
                  </span>
                  <span className="feuille__montant" style={{ fontSize: "0.95rem" }}>
                    <span className="code" style={{ fontSize: "0.85rem" }}>{ligne.code}</span>
                  </span>
                </article>
              ))}
            </div>
            <p className="cadc-champ__aide" style={{ marginTop: 10 }}>{t("recap.code-aide")}</p>
            <div className="cadc-acts" style={{ marginTop: 12 }}>
              <a className="cadc-bouton cadc-bouton--doux" href={`/api/exports/recap.csv?periode=${periode}`} download>
                {t("recap.csv")}
              </a>
            </div>
          </section>
        </>
      )}

      <MentionDemo langue={langue} />
    </div>
  );
}
