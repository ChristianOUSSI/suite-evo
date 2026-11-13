import type { Metadata } from "next";
import Link from "next/link";

import { VerifCode } from "@/components/verif-code";
import { Impression } from "@/components/impression";
import { lireOuRien } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { Bulletin } from "@/lib/types";

export const dynamic = "force-dynamic";

const FORME = /^[A-HJ-NP-Z2-9]{10}$/;

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return {
    title: langue === "en" ? "Month bulletin" : "Le mois de l'employé",
    robots: { index: false, follow: false, noarchive: true },
  };
}

export default async function PageBulletin({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);
  const { code: brut } = await params;
  const code = brut.trim().toUpperCase();

  const bulletin = FORME.test(code)
    ? await lireOuRien<Bulletin>(`/public/bulletins/${code}`, langue)
    : null;

  if (!bulletin) {
    return (
      <div className="cadc-gabarit--etroit cadc-pile verif">
        <div className="chantier__tete">
          <span className="cadc-badge cadc-badge--rouge">{t("commun.demo")}</span>
          <h1>{t("bulletin.introuvable")}</h1>
        </div>
        <section className="cadc-carte" aria-label={t("bulletin.code")}>
          <VerifCode langue={langue} initial={code} />
        </section>
        <div className="cadc-acts">
          <Link href="/verifier" className="cadc-bouton">
            {t("bulletin.autre")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cadc-gabarit--etroit cadc-pile verif">
      <div className="chantier__tete">
        <span className="cadc-badge cadc-badge--vert">{t("bulletin.valide")}</span>
        <h1>{bulletin.nom}</h1>
        <p>{bulletin.service}</p>
      </div>

      <article className="montre">
        <div className="montre__ligne">
          <span>{t("bulletin.par")}</span>
          <strong>
            {bulletin.entreprise}
            <small className="montre__sous">
              {bulletin.quartier ? `${bulletin.quartier} · ` : ""}
              {bulletin.ville}
            </small>
          </strong>
        </div>
        <div className="montre__ligne">
          <span>{t("recap.periode")}</span>
          <strong>{f.moisDe(bulletin.periode)}</strong>
        </div>
        <div className="montre__ligne">
          <span>{t("recap.heures")}</span>
          <strong>
            {bulletin.jours} {t("commun.jours")} · {bulletin.heures}{" "}
            {t("recap.heures")}
          </strong>
        </div>
        <div className="montre__ligne">
          <span>{t("recap.presents")}</span>
          <strong>
            {bulletin.presents} · {t("recap.retards")} {bulletin.retards} ·{" "}
            {t("recap.absents")} {bulletin.absents}
          </strong>
        </div>

        <div className="feuille__code" style={{ gridColumn: "auto" }}>
          <span className="code">{bulletin.code}</span>
          <span className="cadc-champ__aide">{t("recap.code-aide")}</span>
        </div>

        {bulletin.jours_detailles.length > 0 ? (
          <div style={{ textAlign: "left" }}>
            <p className="tirage__etiquette" style={{ marginBottom: 6 }}>
              {t("bulletin.detail")}
            </p>
            <ul className="jours__liste">
              {bulletin.jours_detailles.map((journee, index) => (
                <li className="jours__ligne" key={`${journee.jour}-${index}`}>
                  <span className="jours__date">{f.date(journee.jour)}</span>
                  <span>
                    {journee.arrivee || "—"} → {journee.depart || "—"}
                    {journee.note ? ` · ${journee.note}` : ""}
                  </span>
                  <span>{t(`etat.${journee.statut}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </article>

      <p className="cadc-note cadc-note--acier">{t("bulletin.hors")}</p>
      <p className="cadc-champ__aide">{t("bulletin.sante")}</p>

      <div className="cadc-acts">
        <Impression langue={langue} />
        <Link href="/verifier" className="cadc-bouton cadc-bouton--doux">
          {t("bulletin.autre")}
        </Link>
      </div>
    </div>
  );
}
