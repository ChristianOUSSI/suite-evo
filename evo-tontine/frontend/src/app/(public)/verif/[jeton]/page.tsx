import type { Metadata } from "next";
import Link from "next/link";

import { VerifCode } from "@/components/verif-code";
import { Impression } from "@/components/impression";
import { lireOuRien } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { RecuPublic } from "@/lib/types";

export const dynamic = "force-dynamic";

const FORME = /^[A-HJ-NP-Z2-9]{10}$/;

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return {
    title: langue === "en" ? "Handover receipt" : "Reçu de remise",
    robots: { index: false, follow: false, noarchive: true },
  };
}

export default async function PageRecu({
  params,
}: {
  params: Promise<{ jeton: string }>;
}) {
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);
  const { jeton } = await params;
  const code = jeton.trim().toUpperCase();

  const recu = FORME.test(code)
    ? await lireOuRien<RecuPublic>(`/public/remises/${code}`, langue)
    : null;

  if (!recu) {
    return (
      <div className="cadc-gabarit--etroit cadc-pile verif">
        <div className="cercle__tete">
          <span className="cadc-badge cadc-badge--rouge">{t("commun.demo")}</span>
          <h1>{t("verif.introuvable")}</h1>
          <p>{t("verif.introuvable-aide")}</p>
        </div>
        <section className="cadc-carte" aria-label={t("verif.code")}>
          <VerifCode langue={langue} initial={code} />
        </section>
        <div className="cadc-acts">
          <Link href="/verif" className="cadc-bouton">
            {t("verif.autre")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cadc-gabarit--etroit cadc-pile verif">
      <div className="cercle__tete">
        <span className="cadc-badge cadc-badge--vert">{t("verif.valide")}</span>
        <h1>{recu.membre}</h1>
        <p>{t("verif.chapo")}</p>
      </div>

      <article className="montre">
        <span className="tirage__etiquette">{t("tour.recu")}</span>
        <p className="pot__valeur">{f.fcfa(recu.montant)}</p>

        <div className="montre__preuve">
          <span className="tirage__etiquette">{t("tour.jeton")}</span>
          <code className="montre__code">{code}</code>
        </div>

        <div className="montre__ligne">
          <span>{t("verif.par")}</span>
          <strong>
            {recu.groupe}
            <small className="montre__sous">
              {recu.quartier ? `${recu.quartier} · ` : ""}
              {recu.ville}
            </small>
          </strong>
        </div>
        <div className="montre__ligne">
          <span>{t("tour.numero")}</span>
          <strong>{recu.numero_tour}</strong>
        </div>
        <div className="montre__ligne">
          <span>{t("tour.date")}</span>
          <strong>{f.jourDate(recu.jour)}</strong>
        </div>
        <div className="montre__ligne">
          <span>{t("remise.sur")}</span>
          <strong>
            {f.date(recu.moment)} · {t("remise.heure")} {f.heure(recu.moment)}
          </strong>
        </div>
        <div className="montre__ligne">
          <span>{t("tour.mode")}</span>
          <strong>{t(`rail.${recu.mode}`)}</strong>
        </div>
        {recu.temoin ? (
          <div className="montre__ligne">
            <span>{t("remise.temoin")}</span>
            <strong>{recu.temoin}</strong>
          </div>
        ) : null}
        {recu.note ? (
          <div className="montre__ligne">
            <span>{t("tour.note")}</span>
            <strong>{recu.note}</strong>
          </div>
        ) : null}
      </article>

      <p className="cadc-note cadc-note--acier">{t("verif.hors")}</p>

      <div className="cadc-acts">
        <Impression langue={langue} />
        <Link href="/verif" className="cadc-bouton cadc-bouton--doux">
          {t("verif.autre")}
        </Link>
      </div>
    </div>
  );
}
