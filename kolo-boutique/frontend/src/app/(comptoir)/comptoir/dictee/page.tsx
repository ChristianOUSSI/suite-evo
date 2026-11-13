import type { Metadata } from "next";

import { ConsoleDictee } from "@/components/console-dictee";
import { Icone } from "@/components/icone";
import { lire } from "@/lib/api";
import { heure } from "@/lib/format";
import { seanceObligatoire } from "@/lib/session";
import type {
  JournalDepenses,
  JournalEntrees,
  JournalVentes,
} from "@/lib/types";

import "../../../../styles/comptoir.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dicter",
};

export default async function Dictee() {
  const session = await seanceObligatoire();
  const [ventes, entrees, depenses] = await Promise.all([
    lire<JournalVentes>("/ventes?jours=1&limite=40"),
    lire<JournalEntrees>("/entrees?jours=7&limite=20"),
    lire<JournalDepenses>("/depenses?jours=7"),
  ]);

  const ecoutes = [
    ...ventes.ventes
      .filter((un) => un.dictee && un.brut)
      .map((un) => ({
        id: `v-${un.id}`,
        phrase: un.brut,
        moment: un.heure,
        etat: un.annule ? "rayée" : `sortie · ${un.chiffre_label}`,
      })),
    ...entrees.entrees
      .filter((un) => un.dictee && un.brut)
      .map((un) => ({
        id: `e-${un.id}`,
        phrase: un.brut,
        moment: heure(un.jour),
        etat: `rachat · ${un.total_label}`,
      })),
    ...depenses.depenses
      .filter((un) => un.note)
      .map((un) => ({
        id: `d-${un.id}`,
        phrase: un.note,
        moment: heure(un.jour),
        etat: `dépense · ${un.montant_label}`,
      })),
  ].slice(0, 12);

  return (
    <div className="gabarit vitre">
      <div className="tete-page">
        <div className="tete-page__principal">
          <span className="sur-titre">
            <Icone nom="voix" taille={13} /> {session.boutique.enseigne || "Le comptoir"}
          </span>
          <h1 className="display">Dicter au lieu d’écrire</h1>
          <p className="tete-page__entree">
            La promesse du produit tient dans un champ de texte : une phrase
            courte, écoutée, relue avant d’entrer au cahier. Rien n’est écrit
            sans que l’article, la quantité et le prix soient affichés d’abord.
          </p>
        </div>
      </div>

      <ConsoleDictee
        ecoutes={ecoutes}
        rails={{
          momo: session.boutique.momo_actif,
          orange: session.boutique.orange_actif,
          especes: session.boutique.especes_actifs,
        }}
      />
    </div>
  );
}
