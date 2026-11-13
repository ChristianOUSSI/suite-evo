import type { Metadata } from "next";
import Link from "next/link";

import { lire } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeTours } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Rounds" : "Les tours" };
}

export default async function PageTours() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);

  const donnees = await lire<ListeTours>("/tours?limite=36", langue);

  return (
    <div className="cadc-gabarit cadc-pile">
      <div className="cercle__tete">
        <span className="cadc-badge cadc-badge--acier">
          {donnees.total} · {donnees.remis} {t("cercle.remis").toLowerCase()}
        </span>
        <h1>{t("tours.titre")}</h1>
        <p>{t("tours.chapo")}</p>
      </div>

      {donnees.tours.length === 0 ? (
        <p className="cadc-vide">
          <h3>{t("tours.vide")}</h3>
          <Link href="/membres" className="cadc-bouton cadc-bouton--premier">
            {t("membres.ajouter")}
          </Link>
        </p>
      ) : (
        <ul className="cadc-liste cadc-pile cadc-pile--serree">
          {donnees.tours.map((tour) => (
            <li key={tour.id}>
              <Link href={`/tours/${tour.id}`} className={`rangee rangee--${tour.statut}`}>
                <span className="rangee__numero">{tour.numero}</span>
                <span className="rangee__nom">
                  {f.date(tour.date_prevue)}
                  <small>
                    {tour.gagnant
                      ? `${t("tour.gagnant")} ${tour.gagnant}`
                      : t("tour.personne")}
                  </small>
                </span>
                <span className="rangee__montant">{f.court(tour.pot)}</span>
                <span className={`cadc-badge cadc-badge--${couleur(tour.statut)}`}>
                  {t(`statut.${tour.statut}`)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function couleur(statut: string): string {
  if (statut === "remis") return "vert";
  if (statut === "tire") return "acier";
  return "doux";
}
