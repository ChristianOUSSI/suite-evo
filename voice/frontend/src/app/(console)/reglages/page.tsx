import type { Metadata } from "next";
import { Equipe } from "@/components/equipe";
import { Reglages } from "@/components/reglages";
import { lire } from "@/lib/api";
import { seance } from "@/lib/session";
import type { Reglages as Chargement } from "@/lib/types";
import "../../../styles/reglages.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Établissement',
};

export default async function ReglagesPage() {
  const session = await seance();
  const chargement = await lire<Chargement>("/settings");

  return (
    <>
      <header className="entete-page">
        <div>
          <h1>Établissement</h1>
          <p className="note">
            Les mots que la voix prononce, les canaux qui sont ouverts, et les
            mains qui tiennent la console. Tout part d'ici.
          </p>
        </div>
        <span className="temoignage">
          <span className="feu" /> Démo : aucun envoi réel, aucune facture levée
        </span>
      </header>

      <div className="reglages-pied">
        <Reglages
          organisation={chargement.organization}
          lignes={chargement.lines}
          compte={chargement.counters}
        />
        <div className="suite">
          <Equipe equipe={chargement.team} moi={session.user.name} />
        </div>
      </div>
    </>
  );
}
