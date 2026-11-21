import type { Metadata } from "next";
import Link from "next/link";

import { FormulaireSeance } from "@/components/formulaire-seance";
import { Icone } from "@/components/icone";
import { NomComptoir } from "@/components/marque";
import { t } from "@/lib/langue";
import { langueServeur } from "@/lib/langue-serveur";

import "../../styles/entree.css";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueServeur();
  return {
    title: t("connexion.meta-titre", langue),
    description: t("connexion.meta-desc", langue),
  };
}

export default async function Seance() {
  const langue = await langueServeur();
  return (
    <div className="entree">
      <header className="fronton">
        <div className="gabarit fronton__rangee">
          <NomComptoir langue={langue} />
          <nav className="entree__nav" aria-label={t("connexion.nav-retour", langue)}>
            <Link href="/" className="bouton bouton--petit bouton--doux">
              {t("connexion.nav-presentation", langue)}
            </Link>
          </nav>
        </div>
      </header>

      <main id="contenu" className="gabarit seance">
        <div>
          <span className="sur-titre">
            <Icone nom="comptoir" taille={13} /> {t("connexion.edition", langue)}
          </span>
          <h1 className="display">{t("connexion.titre", langue)}</h1>
          <p className="seance__chapo">{t("connexion.chapo", langue)}</p>
          <div className="seance__reste">
            <span>Alimentation Générale Tchuenté</span>
            <span>Ndokoti · Douala</span>
            <span>Abonnement 3&nbsp;000&nbsp;FCFA par semaine</span>
          </div>
        </div>

        <FormulaireSeance />
      </main>
    </div>
  );
}
