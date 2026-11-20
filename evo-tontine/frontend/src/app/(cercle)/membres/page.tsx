import type { Metadata } from "next";

import { AjoutMembre } from "@/components/ajout-membre";
import { BasculeMembre } from "@/components/bascule-membre";
import { Encaissement } from "@/components/encaissement";
import { lire } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { Cercle } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Members" : "Les membres" };
}

export default async function PageMembres() {
  const session = await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);
  const gestion = session.user.role !== "membre";

  const cercle = await lire<Cercle>("/membres", langue);
  const tour = cercle.tour;
  const rails = [
    { code: "especes", ouvert: session.groupe.especes_actifs },
    { code: "momo_mtn", ouvert: session.groupe.momo_actif },
    { code: "momo_orange", ouvert: session.groupe.orange_actif },
  ];
  const restantTotal = cercle.membres.reduce((somme, un) => somme + un.reste, 0);

  return (
    <div className="cadc-gabarit cadc-pile">
      <div className="cercle__tete">
        <span className="cadc-badge cadc-badge--acier">
          {cercle.actifs} / {cercle.total}
        </span>
        <h1>{t("membres.titre")}</h1>
        <p>{t("membres.chapo")}</p>
      </div>

      <dl className="cadc-stats">
        <div className="cadc-stat">
          <span className="cadc-stat__legende">{t("cercle.parts")}</span>
          <span className="cadc-stat__valeur">{cercle.parts}</span>
        </div>
        <div className="cadc-stat">
          <span className="cadc-stat__legende">{t("cercle.pot")}</span>
          <span className="cadc-stat__valeur">{f.court(cercle.pot)}</span>
        </div>
        <div className={`cadc-stat ${restantTotal > 0 ? "cadc-stat--rouge" : "cadc-stat--vert"}`}>
          <span className="cadc-stat__legende">{t("cercle.restant")}</span>
          <span className="cadc-stat__valeur">{f.court(restantTotal)}</span>
        </div>
      </dl>

      {gestion ? (
        <section className="cadc-carte" aria-label={t("membres.nouveau")}>
          <div className="cadc-tete">
            <h2>{t("membres.nouveau")}</h2>
            <span className="cadc-tete__cote">{t("cercle.cotisation")} {f.fcfa(session.groupe.cotisation)}</span>
          </div>
          <AjoutMembre langue={langue} />
        </section>
      ) : null}

      {cercle.membres.length === 0 ? (
        <p className="cadc-vide">
          <h3>{t("membres.vide")}</h3>
        </p>
      ) : (
        <div className="fiches">
          {cercle.membres.map((membre) => (
            <article
              key={membre.id}
              className={`fiche${
                !membre.actif
                  ? " fiche--sorti"
                  : tour === null
                    ? ""
                    : membre.reste > 0
                      ? " fiche--retard"
                      : " fiche--paye"
              }`}
            >
              <div className="fiche__tete">
                <span className="fiche__nom">
                  {membre.nom}
                  <small>
                    {membre.telephone ? `${membre.telephone_display} · ${membre.operateur}` : t("membres.sansNumero")}
                    {" · "}
                    {t("membres.entree")} {f.date(membre.entree_le)}
                  </small>
                </span>
                <span className="cadc-badge cadc-badge--doux">
                  {membre.part} {t("membres.part").toLowerCase()}
                </span>
              </div>

              {membre.note ? (
                <p className="cadc-champ__aide">{membre.note}</p>
              ) : null}

              {tour && membre.actif ? (
                <div className="fiche__chiffres">
                  <span className="fiche__chiffre">
                    <span>{t("membres.du")}</span>
                    <strong>{f.court(membre.du)}</strong>
                  </span>
                  <span className="fiche__chiffre">
                    <span>{t("membres.paye")}</span>
                    <strong>{f.court(membre.paye)}</strong>
                  </span>
                  <span className="fiche__chiffre">
                    <span>{t("membres.reste")}</span>
                    <strong>{f.court(membre.reste)}</strong>
                  </span>
                </div>
              ) : (
                <p className="cadc-champ__aide">{t("membres.horsTour")}</p>
              )}

              {membre.penalite > 0 ? (
                <p className="cadc-champ__tord">
                  {t("cercle.penalites")} {f.fcfa(membre.penalite)}
                </p>
              ) : null}

              {membre.payee_le ? (
                <p className="cadc-champ__aide">
                  {t("membres.payee_le")} {f.date(membre.payee_le)} ·{" "}
                  {t(`rail.${membre.mode}`)}
                  {membre.reference ? ` · ${t("membres.reference")} ${membre.reference}` : ""}
                </p>
              ) : null}

              {membre.actif ? (
                <p className="cadc-champ__aide">
                  {t("membres.code")} <code>{membre.code}</code> ·{" "}
                  <a href={membre.lien} target="_blank" rel="noreferrer">
                    {t("membres.code-lien")}
                  </a>
                </p>
              ) : null}

              <div className="cadc-acts">
                {tour && membre.actif ? (
                  <Encaissement
                    tourId={tour.id}
                    membre={membre}
                    rails={rails}
                    langue={langue}
                    gestion={gestion}
                  />
                ) : null}
                <BasculeMembre
                  membreId={membre.id}
                  actif={membre.actif}
                  langue={langue}
                  gestion={gestion}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
