import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Encaissement } from "@/components/encaissement";
import { Remise } from "@/components/remise";
import { Tirage } from "@/components/tirage";
import { lire, lireOuRien } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { Etat, Tirage as TirageBrut, TourFiche } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "A round" : "Un tour" };
}

export default async function PageTour({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);
  const gestion = session.user.role !== "membre";

  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero < 1) {
    notFound();
  }

  const fiche = await lireOuRien<TourFiche>(`/tours/${numero}`, langue);
  if (!fiche) {
    notFound();
  }

  const [preuve, etat] = await Promise.all([
    fiche.gagnant_id !== null
      ? lire<TirageBrut>(`/tours/${fiche.id}/tirage`, langue)
      : Promise.resolve(null),
    lire<Etat>("/etat", langue),
  ]);

  const ouvert = fiche.statut === "en_cours" || fiche.statut === "tire";
  const manquantes = fiche.cotisations.filter((un) => un.actif && un.reste > 0).length;
  const rails = [
    { code: "especes", ouvert: session.groupe.especes_actifs },
    { code: "momo_mtn", ouvert: session.groupe.momo_actif },
    { code: "momo_orange", ouvert: session.groupe.orange_actif },
  ];

  return (
    <div className="cadc-gabarit cadc-pile">
      <div className="cercle__tete">
        <span className="cadc-badge cadc-badge--acier">
          {t("tour.numero")} {fiche.numero} · {t(`statut.${fiche.statut}`)}
        </span>
        <h1>{f.jourDate(fiche.date_prevue)}</h1>
        <p>{t("tours.chapo")}</p>
      </div>

      <div className="cercle__deux">
        <div className="cercle__file">
          <section className="cadc-carte" aria-label={t("tour.tirage")}>
            <div className="cadc-tete">
              <h2>{t("tour.tirage")}</h2>
              <span className="cadc-tete__cote">{t("cercle.pot")} {f.court(fiche.pot)}</span>
            </div>
            <Tirage
              tourId={fiche.id}
              gagnant={fiche.gagnant}
              graine={fiche.graine}
              dateTirage={fiche.date_tirage}
              taille={preuve?.taille ?? etat.membres}
              preuve={preuve?.verifier ?? null}
              langue={langue}
              gestion={gestion}
            />
          </section>

          <section className="cadc-carte" aria-label={t("membres.titre")}>
            <div className="cadc-tete">
              <h2>{t("membres.titre")}</h2>
              <span className="cadc-tete__cote">
                {f.court(fiche.rentre)} / {f.court(fiche.du)}
              </span>
            </div>
            <div className="fiches">
              {fiche.cotisations.map((membre) => (
                <article
                  key={membre.id}
                  className={`fiche${
                    !membre.actif ? "" : membre.reste > 0 ? " fiche--retard" : " fiche--paye"
                  }`}
                >
                  <div className="fiche__tete">
                    <span className="fiche__nom">
                      {membre.nom}
                      <small>
                        {membre.part} {t("membres.part").toLowerCase()}
                        {membre.telephone ? ` · ${membre.telephone_display}` : ""}
                        {!membre.actif ? ` · ${t("membres.sorti")}` : ""}
                      </small>
                    </span>
                    {membre.mode ? (
                      <span className="cadc-badge cadc-badge--doux">
                        {t(`rail.${membre.mode}`)}
                      </span>
                    ) : (
                      <span className="cadc-badge cadc-badge--doux">{t(`statut.${fiche.statut}`)}</span>
                    )}
                  </div>

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

                  {membre.penalite > 0 ? (
                    <p className="cadc-champ__aide">
                      {t("cercle.penalites")} {f.fcfa(membre.penalite)}
                    </p>
                  ) : null}
                  {membre.payee_le ? (
                    <p className="cadc-champ__aide">
                      {t("membres.payee_le")} {f.date(membre.payee_le)} · {f.fcfa(membre.paye)}
                    </p>
                  ) : null}

                  {ouvert && membre.actif ? (
                    <Encaissement
                      tourId={fiche.id}
                      membre={membre}
                      rails={rails}
                      langue={langue}
                      gestion={gestion}
                    />
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="cercle__file">
          <section className="cadc-carte" aria-label={t("tour.remettre")}>
            <div className="cadc-tete">
              <h2>{t("tour.remettre")}</h2>
            </div>
            <Remise
              tourId={fiche.id}
              numero={fiche.numero}
              statut={fiche.statut}
              gagnant={fiche.gagnant}
              montant={fiche.rentre}
              manquantes={manquantes}
              rails={rails}
              remise={fiche.remise}
              langue={langue}
              gestion={gestion}
            />
          </section>

          {fiche.statut === "remis" ? (
            <section className="cadc-carte" aria-label={t("cercle.prochain")}>
              <div className="cadc-tete">
                <h2>{t("cercle.prochain")}</h2>
              </div>
              <p className="cercle__note">
                {etat.prochain
                  ? `${t("tour.numero")} ${etat.prochain.numero} · ${f.date(etat.prochain.date_prevue)} · ${f.fcfa(etat.prochain.montant_pot)}`
                  : t("tours.vide")}
              </p>
            </section>
          ) : null}

          <div className="cadc-acts">
            <Link href="/tours" className="cadc-bouton">
              {t("nav.tours")}
            </Link>
            <Link href="/cercle" className="cadc-bouton cadc-bouton--doux">
              {t("nav.cercle")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
