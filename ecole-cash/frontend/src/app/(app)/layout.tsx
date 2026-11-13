import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppNav } from "@/components/app-nav";
import { BoutonSortie } from "@/components/bouton-sortie";
import { Wordmark } from "@/components/brand";
import { EcranIncident } from "@/components/ecran-incident";
import { ErreurCaisse } from "@/lib/errors";
import { initiales, isoToday, weekdayAndDate } from "@/lib/format";
import { seance } from "@/lib/session";
import type { Seance } from "@/lib/types";

import "../../styles/app.css";

export const dynamic = "force-dynamic";

export default async function EspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Le garde se lit ici, donc il rend lui-même l'écran d'incident : une page
  // d'erreur ne peut pas rattraper la layout qui l'enveloppe.
  let session: Seance | null;
  try {
    session = await seance();
  } catch (erreur) {
    return (
      <EcranIncident
        message={erreur instanceof ErreurCaisse ? erreur.message : undefined}
      />
    );
  }

  if (!session) {
    redirect("/connexion");
  }

  const { user, ecole } = session;

  return (
    <div className="workspace">
      <div className="dateline">
        <div className="shell">
          <span>
            {weekdayAndDate(isoToday())} · {ecole.ville}
          </span>
          <span className="dateline__side dateline__side--right">
            <span className="dateline__dot" aria-hidden="true" />
            {session.annee} · {ecole.sigle || ecole.nom}
          </span>
        </div>
      </div>

      <header className="masthead">
        <div className="shell masthead__row">
          <Wordmark href="/app" sous={ecole.nom} />
          <AppNav />
          <div className="account">
            <div className="account__text">
              <span className="account__name">{user.nom}</span>
              <span className="account__meta">{user.role_label}</span>
            </div>
            <span className="avatar" aria-hidden="true">
              {initiales(user.nom)}
            </span>
            <BoutonSortie />
          </div>
        </div>
      </header>

      <main id="contenu" className="app-main">
        {children}
      </main>

      <footer className="app-footer">
        <div className="shell app-footer__row">
          <span>ÉCOLE CASH · abonnement {ecole.abonnement_label}/mois</span>
          <span>
            {ecole.quartier}, {ecole.ville} · {ecole.telephone_display}
          </span>
          <span>Démo : aucun SMS, aucun débit MoMo</span>
        </div>
      </footer>
    </div>
  );
}
