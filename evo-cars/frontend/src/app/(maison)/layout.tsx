import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { Bascules } from "@/components/bascules";
import { EcranIncident } from "@/components/ecran-incident";
import { NomProduit } from "@/components/marque";
import { Rail } from "@/components/rail";
import { ErreurChantier } from "@/lib/errors";
import { langueCourante, seance } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { Seance } from "@/lib/types";

import "../globals.css";
import "../../styles/cars.css";

export const dynamic = "force-dynamic";

export default async function MaisonLayout({ children }: { children: ReactNode }) {
  const langue = await langueCourante();
  const t = traduire(langue).t;

  let courante: Seance | null;
  try {
    courante = await seance();
  } catch (erreur) {
    return (
      <EcranIncident
        langue={langue}
        t={t}
        message={erreur instanceof ErreurChantier ? erreur.message : undefined}
      />
    );
  }

  if (!courante) {
    redirect("/connexion");
  }

  const { user, organisation } = courante;

  return (
    <div className="cadc-app">
      <div className="cadc-dateau">
        <div className="cadc-gabarit cadc-dateau__rangee">
          <span>
            {organisation.nom} · {organisation.quartier || organisation.ville}
          </span>
          <span>
            {user.nom} · {t(`role.${user.role}`)}
          </span>
        </div>
      </div>

      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/accueil" sous={organisation.nom} />
          <Bascules langue={langue} />
        </div>
      </header>

      <main id="contenu" className="cadc-corps">
        {children}
      </main>

      <Rail langue={langue} />
    </div>
  );
}
