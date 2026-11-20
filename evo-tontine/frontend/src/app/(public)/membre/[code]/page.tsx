import type { Metadata } from "next";
import Link from "next/link";

import { lireOuRien } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { FicheMembrePublique } from "@/lib/types";

export const dynamic = "force-dynamic";

const FORME = /^[A-HJ-NP-Z2-9]{8}$/;

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return {
    title: langue === "en" ? "Member page" : "Fiche du membre",
    robots: { index: false, follow: false, noarchive: true },
  };
}

export default async function PageMembre({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);
  const { code } = await params;
  const cle = code.trim().toUpperCase();

  const fiche = FORME.test(cle)
    ? await lireOuRien<FicheMembrePublique>(`/public/membre/${cle}`, langue)
    : null;

  if (!fiche) {
    return (
      <div className="cadc-gabarit--etroit cadc-pile verif">
        <div className="cercle__tete">
          <span className="cadc-badge cadc-badge--rouge">{t("commun.demo")}</span>
          <h1>{t("membre.introuvable")}</h1>
          <p>{t("membre.chapo")}</p>
        </div>
        <div className="cadc-acts">
          <Link href="/verif" className="cadc-bouton">
            {t("membre.verifier")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cadc-gabarit--etroit cadc-pile verif">
      <div className="cercle__tete">
        <span className="cadc-badge cadc-badge--vert">{fiche.groupe}</span>
        <h1>{fiche.membre}</h1>
        <p>
          {fiche.ville} · {t("membre.titre").toLowerCase()}
        </p>
      </div>

      <div className="portails">
        <div className="portail">
          <span>
            <strong>{f.fcfa(fiche.total_paye)}</strong>
            <span className="cadc-champ__aide">{t("membre.cotise")}</span>
          </span>
        </div>
        <div className="portail">
          <span>
            <strong>{f.fcfa(fiche.total_pots)}</strong>
            <span className="cadc-champ__aide">{t("membre.recu")}</span>
          </span>
        </div>
        <div className="portail">
          <span>
            <strong>{f.fcfa(Math.max(0, fiche.total_attendu - fiche.total_paye))}</strong>
            <span className="cadc-champ__aide">{t("membre.reste")}</span>
          </span>
        </div>
      </div>

      {fiche.cotisations.length > 0 ? (
        <section className="cadc-carte" aria-label={t("membre.cotise")}>
          <div className="cadc-tete">
            <h2>{t("membre.cotise")}</h2>
          </div>
          <ul className="cadc-liste cadc-pile cadc-pile--serree">
            {fiche.cotisations.map((un) => (
              <li className="cadc-ligne" key={un.tour}>
                <span className="cadc-ligne__nom">
                  {t("membre.tour")} {un.tour}
                  <small>
                    {f.date(un.jour)}
                    {un.penalite > 0 ? ` · ${t("membre.penalite")} ${f.fcfa(un.penalite)}` : ""}
                  </small>
                </span>
                <span className="cadc-ligne__valeur">
                  {f.fcfa(un.paye)}
                  <small>/ {f.fcfa(un.attendu)}</small>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {fiche.pots.length > 0 ? (
        <section className="cadc-carte" aria-label={t("membre.recu")}>
          <div className="cadc-tete">
            <h2>{t("membre.recu")}</h2>
          </div>
          <ul className="cadc-liste cadc-pile cadc-pile--serree">
            {fiche.pots.map((un, index) => (
              <li className="cadc-ligne" key={index}>
                <span className="cadc-ligne__nom">
                  {t("membre.pot")} · {t("membre.tour")} {un.tour}
                  <small>{f.date(un.jour)}</small>
                </span>
                <span className="cadc-ligne__valeur">{f.fcfa(un.montant)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="cadc-note cadc-note--acier">{t("membre.hors")}</p>

      <div className="cadc-acts">
        <Link href="/verif" className="cadc-bouton cadc-bouton--doux">
          {t("membre.verifier")}
        </Link>
      </div>
    </div>
  );
}
