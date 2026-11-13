import type { Metadata } from "next";
import Link from "next/link";

import { Icone } from "@/components/icone";
import { lire } from "@/lib/api";
import { fcfaCourt, lettreJour, pourcentage } from "@/lib/format";
import { seanceObligatoire } from "@/lib/session";
import type { Cahier, JournalVentes, Tableau } from "@/lib/types";

import "../../../styles/comptoir.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "La journée",
};

export default async function Journee() {
  const session = await seanceObligatoire();
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
            {tableau.ventes} vente{tableau.ventes > 1 ? "s" : ""} consignées
            aujourd’hui, {fcfaCourt(tableau.chiffre)} de chiffre et{" "}
            {pourcentage(tableau.marge)} de marge. La réserve vaut{" "}
            {fcfaCourt(tableau.reserve)} de marchandise.
          </p>
        </div>
        <div className="tete-page__cote">
          <Link href="/comptoir/dictee" className="bouton bouton--brique">
            Dicter une écriture
            <span className="bouton__fleche">
              <Icone nom="voix" taille={15} />
            </span>
          </Link>
        </div>
      </div>

      <div className="jumellees">
        <section className="feuille bloc" aria-label="Ce que la journée a rapporté">
          <div className="tete-feuille">
            <h2>La journée</h2>
            <span className="tete-feuille__cote">
              {tableau.ventes} écritures
            </span>
          </div>
          <div className="compteurs">
            <div className="compteur">
              <span className="compteur__legende">Chiffre d’affaires</span>
              <span className="compteur__valeur">
                {fcfaCourt(tableau.chiffre)}
              </span>
              <span className="compteur__aide">
                {tableau.ventes > 0
                  ? `${fcfaCourt(Math.round(tableau.chiffre / tableau.ventes))} par vente`
                  : "rien vendu pour l'instant"}
              </span>
            </div>
            <div className={`compteur ${tableau.benefice >= 0 ? "compteur--tenu" : "compteur--tard"}`}>
              <span className="compteur__legende">Bénéfice net</span>
              <span className="compteur__valeur">
                {fcfaCourt(tableau.benefice_net)}
              </span>
              <span className="compteur__aide">
                {pourcentage(tableau.marge)} de marge, après{" "}
                {fcfaCourt(tableau.benefice - tableau.benefice_net)} de dépenses
              </span>
            </div>
            <div className="compteur">
              <span className="compteur__legende">À racheter</span>
              <span className="compteur__valeur">{tableau.article_alerte}</span>
              <span className="compteur__aide">sous le seuil du rayon</span>
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
            Sept jours d’affilée, la semaine en cours à{" "}
            {fcfaCourt(tableau.semaine.chiffre)} de chiffre et{" "}
            {fcfaCourt(tableau.semaine.benefice_net)} nets.
          </p>
        </section>

        <section className="feuille bloc" aria-label="Ce qui s'est vendu aujourd’hui">
          <div className="tete-feuille">
            <h2>Les dernières ventes</h2>
            <span className="tete-feuille__cote">
              <Link href="/comptoir/sorties" className="lien-simple">
                tout le journal
              </Link>
            </span>
          </div>
          {ventes.ventes.length === 0 ? (
            <div className="vide">
              <h3>Rien au cahier aujourd’hui.</h3>
              <p>
                Une phrase de cinq secondes suffit : « 2 fanta 900 ».
              </p>
              <Link href="/comptoir/dictee" className="bouton bouton--encre">
                Dicter
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
                      {vente.dictee ? " · dictée" : ""}
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

        <section className="feuille bloc" aria-label="Le rayon qui baisse">
          <div className="tete-feuille">
            <h2>À racheter</h2>
            <span className="tete-feuille__cote">
              {cahier.en_alerte} ligne{cahier.en_alerte > 1 ? "s" : ""}
            </span>
          </div>
          {cahier.produits.length === 0 ? (
            <p className="champ__aide">
              Tout le rayon est au-dessus de son seuil. Rien à commander
              demain matin.
            </p>
          ) : (
            <ul className="ventes-liste">
              {cahier.produits.slice(0, 8).map((produit) => (
                <li className="vente-ligne" key={produit.id}>
                  <span className="vente-ligne__qui">
                    {produit.nom}
                    <small>
                      seuil {produit.alerte_stock} · reste{" "}
                      {produit.stock} {produit.unite}
                    </small>
                  </span>
                  <span className="vente-ligne__quantite" />
                  <span className="vente-ligne__montant">{produit.marge_label}</span>
                  <span className="vente-ligne__outils">
                    <span className="etiquette etiquette--alerte">alerte</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="acts">
            <Link href="/comptoir/rayon" className="lien-simple">
              Ouvrir le rayon
            </Link>
          </div>
        </section>
      </div>

      <section className="feuille bloc" aria-label="Ce qui part le mieux">
        <div className="tete-feuille">
          <h2>Les articles qui tirent la journée</h2>
          <span className="tete-feuille__cote">par chiffre</span>
        </div>
        {tableau.meilleures.length === 0 ? (
          <p className="champ__aide">
            Pas encore de vente aujourd’hui. Le classement se fait tout seul
            dès la première.
          </p>
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
