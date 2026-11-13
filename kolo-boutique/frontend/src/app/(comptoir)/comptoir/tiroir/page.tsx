import type { Metadata } from "next";
import Link from "next/link";

import { ComptageTiroir } from "@/components/comptage-tiroir";
import { Icone } from "@/components/icone";
import { lire } from "@/lib/api";
import { fcfaCourt, pourcentage } from "@/lib/format";
import type { Caisse, Journees } from "@/lib/types";

import "../../../../styles/comptoir.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Le tiroir",
};

const FEUILLES = [
  {
    href: "/api/exports/ventes.csv?jours=30",
    titre: "Les ventes",
    texte: "Chaque ligne : article, quantité, prix cédé, coût, bénéfice, rail.",
  },
  {
    href: "/api/exports/stock.csv",
    titre: "Le rayon",
    texte: "Coût moyen, prix vendu, stock, seuil d'alerte et valeur dormante.",
  },
  {
    href: "/api/exports/journees.csv?jours=30",
    titre: "Les journées",
    texte: "Un jour par ligne : chiffre, coût, bénéfice net, marge, espèces.",
  },
  {
    href: "/api/exports/depenses.csv?jours=30",
    titre: "Les sorties",
    texte: "Transport, loyer, salaire, facture, avec leur date.",
  },
];

export default async function Tiroir() {
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
          <h1 className="display">Le tiroir du soir</h1>
          <p className="tete-page__entree">
            {caisse.ventes} écriture{caisse.ventes > 1 ? "s" : ""} au cahier
            aujourd&apos;hui, {fcfaCourt(caisse.chiffre)} de chiffre à{" "}
            {pourcentage(caisse.marge)} de marge. Le tiroir doit contenir{" "}
            {caisse.attendu_label}.
          </p>
        </div>
      </div>

      <div className="pilees-deux">
        <section className="feuille bloc" aria-label="Compter le tiroir">
          <div className="tete-feuille">
            <h2>Compter</h2>
            <span className="tete-feuille__cote">
              {caisse.comptage ? "déjà déclaré" : "rien déclaré"}
            </span>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <ComptageTiroir caisse={caisse} />
          </div>
        </section>

        <div className="vitre-serre">
          <section className="feuille bloc" aria-label="Ce que la journée a rendu">
            <div className="tete-feuille">
              <h2>La journée en chiffres</h2>
              <span className="tete-feuille__cote">lu au cahier</span>
            </div>
            <dl className="tiroir-lignes">
              <div className="ligne-reglure">
                <dt className="ligne-reglure__nom">Chiffre du jour</dt>
                <dd className="ligne-reglure__valeur">{caisse.chiffre_label}</dd>
              </div>
              <div className="ligne-reglure">
                <dt className="ligne-reglure__nom">dont espèces</dt>
                <dd className="ligne-reglure__valeur">{caisse.especes_label}</dd>
              </div>
              <div className="ligne-reglure">
                <dt className="ligne-reglure__nom">Bénéfice brut</dt>
                <dd className="ligne-reglure__valeur">{caisse.benefice_label}</dd>
              </div>
              <div className="ligne-reglure">
                <dt className="ligne-reglure__nom">Dépenses du jour</dt>
                <dd className="ligne-reglure__valeur">{caisse.depenses_label}</dd>
              </div>
              <div className="ligne-reglure">
                <dt className="ligne-reglure__nom">Bénéfice net</dt>
                <dd className="ligne-reglure__valeur">
                  {caisse.benefice_net_label}
                </dd>
              </div>
              <div className="ligne-reglure">
                <dt className="ligne-reglure__nom">Attendu au tiroir</dt>
                <dd className="ligne-reglure__valeur">{caisse.attendu_label}</dd>
              </div>
            </dl>

            {caisse.comptage ? (
              <p className="note-bas note-bas--tenu" style={{ marginTop: "0.9rem" }}>
                Compté {caisse.comptage.compte_label} par{" "}
                {caisse.comptage.tenu_par} · écart{" "}
                {caisse.comptage.ecart_label}
                {caisse.comptage.tenu ? " (au franc près)" : ""}
              </p>
            ) : null}
          </section>

          <section className="feuille bloc" aria-label="Les quatorze derniers jours">
            <div className="tete-feuille">
              <h2>Quatorze jours</h2>
              <span className="tete-feuille__cote">du plus récent</span>
            </div>
            <ul className="ventes-liste">
              {feuilles.journees.map((feuille) => (
                <li className="vente-ligne" key={feuille.jour}>
                  <span className="vente-ligne__qui">
                    {feuille.jour}
                    <small>
                      {feuille.ventes} vente{feuille.ventes > 1 ? "s" : ""} ·{" "}
                      {feuille.ticket_moyen_label} de ticket
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
                      {fcfaCourt(feuille.benefice_net)} net
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <section className="feuille bloc" id="feuilles" aria-label="Les feuilles à emporter">
        <div className="tete-feuille">
          <h2>Les feuilles à emporter</h2>
          <span className="tete-feuille__cote">
            <Icone nom="feuille" taille={13} /> quatre exports
          </span>
        </div>
        <p className="champ__aide">
          Chaque feuille s&apos;ouvre dans Excel ou LibreOffice, en français,
          séparée par des points-virgules. Rien ne quitte cette machine.
        </p>
        <ul className="feuilles-export">
          {FEUILLES.map((feuille) => (
            <li key={feuille.href}>
              <a href={feuille.href} download>
                <Icone nom="feuille" taille={15} /> {feuille.titre}
              </a>
              <span>{feuille.texte}</span>
            </li>
          ))}
        </ul>
        <Link href="/comptoir" className="lien-simple">
          Revenir à la journée
        </Link>
      </section>
    </div>
  );
}
