import type { Metadata } from "next";
import { Combine } from "@/components/combine";
import { lire } from "@/lib/api";
import { seance } from "@/lib/session";
import type { Guichet, Ligne } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Appel testé',
};

export default async function Simulateur() {
  const session = await seance();
  const [lignes, guichets] = await Promise.all([
    lire<Ligne[]>("/lines"),
    lire<Guichet[]>("/standard/guichets"),
  ]);

  const detail = await Promise.all(
    lignes.map((ligne) => lire<Ligne>(`/lines/${ligne.id}`))
  );

  return (
    <>
      <header className="entete-page">
        <div>
          <h1>Appel testé</h1>
          <p className="note">
            Le même moteur que celui qui répond la nuit. Chaque essai écrit une
            fiche dans le journal, pose un rendez-vous ou remplit la main
            courante, comme un appel reçu.
          </p>
        </div>
        <span className="temoignage">
          <span className="feu attente" /> Démonstration, aucun opérateur appelé
        </span>
      </header>

      <Combine
        lignes={detail}
        guichets={guichets}
        agent={session.organization.agent_name}
      />
    </>
  );
}
