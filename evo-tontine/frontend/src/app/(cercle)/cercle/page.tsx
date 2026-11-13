import type { Metadata } from "next";
import Link from "next/link";

import { Remise } from "@/components/remise";
import { Tirage } from "@/components/tirage";
import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { Cercle, Etat, Tirage as TirageBrut } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return {
    title: langue === "en" ? "The circle" : "Le cercle",
  };
}

export default async function PageCercle() {
  const session = await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);
  const gestion = session.user.role !== "membre";

  const etat = await lire<Etat>("/etat", langue);
  // Le tour montré est celui qui tourne ; à défaut, le dernier clos, pour que
  // le reçu de la remise reste à l'écran juste après la remise.
  const courant = etat.tour_courant;
  const ferme = courant === null ? etat.dernier : null;
  const tour = courant ?? ferme;

  const [cercle, preuve] = await Promise.all([
    tour ? lire<Cercle>(`/membres?tour_id=${tour.id}`, langue) : Promise.resolve(null),
    tour && tour.gagnant_id !== null
      ? lire<TirageBrut>(`/tours/${tour.id}/tirage`, langue)
      : Promise.resolve(null),
  ]);

  const manquantes = cercle
    ? cercle.membres.filter((un) => un.actif && un.reste > 0).length
    : 0;
  const complet = manquantes === 0;
  const du = tour?.du ?? 0;
  const plein = du > 0 ? Math.round(((tour?.rentre ?? 0) / du) * 100) : 0;
  const rails = [
    { code: "especes", ouvert: session.groupe.especes_actifs },
    { code: "momo_mtn", ouvert: session.groupe.momo_actif },
    { code: "momo_orange", ouvert: session.groupe.orange_actif },
  ];

  return (
    <div className="cadc-gabarit cercle">
      <div className="cercle__tete">
        <span className="cadc-badge cadc-badge--acier">
          {f.jourDate(etat.jour)} · {t(`statut.${tour?.statut ?? "a_venir"}`)}
        </span>
        <h1>{session.groupe.nom}</h1>
        <p>{t("cercle.chapo")}</p>
      </div>

      <section className="pot" aria-label={t("cercle.pot")}>
        <span className="pot__legende">{t("cercle.pot")}</span>
        <span className="pot__valeur">{f.fcfa(tour?.pot ?? 0)}</span>
        <span className="pot__aide">
          {t("cercle.attendu")} {f.fcfa(du)} · {t("cercle.rentré")}{" "}
          {f.fcfa(tour?.rentre ?? 0)} · {t("cercle.restant")} {f.fcfa(tour?.restant ?? 0)}
        </span>
        <div className="jauge" aria-hidden>
          <div
            className={`jauge__plein${complet && du > 0 ? " jauge__plein--complet" : ""}`}
            style={{ width: `${Math.min(100, Math.max(2, plein))}%` }}
          />
        </div>
      </section>

      <div className="cercle__deux">
        <div className="cercle__file">
          {tour === null ? (
            <section className="cadc-carte" aria-label={t("cercle.titre")}>
              <div className="cadc-tete">
                <h2>{t("cercle.titre")}</h2>
              </div>
              <p className="cadc-note">{t("tours.vide")}</p>
              <div className="cadc-acts">
                <Link href="/membres" className="cadc-bouton cadc-bouton--premier">
                  {t("membres.ajouter")}
                </Link>
              </div>
            </section>
          ) : (
            <>
              <section className="cadc-carte" aria-label={t("tour.tirage")}>
                <div className="cadc-tete">
                  <h2>{t("cercle.titre")}</h2>
                  <span className="cadc-tete__cote">
                    {t("tour.numero")} {tour.numero} · {f.date(tour.date_prevue)}
                  </span>
                </div>
                <Tirage
                  tourId={tour.id}
                  gagnant={tour.gagnant}
                  graine={tour.graine}
                  dateTirage={tour.date_tirage}
                  taille={preuve?.taille ?? etat.membres}
                  preuve={preuve?.verifier ?? null}
                  langue={langue}
                  gestion={gestion}
                />
              </section>

              <section className="cadc-carte" aria-label={t("tour.remettre")}>
                <div className="cadc-tete">
                  <h2>{t("tour.remettre")}</h2>
                  <span className="cadc-tete__cote">{t(`statut.${tour.statut}`)}</span>
                </div>
                <Remise
                  tourId={tour.id}
                  numero={tour.numero}
                  statut={tour.statut}
                  gagnant={tour.gagnant}
                  montant={tour.rentre}
                  manquantes={manquantes}
                  rails={rails}
                  remise={ferme?.remise ?? null}
                  langue={langue}
                  gestion={gestion}
                />
              </section>
            </>
          )}
        </div>

        <div className="cercle__file">
          <section className="cadc-carte" aria-label={t("nav.membres")}>
            <div className="cadc-tete">
              <h2>{t("nav.membres")}</h2>
              <span className="cadc-tete__cote">
                {t("cercle.membres")} {etat.membres}
              </span>
            </div>
            <dl className="cadc-stats">
              <div className="cadc-stat">
                <span className="cadc-stat__legende">{t("cercle.attendu")}</span>
                <span className="cadc-stat__valeur">{f.court(du)}</span>
              </div>
              <div className={`cadc-stat ${complet && du > 0 ? "cadc-stat--vert" : ""}`}>
                <span className="cadc-stat__legende">{t("cercle.rentré")}</span>
                <span className="cadc-stat__valeur">{f.court(tour?.rentre ?? 0)}</span>
              </div>
              <div className={`cadc-stat ${(tour?.restant ?? 0) > 0 ? "cadc-stat--rouge" : ""}`}>
                <span className="cadc-stat__legende">{t("cercle.restant")}</span>
                <span className="cadc-stat__valeur">{f.court(tour?.restant ?? 0)}</span>
              </div>
            </dl>
            <div className="cadc-acts" style={{ marginTop: 12 }}>
              <Link href="/membres" className="cadc-bouton cadc-bouton--doux cadc-bouton--petit">
                {t("nav.membres")}
              </Link>
              <Link href="/tours" className="cadc-bouton cadc-bouton--petit">
                {t("nav.tours")}
              </Link>
            </div>
          </section>

          {courant ? (
            <section className="cadc-carte" aria-label={t("cercle.retalards")}>
              <div className="cadc-tete">
                <h2>{t("cercle.retalards")}</h2>
                <span className="cadc-tete__cote">{etat.en_retard.length}</span>
              </div>
              {etat.en_retard.length === 0 ? (
                <p className="cadc-note cadc-note--vert">{t("tour.tous")}</p>
              ) : (
                <ul className="cadc-pile cadc-pile--serree cadc-liste">
                  {etat.en_retard.map((nom) => (
                    <li key={nom} className="cadc-ligne">
                      <span className="cadc-ligne__nom">{nom}</span>
                      <span className="cadc-badge cadc-badge--rouge">{t("membres.retard")}</span>
                    </li>
                  ))}
                </ul>
              )}
              {etat.penalites > 0 ? (
                <p className="cadc-champ__aide">
                  {t("cercle.penalites")} : {f.fcfa(etat.penalites)}
                </p>
              ) : null}
            </section>
          ) : (
            <section className="cadc-carte" aria-label={t("cercle.remis")}>
              <div className="cadc-tete">
                <h2>{t("cercle.remis")}</h2>
              </div>
              <p className="pot__aide">{f.fcfa(etat.total_remis)}</p>
            </section>
          )}

          <section className="cadc-carte" aria-label={t("cercle.prochain")}>
            <div className="cadc-tete">
              <h2>{t("cercle.prochain")}</h2>
            </div>
            {etat.prochain ? (
              <p className="cercle__note">
                {t("tour.numero")} {etat.prochain.numero} ·{" "}
                {f.date(etat.prochain.date_prevue)} · {f.fcfa(etat.prochain.montant_pot)}
              </p>
            ) : (
              <p className="cadc-note">{t("membres.vide")}</p>
            )}
          </section>

          {session.groupe.mot_du_groupe ? (
            <section className="cadc-carte" aria-label={t("cercle.mot")}>
              <div className="cadc-tete">
                <h2>{t("cercle.mot")}</h2>
              </div>
              <p className="cercle__mot">{session.groupe.mot_du_groupe}</p>
            </section>
          ) : null}

          <MentionDemo langue={langue} />
        </div>
      </div>
    </div>
  );
}
