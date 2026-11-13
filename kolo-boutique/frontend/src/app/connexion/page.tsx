import type { Metadata } from "next";
import Link from "next/link";

import { FormulaireSeance } from "@/components/formulaire-seance";
import { Icone } from "@/components/icone";
import { NomComptoir } from "@/components/marque";

import "../../styles/entree.css";

export const metadata: Metadata = {
  title: "Ouvrir le comptoir",
  description:
    "Reprendre le cahier de la boutique : la journée en cours, la dictée du rayon et le tiroir du soir.",
};

export default function Seance() {
  return (
    <div className="entree">
      <header className="fronton">
        <div className="gabarit fronton__rangee">
          <NomComptoir />
          <nav className="entree__nav" aria-label="Retour">
            <Link href="/" className="bouton bouton--petit bouton--doux">
              La présentation
            </Link>
          </nav>
        </div>
      </header>

      <main id="contenu" className="gabarit seance">
        <div>
          <span className="sur-titre">
            <Icone nom="comptoir" taille={13} /> Édition de démonstration
          </span>
          <h1 className="display">Le comptoir ouvre pour douze heures.</h1>
          <p className="seance__chapo">
            Une adresse suffit. Le cahier retrouve la journée en cours, le rayon,
            les dictées déjà écrites et le tiroir compté la veille.
          </p>
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
