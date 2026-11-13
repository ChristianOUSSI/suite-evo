import type { ReactNode } from "react";
import Link from "next/link";

import { Bascules } from "@/components/bascules";
import { NomProduit } from "@/components/marque";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";

export const dynamic = "force-dynamic";

/**
 * La porte du bulletin public : celui qui n'a pas de compte.
 *
 * Un ouvrier qui doute de son mois n'a pas à créer d'adresse ni à demander le
 * cahier au chef : il a un code de dix signes, et cette partie du site ne
 * montre que le mois que ce code désigne.
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
          <Link href="/verifier">{t("nav.bulletin")}</Link>
          <Link href="/">{t("commun.retour")}</Link>
        </div>
      </footer>
    </div>
  );
}
