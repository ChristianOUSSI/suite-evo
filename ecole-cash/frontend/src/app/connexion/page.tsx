import type { Metadata } from "next";
import Link from "next/link";

import { FormulaireConnexion } from "@/components/formulaire-connexion";
import { Wordmark } from "@/components/brand";
import { Icone } from "@/components/icone";

import "../../styles/entree.css";

export const metadata: Metadata = {
  title: "Connexion",
  description:
    "Ouvrir la caisse d'un groupe scolaire : encaissements, reçus WhatsApp et relances de scolarité.",
};

export default function Connexion() {
  return (
    <div className="entree">
      <header className="masthead">
        <div className="shell masthead__row">
          <Wordmark href="/" />
          <span className="stamp stamp--gold stamp--straight">
            Édition de démonstration
          </span>
        </div>
      </header>

      <main id="contenu" className="shell entree__corps">
        <div className="entree__promo">
          <span className="kicker">Année 2026/2027 · Douala</span>
          <h1 className="display">
            Le reçu part
            <br />
            sur le téléphone
            <br />
            du parent.
          </h1>
          <p>
            À la caisse, on encaisse en espèces, MoMo ou Orange Money. Le reçu
            s&apos;écrit dans la seconde, la relance se programme toute seule,
            et le soir, le comptage du tiroir se note en trente secondes.
          </p>
          <ul className="entree__liste">
            <li>
              <Icone nom="check" taille={16} />
              Une ardoise par élève et par année, en FCFA entiers.
            </li>
            <li>
              <Icone nom="check" taille={16} />
              Le parent sans smartphone reçoit un message écrit pour lui.
            </li>
            <li>
              <Icone nom="check" taille={16} />
              L&apos;écart du jour reste ouvert tant qu&apos;il n&apos;est pas
              expliqué.
            </li>
          </ul>
        </div>

        <FormulaireConnexion />
      </main>

      <footer className="site-footer">
        <div className="shell site-footer__row">
          <p className="site-footer__note">
            ÉCOLE CASH est un produit de CODE AXIS DIGITAL CAMEROON, à Bonabéri,
            Douala. Les données de cette édition sont un groupe scolaire fictif.
          </p>
          <div className="site-footer__meta">
            <span>15 000 FCFA / école / mois</span>
            <Link href="/">Accueil</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
