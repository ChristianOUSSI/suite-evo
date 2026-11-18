import type { Metadata } from "next";
import Link from "next/link";

import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { Etat, ListeCommandes } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "The voice" : "La voix" };
}

export default async function PageAccueil() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);

  const etat = await lire<Etat>("/etat", langue);
  const journal = await lire<ListeCommandes>("/commandes", langue);

  const cartes = [
    { cle: "accueil.commandes", valeur: etat.commandes, aide: `${etat.recues} ${t("accueil.recues")}` },
    { cle: "accueil.interpretees", valeur: etat.interpretees, aide: `${etat.sans_intention} ${t("accueil.sans_intention")}` },
    { cle: "accueil.executees", valeur: etat.executees, aide: `${etat.echecs} ${t("recap.echecs")}` },
    { cle: "accueil.executees_mois", valeur: etat.executees_mois, aide: f.jourDate(etat.jour) },
  ];

  return (
    <div className="cadc-gabarit standard">
      <div className="standard__tete">
        <span className="cadc-badge cadc-badge--acier">{f.jourDate(etat.jour)}</span>
        <h1>{t("accueil.titre")}</h1>
        <p>{t("accueil.chapo")}</p>
      </div>

      <div className="portails">
        {cartes.map((carte) => (
          <div className="portail" key={carte.cle} aria-label={t(carte.cle)}>
            <span>
              <strong
                style={{
                  display: "block",
                  fontFamily: "var(--cadc-mono)",
                  fontSize: "clamp(1.9rem,8vw,2.8rem)",
                  lineHeight: 1.1,
                }}
              >
                {carte.valeur}
              </strong>
              <span className="cadc-champ__aide">{t(carte.cle)}</span>
            </span>
            <span className="portail__reste">{carte.aide}</span>
          </div>
        ))}
      </div>

      <div className="cadc-acts">
        <Link href="/commandes" className="cadc-bouton cadc-bouton--grand cadc-bouton--premier">
          {t("accueil.nouvelle")}
        </Link>
      </div>

      <section className="cadc-carte" aria-label={t("accueil.journal")}>
        <div className="cadc-tete">
          <h2>{t("accueil.journal")}</h2>
          <span className="cadc-tete__cote">{journal.total} {t("nav.commandes")}</span>
        </div>
        <ul className="cadc-liste cadc-pile cadc-pile--serree">
          {journal.commandes.slice(0, 5).map((commande) => (
            <li className="cadc-ligne" key={commande.id}>
              <span className="cadc-ligne__nom">« {commande.transcription.slice(0, 60)} »</span>
              <span className="cadc-badge cadc-badge--doux">{t(`cstatut.${commande.statut}`)}</span>
            </li>
          ))}
        </ul>
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
