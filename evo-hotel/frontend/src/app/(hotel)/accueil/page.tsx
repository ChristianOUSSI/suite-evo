import type { Metadata } from "next";
import Link from "next/link";

import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { Etat, ListeSejours } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "The desk" : "La réception" };
}

export default async function PageAccueil() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);

  const [etat, sejours] = await Promise.all([
    lire<Etat>("/etat", langue),
    lire<ListeSejours>("/sejours", langue),
  ]);

  const aujourdhui = etat.jour;
  const arrivees = sejours.sejours.filter(
    (un) => (un.statut_effectif ?? un.statut) !== "en_cours" && un.arrivee <= aujourdhui && un.depart > aujourdhui,
  );
  const aVenir = sejours.sejours.filter((un) => un.arrivee > aujourdhui).slice(0, 8);

  return (
    <div className="cadc-gabarit hotel">
      <div className="hotel__tete">
        <span className="cadc-badge cadc-badge--acier">{f.jourDate(aujourdhui)}</span>
        <h1>{t("accueil.titre")}</h1>
        <p>{t("accueil.chapo")}</p>
      </div>

      <div className="portails">
        <div className="portail" aria-label={t("accueil.occupation")}>
          <span>
            <strong
              style={{
                display: "block",
                fontFamily: "var(--cadc-mono)",
                fontSize: "clamp(1.9rem,8vw,2.8rem)",
                lineHeight: 1.1,
              }}
            >
              {etat.occupees}/{etat.chambres}
            </strong>
            <span className="cadc-champ__aide">
              {t("accueil.occupation")} · {etat.en_cours} {t("accueil.en_cours")}
            </span>
          </span>
          <span className="portail__reste">
            {etat.arrivees_du_jour} {t("accueil.arrivees")} · {etat.departs_du_jour}{" "}
            {t("accueil.departs")} · {etat.a_venir} {t("accueil.a_venir")}
            {etat.demandes > 0 ? ` · ${etat.demandes} ${t("accueil.demandes")}` : ""}
          </span>
        </div>
      </div>

      {etat.demandes > 0 ? (
        <section className="cadc-carte" aria-label={t("accueil.demandes")}>
          <div className="cadc-tete">
            <h2>{t("accueil.demandes")}</h2>
            <span className="cadc-tete__cote">{etat.demandes}</span>
          </div>
          <p className="cadc-note">
            {t("accueil.demandes-aide")}{" "}
            <Link href="/sejours">{t("nav.sejours")}</Link>
          </p>
        </section>
      ) : null}

      <section className="cadc-carte" aria-label={t("nav.sejours")}>
        <div className="cadc-tete">
          <h2>{t("statut.en_cours")}</h2>
          <span className="cadc-tete__cote">{etat.en_cours}</span>
        </div>
        {arrivees.length === 0 ? (
          <p className="cadc-note">{t("sejours.vide")}</p>
        ) : (
          <ul className="cadc-liste cadc-pile cadc-pile--serree">
            {arrivees.map((sejour) => (
              <li className="cadc-ligne" key={sejour.id}>
                <span className="cadc-ligne__nom">
                  {sejour.client}
                  <small>
                    {sejour.chambre} · {t(`type.${sejour.chambre_type}`)} ·{" "}
                    {f.date(sejour.arrivee)} → {f.date(sejour.depart)}
                  </small>
                </span>
                <span className="cadc-ligne__valeur">
                  <span className="cadc-badge cadc-badge--doux">
                    {t(`statut.${sejour.statut_effectif ?? sejour.statut}`)}
                  </span>
                  <small style={{ display: "block", textAlign: "right" }}>
                    {f.fcfa(sejour.montant)}
                  </small>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {aVenir.length > 0 ? (
        <section className="cadc-carte" aria-label={t("accueil.a_venir")}>
          <div className="cadc-tete">
            <h2>{t("accueil.a_venir")}</h2>
            <Link href="/sejours" className="cadc-bouton cadc-bouton--doux cadc-bouton--petit">
              {t("nav.sejours")}
            </Link>
          </div>
          <ul className="cadc-liste cadc-pile cadc-pile--serree">
            {aVenir.map((sejour) => (
              <li className="cadc-ligne" key={sejour.id}>
                <span className="cadc-ligne__nom">
                  {sejour.client}
                  <small>
                    {sejour.chambre} · {f.date(sejour.arrivee)} → {f.date(sejour.depart)}
                  </small>
                </span>
                <span className="cadc-ligne__valeur">
                  {f.fcfa(sejour.montant)}
                  <br />
                  <small>{t("statut.a_venir")}</small>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <MentionDemo langue={langue} />
    </div>
  );
}
