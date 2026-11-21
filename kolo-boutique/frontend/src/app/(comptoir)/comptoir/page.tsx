import type { Metadata } from "next";
import Link from "next/link";

import { Icone } from "@/components/icone";
import { lire } from "@/lib/api";
import { fcfaCourt, lettreJour, pourcentage } from "@/lib/format";
import { t } from "@/lib/langue";
import { langueServeur } from "@/lib/langue-serveur";
import { seanceObligatoire } from "@/lib/session";
import type { Cahier, JournalVentes, Tableau } from "@/lib/types";

import "../../../styles/comptoir.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueServeur();
  return { title: t("jour.meta", langue) };
}

export default async function Journee() {
  const session = await seanceObligatoire();
  const langue = await langueServeur();
  const [tableau, ventes, cahier] = await Promise.all([
    lire<Tableau>("/tableau"),
    lire<JournalVentes>("/ventes?jours=1&limite=12"),
    lire<Cahier>("/produits?alertes=true"),
  ]);

  const haut = Math.max(1, ...tableau.serie.map((un) => un.chiffre));

  return (
    <div className="gabarit vitre">
      <div className="tete-page">
        <div className="tete-page__principal">
          <span className="sur-titre">
            <Icone nom="comptoir" taille={13} /> {tableau.jour_label}
          </span>
          <h1 className="display">
            {session.boutique.enseigne || session.boutique.nom}
          </h1>
          <p className="tete-page__entree">
            {t("jour.chapo", langue, {
              ventes: tableau.ventes,
              chiffre: fcfaCourt(tableau.chiffre),
              marge: pourcentage(tableau.marge),
              reserve: fcfaCourt(tableau.reserve),
            })}
          </p>
        </div>
        <div className="tete-page__cote">
          <Link href="/comptoir/dictee" className="bouton bouton--brique">
            {t("jour.ouvrir-dictee", langue)}
            <span className="bouton__fleche">
              <Icone nom="voix" taille={15} />
            </span>
          </Link>
        </div>
      </div>

      <div className="jumellees">
        <section className="feuille bloc" aria-label={t("jour.aria-journee", langue)}>
          <div className="tete-feuille">
            <h2>{t("jour.titre", langue)}</h2>
            <span className="tete-feuille__cote">
              {tableau.ventes} {t("jour.ecritures", langue)}
            </span>
          </div>
          <div className="compteurs">
            <div className="compteur">
              <span className="compteur__legende">{t("jour.chiffre", langue)}</span>
              <span className="compteur__valeur">
                {fcfaCourt(tableau.chiffre)}
              </span>
              <span className="compteur__aide">
                {tableau.ventes > 0
                  ? t("jour.par-vente", langue, { montant: fcfaCourt(Math.round(tableau.chiffre / tableau.ventes)) })
                  : t("jour.rien-vendu", langue)}
              </span>
            </div>
            <div className={`compteur ${tableau.benefice >= 0 ? "compteur--tenu" : "compteur--tard"}`}>
              <span className="compteur__legende">{t("jour.benefice", langue)}</span>
              <span className="compteur__valeur">
                {fcfaCourt(tableau.benefice_net)}
              </span>
              <span className="compteur__aide">
                {t("jour.marge-apres", langue, {
                  marge: pourcentage(tableau.marge),
                  depenses: fcfaCourt(tableau.benefice - tableau.benefice_net),
                })}
              </span>
            </div>
            <div className="compteur">
              <span className="compteur__legende">{t("jour.a-racheter", langue)}</span>
              <span className="compteur__valeur">{tableau.article_alerte}</span>
              <span className="compteur__aide">{t("jour.seuil-rayon", langue)}</span>
            </div>
          </div>

          <div className="semaine" aria-hidden="true">
            {tableau.serie
              .slice()
              .reverse()
              .map((jour) => (
                <div className="semaine__jour" key={jour.jour}>
                  <span className="semaine__total">{fcfaCourt(jour.chiffre)}</span>
                  <span
                    className={`semaine__barre${
                      jour.chiffre >= haut * 0.6 ? " semaine__barre--pleine" : ""
                    }`}
                    style={{
                      height: `${Math.max(3, Math.round((jour.chiffre / haut) * 100))}%`,
                    }}
                  />
                  <span className="semaine__lettre">{lettreJour(jour.jour)}</span>
                </div>
              ))}
          </div>
          <p className="champ__aide">
            {t("jour.semaine-aide", langue, {
              chiffre: fcfaCourt(tableau.semaine.chiffre),
              benefice: fcfaCourt(tableau.semaine.benefice_net),
            })}
          </p>
        </section>

        <section className="feuille bloc" aria-label={t("jour.aria-ventes", langue)}>
          <div className="tete-feuille">
            <h2>{t("jour.ventes-titre", langue)}</h2>
            <span className="tete-feuille__cote">
              <Link href="/comptoir/sorties" className="lien-simple">
                {t("jour.tout-journal", langue)}
              </Link>
            </span>
          </div>
          {ventes.ventes.length === 0 ? (
            <div className="vide">
              <h3>{t("jour.vide-titre", langue)}</h3>
              <p>{t("jour.vide-texte", langue)}</p>
              <Link href="/comptoir/dictee" className="bouton bouton--encre">
                {t("jour.dicter", langue)}
              </Link>
            </div>
          ) : (
            <ul className="ventes-liste">
              {ventes.ventes.map((vente) => (
                <li
                  className={`vente-ligne${vente.annule ? " vente-ligne--rayee" : ""}`}
                  key={vente.id}
                >
                  <span className="vente-ligne__qui">
                    {vente.produit}
                    <small>
                      {vente.heure} · {vente.mode_label}
                      {vente.dictee ? ` · ${t("jour.dictation", langue)}` : ""}
                    </small>
                  </span>
                  <span className="vente-ligne__quantite">
                    {vente.quantite} {vente.unite}
                  </span>
                  <span className="vente-ligne__montant">
                    {vente.chiffre_label}
                    <small className="etiquette--rayon etiquette">
                      {vente.benefice_label}
                    </small>
                  </span>
                  <span className="vente-ligne__outils">
                    <span className="etiquette etiquette--douce">{vente.reference}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="feuille bloc" aria-label={t("jour.aria-rayon", langue)}>
          <div className="tete-feuille">
            <h2>{t("jour.a-racheter", langue)}</h2>
            <span className="tete-feuille__cote">
              {cahier.en_alerte} {t("jour.lignes", langue)}
            </span>
          </div>
          {cahier.produits.length === 0 ? (
            <p className="champ__aide">{t("jour.tout-au-dessus", langue)}</p>
          ) : (
            <ul className="ventes-liste">
              {cahier.produits.slice(0, 8).map((produit) => (
                <li className="vente-ligne" key={produit.id}>
                  <span className="vente-ligne__qui">
                    {produit.nom}
                    <small>
                      {t("jour.seuil-reste", langue, {
                        seuil: produit.alerte_stock,
                        reste: produit.stock,
                        unite: produit.unite,
                      })}
                    </small>
                  </span>
                  <span className="vente-ligne__quantite" />
                  <span className="vente-ligne__montant">{produit.marge_label}</span>
                  <span className="vente-ligne__outils">
                    <span className="etiquette etiquette--alerte">{t("jour.alerte", langue)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="acts">
            <Link href="/comptoir/rayon" className="lien-simple">
              {t("jour.ouvrir-rayon", langue)}
            </Link>
          </div>
        </section>
      </div>

      <section className="feuille bloc" aria-label={t("jour.aria-meilleures", langue)}>
        <div className="tete-feuille">
          <h2>{t("jour.meilleures-titre", langue)}</h2>
          <span className="tete-feuille__cote">{t("jour.par-chiffre", langue)}</span>
        </div>
        {tableau.meilleures.length === 0 ? (
          <p className="champ__aide">{t("jour.meilleures-vide", langue)}</p>
        ) : (
          <ul className="ventes-liste">
            {tableau.meilleures.map((ligne) => (
              <li className="vente-ligne" key={ligne.produit}>
                <span className="vente-ligne__qui">{ligne.produit}</span>
                <span className="vente-ligne__quantite">
                  {ligne.quantite} {ligne.unite}
                </span>
                <span className="vente-ligne__montant">
                  {fcfaCourt(ligne.chiffre)}
                </span>
                <span className="vente-ligne__outils">
                  <span className="etiquette etiquette--rayon">
                    {fcfaCourt(ligne.benefice)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
