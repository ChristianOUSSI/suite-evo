import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { EcranIncident } from "@/components/ecran-incident";
import { NavComptoir } from "@/components/nav-comptoir";
import { BoutonSortie } from "@/components/bouton-sortie";
import { CommutateurLangue } from "@/components/commutateur-langue";
import { NomComptoir } from "@/components/marque";
import { ErreurComptoir } from "@/lib/errors";
import { initiales, jourLong, aujourdhui } from "@/lib/format";
import { t, type Langue } from "@/lib/langue";
import { langueServeur } from "@/lib/langue-serveur";
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
  const langue = await langueServeur();

  return (
    <div className="comptoir-chantier">
      <div className="dateau">
        <div className="gabarit dateau__rangee">
          <span>{jourLong(aujourdhui())}</span>
          <span>
            <span className="dateau__pastille" aria-hidden="true" />
            {boutique.quartier || boutique.ville} ·{" "}
            {boutique.credit_accorde ? t("dateau.ouvert", langue) : t("dateau.comptant", langue)}
          </span>
        </div>
      </div>

      <header className="fronton">
        <div className="gabarit fronton__rangee">
          <NomComptoir href="/comptoir" sous={boutique.enseigne || boutique.nom} />
          <NavComptoir />
          <CommutateurLangue langue={langue} />
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
            KOLO BOUTIQUE · {boutique.abonnement_hebdo_label} {t("pied.abonnement", langue)}
          </span>
          <span>
            {boutique.nom} · {boutique.telephone_display || t("pied.numero", langue)}
          </span>
          <span>{t("pied.demo", langue)}</span>
        </div>
      </footer>
    </div>
  );
}
