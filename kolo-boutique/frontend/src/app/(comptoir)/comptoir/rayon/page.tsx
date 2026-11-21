import type { Metadata } from "next";
import Link from "next/link";

import { Icone } from "@/components/icone";
import { RayonConsole } from "@/components/rayon-console";
import { lire } from "@/lib/api";
import { parametres } from "@/lib/client-api";
import { fcfaCourt } from "@/lib/format";
import { t } from "@/lib/langue";
import { langueServeur } from "@/lib/langue-serveur";
import type { Cahier, JournalEntrees } from "@/lib/types";

import "../../../../styles/comptoir.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueServeur();
  return { title: t("rayon.meta", langue) };
}

export default async function Rayon({
  searchParams,
}: {
  searchParams: Promise<{ motif?: string; categorie?: string; alertes?: string }>;
}) {
  const filtre = await searchParams;
  const langue = await langueServeur();
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
            <Icone nom="rayon" taille={13} /> {cahier.total}{" "}
            {t("rayon.lignes-tenues", langue)}
          </span>
          <h1 className="display">{t("rayon.titre", langue)}</h1>
          <p className="tete-page__entree">
            {t("rayon.chapo", langue, {
              reserve: fcfaCourt(cahier.reserve),
              alertes: cahier.en_alerte,
            })}
          </p>
        </div>
        <div className="tete-page__cote">
          <a href="/api/exports/stock.csv" className="bouton" download>
            <Icone nom="feuille" taille={15} /> {t("rayon.exporter", langue)}
          </a>
        </div>
      </div>

      <form className="filtres" action="/comptoir/rayon" method="get">
        <div className="champ">
          <label htmlFor="filtre-motif">{t("rayon.chercher", langue)}</label>
          <input
            id="filtre-motif"
            name="motif"
            defaultValue={filtre.motif ?? ""}
            placeholder="fanta, riz, savon"
          />
        </div>
        <div className="champ">
          <label htmlFor="filtre-cat">{t("rayon.categorie", langue)}</label>
          <input
            id="filtre-cat"
            name="categorie"
            defaultValue={filtre.categorie ?? ""}
            placeholder={t("rayon.ph-cat", langue)}
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
            {t("rayon.seulement-baisse", langue)}
            <small>{t("rayon.sous-seuil", langue)}</small>
          </span>
        </label>
        <div className="acts">
          <button type="submit" className="bouton bouton--encre bouton--petit">
            {t("rayon.filtrer", langue)}
          </button>
          <Link href="/comptoir/rayon" className="bouton bouton--doux bouton--petit">
            {t("rayon.tout-revoir", langue)}
          </Link>
        </div>
      </form>

      <RayonConsole cahier={cahier} langue={langue} />

      <section className="feuille bloc" aria-label={t("rayon.rachats-titre", langue)}>
        <div className="tete-feuille">
          <h2>{t("rayon.rachats-titre", langue)}</h2>
          <span className="tete-feuille__cote">
            {t("rayon.rachats-cote", langue, {
              montant: rachats.debourse_label,
              jours: rachats.jours,
            })}
          </span>
        </div>
        {rachats.entrees.length === 0 ? (
          <p className="champ__aide">{t("rayon.rachats-vide", langue)}</p>
        ) : (
          <ul className="ventes-liste">
            {rachats.entrees.map((ligne) => (
              <li className="vente-ligne" key={ligne.id}>
                <span className="vente-ligne__qui">
                  {ligne.produit}
                  <small>
                    {ligne.fournisseur || t("rayon.fournisseur-inconnu", langue)} ·{" "}
                    {ligne.jour_label}
                    {ligne.dictee ? ` · ${t("jour.dictation", langue)}` : ""}
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
