import type { Metadata } from "next";
import Link from "next/link";

import { ComptageTiroir } from "@/components/comptage-tiroir";
import { Icone } from "@/components/icone";
import { lire } from "@/lib/api";
import { fcfaCourt, pourcentage } from "@/lib/format";
import { t } from "@/lib/langue";
import { langueServeur } from "@/lib/langue-serveur";
import type { Caisse, Journees } from "@/lib/types";

import "../../../../styles/comptoir.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueServeur();
  return { title: t("tiroir.meta", langue) };
}

const FEUILLES = [
  { href: "/api/exports/ventes.csv?jours=30", titre: "feuille.ventes-titre", texte: "feuille.ventes-texte" },
  { href: "/api/exports/stock.csv", titre: "feuille.rayon-titre", texte: "feuille.rayon-texte" },
  { href: "/api/exports/journees.csv?jours=30", titre: "feuille.journees-titre", texte: "feuille.journees-texte" },
  { href: "/api/exports/depenses.csv?jours=30", titre: "feuille.sorties-titre", texte: "feuille.sorties-texte" },
];

export default async function Tiroir() {
  const langue = await langueServeur();
  const [caisse, feuilles] = await Promise.all([
    lire<Caisse>("/caisse"),
    lire<Journees>("/journees?jours=14"),
  ]);

  return (
    <div className="gabarit vitre">
      <div className="tete-page">
        <div className="tete-page__principal">
          <span className="sur-titre">
            <Icone nom="tiroir" taille={13} /> {caisse.jour_label}
          </span>
          <h1 className="display">{t("tiroir.titre", langue)}</h1>
          <p className="tete-page__entree">
            {t("tiroir.chapo", langue, {
              ecritures: caisse.ventes,
              chiffre: fcfaCourt(caisse.chiffre),
              marge: pourcentage(caisse.marge),
              attendu: caisse.attendu_label,
            })}
          </p>
        </div>
      </div>

      <div className="pilees-deux">
        <section className="feuille bloc" aria-label={t("tiroir.aria-compter", langue)}>
          <div className="tete-feuille">
            <h2>{t("tiroir.compter", langue)}</h2>
            <span className="tete-feuille__cote">
              {caisse.comptage ? t("tiroir.deja-declare", langue) : t("tiroir.rien-declare", langue)}
            </span>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <ComptageTiroir caisse={caisse} />
          </div>
        </section>

        <div className="vitre-serre">
          <section className="feuille bloc" aria-label={t("tiroir.aria-journee", langue)}>
            <div className="tete-feuille">
              <h2>{t("tiroir.journee-titre", langue)}</h2>
              <span className="tete-feuille__cote">{t("tiroir.journee-cote", langue)}</span>
            </div>
            <dl className="tiroir-lignes">
              <div className="ligne-reglure">
                <dt className="ligne-reglure__nom">{t("tiroir.chiffre-jour", langue)}</dt>
                <dd className="ligne-reglure__valeur">{caisse.chiffre_label}</dd>
              </div>
              <div className="ligne-reglure">
                <dt className="ligne-reglure__nom">{t("tiroir.especes", langue)}</dt>
                <dd className="ligne-reglure__valeur">{caisse.especes_label}</dd>
              </div>
              <div className="ligne-reglure">
                <dt className="ligne-reglure__nom">{t("tiroir.brut", langue)}</dt>
                <dd className="ligne-reglure__valeur">{caisse.benefice_label}</dd>
              </div>
              <div className="ligne-reglure">
                <dt className="ligne-reglure__nom">{t("tiroir.depenses-jour", langue)}</dt>
                <dd className="ligne-reglure__valeur">{caisse.depenses_label}</dd>
              </div>
              <div className="ligne-reglure">
                <dt className="ligne-reglure__nom">{t("tiroir.net", langue)}</dt>
                <dd className="ligne-reglure__valeur">
                  {caisse.benefice_net_label}
                </dd>
              </div>
              <div className="ligne-reglure">
                <dt className="ligne-reglure__nom">{t("tiroir.attendu", langue)}</dt>
                <dd className="ligne-reglure__valeur">{caisse.attendu_label}</dd>
              </div>
            </dl>

            {caisse.comptage ? (
              <p className="note-bas note-bas--tenu" style={{ marginTop: "0.9rem" }}>
                {t("tiroir.compte-note", langue, {
                  compte: caisse.comptage.compte_label,
                  par: caisse.comptage.tenu_par,
                  ecart: caisse.comptage.ecart_label,
                })}
                {caisse.comptage.tenu ? t("tiroir.au-franc", langue) : ""}
              </p>
            ) : null}
          </section>

          <section className="feuille bloc" aria-label={t("tiroir.aria-14j", langue)}>
            <div className="tete-feuille">
              <h2>{t("tiroir.14j-titre", langue)}</h2>
              <span className="tete-feuille__cote">{t("tiroir.14j-cote", langue)}</span>
            </div>
            <ul className="ventes-liste">
              {feuilles.journees.map((feuille) => (
                <li className="vente-ligne" key={feuille.jour}>
                  <span className="vente-ligne__qui">
                    {feuille.jour}
                    <small>
                      {t("tiroir.ventes-petites", langue, { n: feuille.ventes })} ·{" "}
                      {t("tiroir.ticket", langue, { montant: feuille.ticket_moyen_label })}
                    </small>
                  </span>
                  <span className="vente-ligne__quantite">
                    {pourcentage(feuille.marge)}
                  </span>
                  <span className="vente-ligne__montant">
                    {feuille.chiffre_label}
                  </span>
                  <span className="vente-ligne__outils">
                    <span
                      className={`etiquette ${
                        feuille.benefice_net >= 0
                          ? "etiquette--rayon"
                          : "etiquette--alerte"
                      }`}
                    >
                      {t("tiroir.net-tag", langue, { montant: fcfaCourt(feuille.benefice_net) })}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <section className="feuille bloc" id="feuilles" aria-label={t("tiroir.aria-feuilles", langue)}>
        <div className="tete-feuille">
          <h2>{t("tiroir.feuilles-titre", langue)}</h2>
          <span className="tete-feuille__cote">
            <Icone nom="feuille" taille={13} /> {t("tiroir.feuilles-cote", langue)}
          </span>
        </div>
        <p className="champ__aide">{t("tiroir.feuilles-aide", langue)}</p>
        <ul className="feuilles-export">
          {FEUILLES.map((feuille) => (
            <li key={feuille.href}>
              <a href={feuille.href} download>
                <Icone nom="feuille" taille={15} /> {t(feuille.titre, langue)}
              </a>
              <span>{t(feuille.texte, langue)}</span>
            </li>
          ))}
        </ul>
        <Link href="/comptoir" className="lien-simple">
          {t("tiroir.retour", langue)}
        </Link>
      </section>
    </div>
  );
}
