import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormulaireConnexion } from "@/components/formulaire-connexion";
import { sessionPresente } from "@/lib/api";
import "../../styles/connexion.css";

export const metadata: Metadata = {
  title: "Connexion à la console du standard",
};

export default async function Connexion() {
  if (await sessionPresente()) {
    redirect("/tableau");
  }
  return (
    <main className="connexion">
      <section className="gouache">
        <div className="marque">
          <b>CADC VOICE</b>
          <span>Bonapriso, Douala</span>
        </div>
        <p>
          « Le standard est fermé pour l'instant. La reprise se fait lundi 2
          novembre à 7 h 30. » C'est écrit ici, ce n'est pas une phrase toute
          faite.
        </p>
        <div className="signal">
          <span className="point" />
          <span>Installation de démonstration, appels simulés</span>
        </div>
      </section>
      <FormulaireConnexion plein />
      <Link href="/" className="visuel">
        Retour à l'offre
      </Link>
    </main>
  );
}
