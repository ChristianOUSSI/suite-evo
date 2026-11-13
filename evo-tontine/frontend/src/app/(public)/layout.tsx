import type { ReactNode } from "react";
import Link from "next/link";

import { Bascules } from "@/components/bascules";
import { NomProduit } from "@/components/marque";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";

export const dynamic = "force-dynamic";

/**
 * La porte d'entrée de celui qui n'a pas de compte.
 *
 * Un membre qui reçoit le pot ne doit pas créer d'adresse pour prouver qu'il
 * l'a reçu. Cette partie du site se lit sans séance, et ne montre jamais rien
 * d'autre que la remise cherchée.
 */
export default async function LayoutPublic({ children }: { children: ReactNode }) {
  const langue = await langueCourante();
  const t = traduire(langue).t;

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" />
          <Bascules langue={langue} />
        </div>
      </header>

      <main id="contenu" className="cadc-corps">
        {children}
      </main>

      <footer className="cadc-pied">
        <div className="cadc-gabarit cadc-pied__rangee">
          <span>CODE AXIS DIGITAL CAMEROON · Douala</span>
          <Link href="/cercle">{t("nav.cercle")}</Link>
          <Link href="/">{t("commun.retour")}</Link>
        </div>
      </footer>
    </div>
  );
}
