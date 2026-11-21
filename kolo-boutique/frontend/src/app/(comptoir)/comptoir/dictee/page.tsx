import type { Metadata } from "next";

import { ConsoleDictee } from "@/components/console-dictee";
import { Icone } from "@/components/icone";
import { lire } from "@/lib/api";
import { heure } from "@/lib/format";
import { t } from "@/lib/langue";
import { langueServeur } from "@/lib/langue-serveur";
import { seanceObligatoire } from "@/lib/session";
import type {
  JournalDepenses,
  JournalEntrees,
  JournalVentes,
} from "@/lib/types";

import "../../../../styles/comptoir.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueServeur();
  return { title: t("dictee.meta", langue) };
}

export default async function Dictee() {
  const session = await seanceObligatoire();
  const langue = await langueServeur();
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
        etat: un.annule
          ? t("dictee.etat-rayee", langue)
          : `${t("dictee.etat-sortie", langue)} · ${un.chiffre_label}`,
      })),
    ...entrees.entrees
      .filter((un) => un.dictee && un.brut)
      .map((un) => ({
        id: `e-${un.id}`,
        phrase: un.brut,
        moment: heure(un.jour),
        etat: `${t("dictee.etat-rachat", langue)} · ${un.total_label}`,
      })),
    ...depenses.depenses
      .filter((un) => un.note)
      .map((un) => ({
        id: `d-${un.id}`,
        phrase: un.note,
        moment: heure(un.jour),
        etat: `${t("dictee.etat-depense", langue)} · ${un.montant_label}`,
      })),
  ].slice(0, 12);

  return (
    <div className="gabarit vitre">
      <div className="tete-page">
        <div className="tete-page__principal">
          <span className="sur-titre">
            <Icone nom="voix" taille={13} /> {session.boutique.enseigne || t("comptoir.defaut", langue)}
          </span>
          <h1 className="display">{t("dictee.titre", langue)}</h1>
          <p className="tete-page__entree">{t("dictee.chapo", langue)}</p>
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
