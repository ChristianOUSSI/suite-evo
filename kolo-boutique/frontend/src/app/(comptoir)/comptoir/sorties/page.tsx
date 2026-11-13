import type { Metadata } from "next";
import Link from "next/link";

import { BoutonRayure } from "@/components/bouton-rayure";
import { ConsoleVente } from "@/components/console-vente";
import { Icone } from "@/components/icone";
import { lire } from "@/lib/api";
import { parametres } from "@/lib/client-api";
import { fcfaCourt } from "@/lib/format";
import { seanceObligatoire } from "@/lib/session";
import type { Cahier, JournalDepenses, JournalVentes } from "@/lib/types";

import "../../../../styles/comptoir.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Les ventes",
};

const JOURS = [1, 3, 7, 30];

export default async function Sorties({
  searchParams,
}: {
  searchParams: Promise<{ jours?: string }>;
}) {
  const filtre = await searchParams;
  const jours = JOURS.includes(Number(filtre.jours)) ? Number(filtre.jours) : 7;

  const session = await seanceObligatoire();
  const [journal, cahier, depenses] = await Promise.all([
    lire<JournalVentes>(`/ventes${parametres({ jours, limite: 200 })}`),
    lire<Cahier>("/produits"),
    lire<JournalDepenses>(`/depenses${parametres({ jours })}`),
  ]);

  const tenues = journal.ventes.filter((un) => !un.annule);
  const rayees = journal.ventes.length - tenues.length;

  return (
    <div className="gabarit vitre">
      <div className="tete-page">
        <div className="tete-page__principal">
          <span className="sur-titre">
            <Icone nom="vente" taille={13} /> {journal.jours} derniers jours
          </span>
          <h1 className="display">Les ventes du comptoir</h1>
          <p className="tete-page__entree">
            {tenues.length} vente{tenues.length > 1 ? "s" : ""} tenue
            {tenues.length > 1 ? "s" : ""} pour {fcfaCourt(journal.chiffre)} de
            chiffre et {fcfaCourt(journal.benefice)} de marge.{" "}
            {rayees} ligne{rayees > 1 ? "s" : ""} rayée
            {rayees > 1 ? "s" : ""}, la marchandise est revenue en réserve.
          </p>
        </div>
        <div className="tete-page__cote">
          <a
            href={`/api/exports/ventes.csv?jours=${jours}`}
            className="bouton"
            download
          >
            <Icone nom="feuille" taille={15} /> Feuille des ventes
          </a>
        </div>
      </div>

      <nav className="bande-ancre" aria-label="Période">
        {JOURS.map((un) => (
          <Link
            key={un}
            href={`/comptoir/sorties${parametres({ jours: un })}`}
            className={un === jours ? "est-active" : undefined}
          >
            {un} jour{un > 1 ? "s" : ""}
          </Link>
        ))}
      </nav>

      <div className="pilees-deux">
        <section className="feuille bloc" aria-label="Le journal des ventes">
          <div className="tete-feuille">
            <h2>Le journal</h2>
            <span className="tete-feuille__cote">du plus récent</span>
          </div>

          {journal.ventes.length === 0 ? (
            <div className="vide">
              <h3>Rien sur cette période.</h3>
              <p>Une vente naît d&apos;une dictée ou du comptoir, jamais d&apos;un import.</p>
              <Link href="/comptoir/dictee" className="bouton bouton--encre">
                Dicter
              </Link>
            </div>
          ) : (
            <ul className="ventes-liste">
              {journal.ventes.map((vente) => (
                <li
                  className={`vente-ligne${vente.annule ? " vente-ligne--rayee" : ""}`}
                  key={vente.id}
                >
                  <span className="vente-ligne__qui">
                    {vente.produit}
                    <small>
                      {vente.jour_court} · {vente.heure} · {vente.mode_label} ·{" "}
                      {vente.tenu_par}
                      {vente.dictee ? " · dictée" : ""}
                    </small>
                    {vente.annule && vente.motif_annulation ? (
                      <small>rayée : {vente.motif_annulation}</small>
                    ) : null}
                  </span>
                  <span className="vente-ligne__quantite">
                    {vente.quantite} {vente.unite}
                  </span>
                  <span className="vente-ligne__montant">{vente.chiffre_label}</span>
                  <span className="vente-ligne__outils">
                    {vente.annule ? (
                      <span className="etiquette etiquette--douce">rayée</span>
                    ) : (
                      <BoutonRayure vente={vente} />
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="vitre-serre">
          <section className="feuille bloc" aria-label="Vendre au comptoir">
            <div className="tete-feuille">
              <h2>Vendre sans dicter</h2>
              <span className="tete-feuille__cote">la même écriture</span>
            </div>
            <ConsoleVente cahier={cahier} boutique={session.boutique} />
          </section>

          <section className="feuille bloc" aria-label="Les dépenses">
            <div className="tete-feuille">
              <h2>Les sorties d&apos;argent</h2>
              <span className="tete-feuille__cote">{depenses.total_label}</span>
            </div>
            {depenses.depenses.length === 0 ? (
              <p className="champ__aide">
                Aucune dépense sur {depenses.jours} jours.
              </p>
            ) : (
              <ul className="ventes-liste">
                {depenses.depenses.map((ligne) => (
                  <li className="vente-ligne" key={ligne.id}>
                    <span className="vente-ligne__qui">
                      {ligne.libelle}
                      <small>
                        {ligne.jour_label} · {ligne.categorie}
                      </small>
                    </span>
                    <span className="vente-ligne__quantite" />
                    <span className="vente-ligne__montant">
                      {ligne.montant_label}
                    </span>
                    <span className="vente-ligne__outils">
                      <span className="etiquette etiquette--alerte">sortie</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
