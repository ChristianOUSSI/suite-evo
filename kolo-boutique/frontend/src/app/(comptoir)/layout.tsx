import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { EcranIncident } from "@/components/ecran-incident";
import { NavComptoir } from "@/components/nav-comptoir";
import { BoutonSortie } from "@/components/bouton-sortie";
import { NomComptoir } from "@/components/marque";
import { ErreurComptoir } from "@/lib/errors";
import { initiales, jourLong, aujourdhui } from "@/lib/format";
import { seance } from "@/lib/session";
import type { Seance } from "@/lib/types";

import "../../styles/app.css";

export const dynamic = "force-dynamic";

export default async function ChantierLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Le garde se lit ici, donc il rend lui-même l’écran d’incident.
  let courante: Seance | null;
  try {
    courante = await seance();
  } catch (erreur) {
    return (
      <EcranIncident
        message={erreur instanceof ErreurComptoir ? erreur.message : undefined}
      />
    );
  }

  if (!courante) {
    redirect("/connexion");
  }

  const { user, boutique } = courante;

  return (
    <div className="comptoir-chantier">
      <div className="dateau">
        <div className="gabarit dateau__rangee">
          <span>{jourLong(aujourdhui())}</span>
          <span>
            <span className="dateau__pastille" aria-hidden="true" />
            {boutique.quartier || boutique.ville} ·{" "}
            {boutique.credit_accorde ? "crédit ouvert" : "comptant seul"}
          </span>
        </div>
      </div>

      <header className="fronton">
        <div className="gabarit fronton__rangee">
          <NomComptoir href="/comptoir" sous={boutique.enseigne || boutique.nom} />
          <NavComptoir />
          <div className="compte">
            <div className="compte__texte">
              <span className="compte__nom">{user.nom}</span>
              <span className="compte__meta">{user.role_label}</span>
            </div>
            <span className="avatar" aria-hidden="true">
              {initiales(user.nom)}
            </span>
            <BoutonSortie />
          </div>
        </div>
      </header>

      <main id="contenu" className="chantier">
        {children}
      </main>

      <footer className="pied-comptoir">
        <div className="gabarit pied-comptoir__rangee">
          <span>
            KOLO BOUTIQUE · abonnement {boutique.abonnement_hebdo_label} par
            semaine
          </span>
          <span>
            {boutique.nom} · {boutique.telephone_display || "numéro non noté"}
          </span>
          <span>Démo : aucun vocal reçu, aucun débit MoMo</span>
        </div>
      </footer>
    </div>
  );
}
