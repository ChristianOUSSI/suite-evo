import type { Metadata } from "next";
import Link from "next/link";

import { BoutonRayure } from "@/components/bouton-rayure";
import { ConsoleVente } from "@/components/console-vente";
import { Icone } from "@/components/icone";
import { lire } from "@/lib/api";
import { parametres } from "@/lib/client-api";
import { fcfaCourt } from "@/lib/format";
import { t } from "@/lib/langue";
import { langueServeur } from "@/lib/langue-serveur";
import { seanceObligatoire } from "@/lib/session";
import type { Cahier, JournalDepenses, JournalVentes } from "@/lib/types";

import "../../../../styles/comptoir.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueServeur();
  return { title: t("sorties.meta", langue) };
}

const JOURS = [1, 3, 7, 30];

export default async function Sorties({
  searchParams,
}: {
  searchParams: Promise<{ jours?: string }>;
}) {
  const filtre = await searchParams;
  const jours = JOURS.includes(Number(filtre.jours)) ? Number(filtre.jours) : 7;

  const session = await seanceObligatoire();
  const langue = await langueServeur();
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
            <Icone nom="vente" taille={13} /> {t("sorties.derniers-jours", langue, { jours: journal.jours })}
          </span>
          <h1 className="display">{t("sorties.titre", langue)}</h1>
          <p className="tete-page__entree">
            {t("sorties.chapo", langue, {
              ventes: tenues.length,
              chiffre: fcfaCourt(journal.chiffre),
              marge: fcfaCourt(journal.benefice),
              rayees,
            })}
          </p>
        </div>
        <div className="tete-page__cote">
          <a
            href={`/api/exports/ventes.csv?jours=${jours}`}
            className="bouton"
            download
          >
            <Icone nom="feuille" taille={15} /> {t("sorties.exporter", langue)}
          </a>
        </div>
      </div>

      <nav className="bande-ancre" aria-label={t("sorties.aria-periode", langue)}>
        {JOURS.map((un) => (
          <Link
            key={un}
            href={`/comptoir/sorties${parametres({ jours: un })}`}
            className={un === jours ? "est-active" : undefined}
          >
            {t("sorties.jour", langue, { n: un })}
          </Link>
        ))}
      </nav>

      <div className="pilees-deux">
        <section className="feuille bloc" aria-label={t("sorties.aria-journal", langue)}>
          <div className="tete-feuille">
            <h2>{t("sorties.journal-titre", langue)}</h2>
            <span className="tete-feuille__cote">{t("sorties.journal-cote", langue)}</span>
          </div>

          {journal.ventes.length === 0 ? (
            <div className="vide">
              <h3>{t("sorties.vide-titre", langue)}</h3>
              <p>{t("sorties.vide-texte", langue)}</p>
              <Link href="/comptoir/dictee" className="bouton bouton--encre">
                {t("jour.dicter", langue)}
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
                      {vente.dictee ? ` · ${t("jour.dictation", langue)}` : ""}
                    </small>
                    {vente.annule && vente.motif_annulation ? (
                      <small>{t("sorties.rayee-motif", langue, { motif: vente.motif_annulation })}</small>
                    ) : null}
                  </span>
                  <span className="vente-ligne__quantite">
                    {vente.quantite} {vente.unite}
                  </span>
                  <span className="vente-ligne__montant">{vente.chiffre_label}</span>
                  <span className="vente-ligne__outils">
                    {vente.annule ? (
                      <span className="etiquette etiquette--douce">{t("sorties.rayee", langue)}</span>
                    ) : (
                      <BoutonRayure vente={vente} langue={langue} />
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="vitre-serre">
          <section className="feuille bloc" aria-label={t("sorties.aria-vendre", langue)}>
            <div className="tete-feuille">
              <h2>{t("sorties.vendre-titre", langue)}</h2>
              <span className="tete-feuille__cote">{t("sorties.vendre-cote", langue)}</span>
            </div>
            <ConsoleVente cahier={cahier} boutique={session.boutique} langue={langue} />
          </section>

          <section className="feuille bloc" aria-label={t("sorties.aria-depenses", langue)}>
            <div className="tete-feuille">
              <h2>{t("sorties.depenses-titre", langue)}</h2>
              <span className="tete-feuille__cote">{depenses.total_label}</span>
            </div>
            {depenses.depenses.length === 0 ? (
              <p className="champ__aide">
                {t("sorties.depenses-vide", langue, { jours: depenses.jours })}
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
                      <span className="etiquette etiquette--alerte">{t("sorties.sortie", langue)}</span>
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
