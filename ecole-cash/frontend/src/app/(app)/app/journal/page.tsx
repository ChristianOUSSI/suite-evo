import type { Metadata } from "next";
import Link from "next/link";

import { Comptage } from "@/components/comptage";
import { Icone } from "@/components/icone";
import { lire } from "@/lib/api";
import { canoniseTelephone, fcfa, isoToday, weekdayAndDate } from "@/lib/format";
import { seanceObligatoire } from "@/lib/session";
import type { EtatCaisse, Journee } from "@/lib/types";

import "../../../../styles/journal.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Journal de caisse",
};

const FEUILLES = [
  {
    href: "/api/exports/caisse.csv?jours=30",
    titre: "Caisse",
    texte: "Chaque versement et chaque comptage du soir, dans l'ordre des jours.",
  },
  {
    href: "/api/exports/recus.csv?jours=90",
    titre: "Reçus",
    texte: "Numéros, canaux, états et jetons de vérification pour les parents.",
  },
  {
    href: "/api/exports/impayes.csv",
    titre: "Impayés",
    texte: "Les familles qui doivent encore, avec le nombre de jours de retard.",
  },
  {
    href: "/api/exports/echeances.csv",
    titre: "Échéances",
    texte: "Terme par terme, toutes années : ce qui est posé et ce qui est imputé.",
  },
  {
    href: "/api/exports/eleves.csv",
    titre: "Élèves",
    texte: "L'état civil complet, parent et numéros compris.",
  },
];

export default async function Journal() {
  const [serie, journee, session] = await Promise.all([
    lire<{ jours: number; journees: Journee[] }>("/cash/journal?jours=30"),
    lire<EtatCaisse>(`/cash/jour?jour=${isoToday()}`),
    seanceObligatoire(),
  ]);

  return (
    <div className="shell journal">
      <div className="page-head">
        <div className="page-head__main">
          <span className="kicker">
            <Icone nom="journal" taille={14} /> {weekdayAndDate(isoToday())}
          </span>
          <h1 className="display">Le journal de caisse</h1>
          <p className="page-head__lede">
            Trente derniers jours, {serie.journees.length} journée
            {serie.journees.length > 1 ? "s" : ""} comptée
            {serie.journees.length > 1 ? "s" : ""}. Une journée reste ouverte
            tant que son écart n&apos;est pas écrit.
          </p>
        </div>
        <div className="page-head__aside">
          <Link href="/app/guichet" className="btn btn--ink">
            Encaisser
          </Link>
        </div>
      </div>

      <div className="tiroir-volet">
        <section className="sheet bloc" aria-label="Journées comptées">
          <div className="section-head">
            <h2>Les journées</h2>
            <span className="section-head__aside">du plus récent au plus ancien</span>
          </div>

          <div className="filer" style={{ marginTop: "1.1rem" }}>
            {serie.journees.length === 0 ? (
              <div className="empty">
                <h3>Aucune journée comptée.</h3>
                <p>
                  Le comptage du soir est ce qui ferme une journée. Rien de
                  compté, rien de fermé.
                </p>
              </div>
            ) : null}
            {serie.journees.map((journee) => {
              const ecart = journee.ecart;
              const classe =
                ecart === null
                  ? "jour-ligne--ouverte"
                  : ecart === 0
                    ? "jour-ligne--net"
                    : "jour-ligne--ecart";
              return (
                <div className={`jour-ligne ${classe}`} key={journee.jour}>
                  <span className="jour-ligne__date">
                    {journee.jour_label}
                    <small>{journee.jour}</small>
                  </span>
                  <span className="jour-ligne__detail">
                    {journee.nb_entries} entrée{journee.nb_entries > 1 ? "s" : ""} ·{" "}
                    {journee.tenu_par || "tenu par inconnu"}
                    {journee.note ? ` · ${journee.note}` : ""}
                  </span>
                  <span className="jour-ligne__valeur">
                    {fcfa(journee.total)}
                    <small>encaissé</small>
                  </span>
                  <span className="jour-ligne__valeur">
                    {fcfa(journee.comptage)}
                    <small>compté</small>
                  </span>
                  <span
                    className={`jour-ligne__valeur money ecart-valeur--${
                      ecart === null ? "nul" : ecart === 0 ? "nul" : ecart < 0 ? "négatif" : "positif"
                    }`}
                  >
                    {ecart === null
                      ? "non compté"
                      : ecart === 0
                        ? "à plat"
                        : `${ecart > 0 ? "+" : "−"}${fcfa(Math.abs(ecart))}`}
                    <small>écart</small>
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <Comptage caisse={journee} tenuPar={session.user.nom} jour={isoToday()} />
      </div>

      <section className="sheet bloc" id="feuilles" aria-label="Feuilles CSV">
        <div className="section-head">
          <h2>Feuilles à remettre</h2>
          <span className="section-head__aside">
            CSV, séparateur point-virgule, BOM UTF-8
          </span>
        </div>

        <div className="feuilles" style={{ marginTop: "1.1rem" }}>
          {FEUILLES.map((feuille) => (
            <div className="feuille" key={feuille.href}>
              <h3>{feuille.titre}</h3>
              <p>{feuille.texte}</p>
              <a
                href={feuille.href}
                className="btn btn--small"
                download={`ecole-cash-${feuille.titre.toLowerCase()}.csv`}
              >
                Télécharger
              </a>
            </div>
          ))}
        </div>

        <p className="vide-note" style={{ marginTop: "1rem" }}>
          Contact utile pour la trésorière :{" "}
          <a
            className="text-link"
            href={
              canoniseTelephone(session.ecole.telephone)
                ? `tel:${session.ecole.telephone.replace(/\D/g, "")}`
                : undefined
            }
          >
            {session.ecole.telephone_display || "numéro non noté"}
          </a>
        </p>
      </section>
    </div>
  );
}
