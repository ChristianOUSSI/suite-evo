import type { Metadata } from "next";
import Link from "next/link";

import { FormulaireEleve } from "@/components/formulaire-eleve";
import { Icone } from "@/components/icone";
import { lire } from "@/lib/api";
import { t } from "@/lib/langue";
import { langueServeur } from "@/lib/langue-serveur";
import { seanceObligatoire } from "@/lib/session";
import type { Classe } from "@/lib/types";

import "../../../../../styles/eleves.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueServeur();
  return { title: t("nouvel.meta", langue) };
}

export default async function NouvelEleve() {
  const langue = await langueServeur();
  const [journee, session] = await Promise.all([
    lire<{ classes: Classe[] }>("/dashboard"),
    seanceObligatoire(),
  ]);

  return (
    <div className="shell vitre">
      <div className="page-head">
        <div className="page-head__main">
          <span className="kicker">
            <Icone nom="eleve" taille={14} /> {t("nouvel.kicker", langue)}
          </span>
          <h1 className="display">{t("nouvel.titre", langue)}</h1>
          <p className="page-head__lede">
            {t("nouvel.lede", langue)}
          </p>
        </div>
        <div className="page-head__aside">
          <Link href="/app/eleves" className="btn btn--quiet">
            {t("nouvel.retour", langue)}
          </Link>
        </div>
      </div>

      <FormulaireEleve classes={journee.classes} annee={session.ecole.annee} langue={langue} />
    </div>
  );
}
