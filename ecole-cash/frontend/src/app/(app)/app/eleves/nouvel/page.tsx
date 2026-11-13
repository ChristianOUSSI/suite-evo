import type { Metadata } from "next";
import Link from "next/link";

import { FormulaireEleve } from "@/components/formulaire-eleve";
import { Icone } from "@/components/icone";
import { lire } from "@/lib/api";
import { seanceObligatoire } from "@/lib/session";
import type { Classe } from "@/lib/types";

import "../../../../../styles/eleves.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inscription"
};

export default async function NouvelEleve() {
  const [journee, session] = await Promise.all([
    lire<{ classes: Classe[] }>("/dashboard"),
    seanceObligatoire(),
  ]);

  return (
    <div className="shell vitre">
      <div className="page-head">
        <div className="page-head__main">
          <span className="kicker">
            <Icone nom="eleve" taille={14} /> État civil scolaire
          </span>
          <h1 className="display">Inscrire un élève</h1>
          <p className="page-head__lede">
            Le nom et le prénom ne se corrigent pas après coup : ils portent le
            matricule. Tout le reste, si.
          </p>
        </div>
        <div className="page-head__aside">
          <Link href="/app/eleves" className="btn btn--quiet">
            Retour aux familles
          </Link>
        </div>
      </div>

      <FormulaireEleve classes={journee.classes} annee={session.ecole.annee} />
    </div>
  );
}
