import type { Metadata } from "next";
import Link from "next/link";

import { Icone } from "@/components/icone";
import { RayonConsole } from "@/components/rayon-console";
import { lire } from "@/lib/api";
import { parametres } from "@/lib/client-api";
import { fcfaCourt } from "@/lib/format";
import type { Cahier, JournalEntrees } from "@/lib/types";

import "../../../../styles/comptoir.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Le rayon",
};

export default async function Rayon({
  searchParams,
}: {
  searchParams: Promise<{ motif?: string; categorie?: string; alertes?: string }>;
}) {
  const filtre = await searchParams;
  const cahier = await lire<Cahier>(
    `/produits${parametres({
      motif: filtre.motif,
      categorie: filtre.categorie,
      alertes: filtre.alertes === "1" ? true : undefined,
    })}`,
  );
  const rachats = await lire<JournalEntrees>("/entrees?jours=14&limite=8");

  return (
    <div className="gabarit vitre">
      <div className="tete-page">
        <div className="tete-page__principal">
          <span className="sur-titre">
            <Icone nom="rayon" taille={13} /> {cahier.total} ligne
            {cahier.total > 1 ? "s" : ""} tenues
          </span>
          <h1 className="display">Le rayon</h1>
          <p className="tete-page__entree">
            La réserve vaut {fcfaCourt(cahier.reserve)} de marchandise au coût
            moyen. {cahier.en_alerte} ligne
            {cahier.en_alerte > 1 ? "s" : ""} sous le seuil d&apos;alerte.
          </p>
        </div>
        <div className="tete-page__cote">
          <a href="/api/exports/stock.csv" className="bouton" download>
            <Icone nom="feuille" taille={15} /> Feuille du rayon
          </a>
        </div>
      </div>

      <form className="filtres" action="/comptoir/rayon" method="get">
        <div className="champ">
          <label htmlFor="filtre-motif">Chercher un article</label>
          <input
            id="filtre-motif"
            name="motif"
            defaultValue={filtre.motif ?? ""}
            placeholder="fanta, riz, savon"
          />
        </div>
        <div className="champ">
          <label htmlFor="filtre-cat">Catégorie</label>
          <input
            id="filtre-cat"
            name="categorie"
            defaultValue={filtre.categorie ?? ""}
            placeholder="épicerie"
          />
        </div>
        <label className="cochet">
          <input
            type="checkbox"
            name="alertes"
            value="1"
            defaultChecked={filtre.alertes === "1"}
          />
          <span className="cochet__box" aria-hidden="true" />
          <span className="cochet__texte">
            Seulement ce qui baisse
            <small>sous le seuil d&apos;alerte de la ligne</small>
          </span>
        </label>
        <div className="acts">
          <button type="submit" className="bouton bouton--encre bouton--petit">
            Filtrer
          </button>
          <Link href="/comptoir/rayon" className="bouton bouton--doux bouton--petit">
            Tout revoir
          </Link>
        </div>
      </form>

      <RayonConsole cahier={cahier} />

      <section className="feuille bloc" aria-label="Les derniers rachats">
        <div className="tete-feuille">
          <h2>Les derniers rachats</h2>
          <span className="tete-feuille__cote">
            {rachats.debourse_label} déboursés sur {rachats.jours} jours
          </span>
        </div>
        {rachats.entrees.length === 0 ? (
          <p className="champ__aide">
            Aucun rachat consigné. Le rayon se garnit par la dictée ou par la
            fiche d&apos;un article.
          </p>
        ) : (
          <ul className="ventes-liste">
            {rachats.entrees.map((ligne) => (
              <li className="vente-ligne" key={ligne.id}>
                <span className="vente-ligne__qui">
                  {ligne.produit}
                  <small>
                    {ligne.fournisseur || "fournisseur non noté"} ·{" "}
                    {ligne.jour_label}
                    {ligne.dictee ? " · dictée" : ""}
                  </small>
                </span>
                <span className="vente-ligne__quantite">
                  {ligne.quantite} {ligne.unite}
                </span>
                <span className="vente-ligne__montant">{ligne.total_label}</span>
                <span className="vente-ligne__outils">
                  <span className="etiquette etiquette--douce">
                    {ligne.cout_unitaire_label} / {ligne.unite}
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
