import type { Metadata } from "next";
import Link from "next/link";

import { FormulaireComptoir } from "@/components/formulaire-comptoir";
import { Icone } from "@/components/icone";
import { lire } from "@/lib/api";
import { fcfaCourt } from "@/lib/format";
import { seanceObligatoire } from "@/lib/session";
import type { Cahier, JournalDepenses, Main, Tableau } from "@/lib/types";

import "../../../../styles/comptoir.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Le comptoir",
};

export default async function Reglages() {
  const session = await seanceObligatoire();
  const [tableau, cahier, depenses, mains] = await Promise.all([
    lire<Tableau>("/tableau"),
    lire<Cahier>("/produits"),
    lire<JournalDepenses>("/depenses?jours=30"),
    lire<Main[]>("/mains"),
  ]);

  return (
    <div className="gabarit vitre">
      <div className="tete-page">
        <div className="tete-page__principal">
          <span className="sur-titre">
            <Icone nom="reglage" taille={13} /> {session.boutique.ville}
          </span>
          <h1 className="display">Les réglages du comptoir</h1>
          <p className="tete-page__entree">
            Les mots de la boutique, ses rails de caisse et les mains qui
            tiennent le cahier. Changer un texte ne change aucune écriture déjà
            consignée.
          </p>
        </div>
        <div className="tete-page__cote">
          <span className="tampon tampon--rayon">
            Démo · {session.boutique.abonnement_hebdo_label} / semaine
          </span>
        </div>
      </div>

      <nav className="bande-ancre" aria-label="Sections des réglages">
        <a href="#comptoir">Le comptoir</a>
        <a href="#rails">Les rails</a>
        <a href="#mains">Les mains</a>
        <a href="#bilan">Le bilan</a>
      </nav>

      <FormulaireComptoir
        boutique={session.boutique}
        mains={mains}
        autoriseEquipe={session.user.role === "tenancier"}
      />

      <section className="feuille bloc" id="bilan" aria-label="Ce que le cahier tient déjà">
        <div className="tete-feuille">
          <h2>Ce que le cahier tient déjà</h2>
          <span className="tete-feuille__cote">à ne pas effacer</span>
        </div>
        <dl className="tiroir-lignes">
          <div className="ligne-reglure">
            <dt className="ligne-reglure__nom">Lignes du rayon</dt>
            <dd className="ligne-reglure__valeur">{cahier.total}</dd>
          </div>
          <div className="ligne-reglure">
            <dt className="ligne-reglure__nom">Valeur dormante en réserve</dt>
            <dd className="ligne-reglure__valeur">{fcfaCourt(tableau.reserve)}</dd>
          </div>
          <div className="ligne-reglure">
            <dt className="ligne-reglure__nom">Chiffre d&apos;aujourd&apos;hui</dt>
            <dd className="ligne-reglure__valeur">{fcfaCourt(tableau.chiffre)}</dd>
          </div>
          <div className="ligne-reglure">
            <dt className="ligne-reglure__nom">Dépenses sur 30 jours</dt>
            <dd className="ligne-reglure__valeur">{depenses.total_label}</dd>
          </div>
          <div className="ligne-reglure">
            <dt className="ligne-reglure__nom">Articles sous l&apos;alerte</dt>
            <dd className="ligne-reglure__valeur">{cahier.en_alerte}</dd>
          </div>
        </dl>
        <div className="acts">
          <Link href="/comptoir/tiroir#feuilles" className="lien-simple">
            Emporter les feuilles CSV
          </Link>
          <Link href="/comptoir" className="bouton bouton--petit bouton--doux">
            Revenir à la journée
          </Link>
        </div>
      </section>
    </div>
  );
}
