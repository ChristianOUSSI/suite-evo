import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppNav } from "@/components/app-nav";
import { Wordmark } from "@/components/brand";
import { LogoutButton } from "@/components/logout-button";
import { WorkspaceOffline } from "@/components/workspace-offline";
import { ApiError } from "@/lib/errors";
import { initials, isoToday, weekdayAndDate } from "@/lib/format";
import { getSession } from "@/lib/session";
import type { Session } from "@/lib/types";

import "../../styles/app.css";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Le garde se lit ici, donc il rend lui-même l'écran d'incident.
  let session: Session | null;
  try {
    session = await getSession();
  } catch (error) {
    return (
      <WorkspaceOffline message={error instanceof ApiError ? error.message : undefined} />
    );
  }

  if (!session) {
    redirect("/connexion");
  }

  const merchant = session.merchant;

  return (
    <div className="workspace">
      <div className="dateline">
        <div className="shell">
          <span>{weekdayAndDate(isoToday())} · Douala</span>
          <span className="dateline__side dateline__side--right">
            <span className="dateline__dot" aria-hidden="true" />
            {session.demo ? "Mode démonstration" : "Carnet actif"} ·{" "}
            {merchant.name}
          </span>
        </div>
      </div>

      <header className="masthead app-masthead">
        <div className="shell masthead__row">
          <Wordmark href="/app" />
          <AppNav />
          <div className="account">
            <div className="account__text">
              <span className="account__name">{merchant.owner_name}</span>
              <span className="account__meta">
                {merchant.quartier} · {merchant.plan}
              </span>
            </div>
            <span className="avatar" aria-hidden="true">
              {initials(merchant.owner_name)}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main id="contenu" className="app-main">
        {children}
      </main>

      <footer className="app-footer">
        <div className="shell app-footer__row">
          <span>PALABRE · carnet de démonstration</span>
          <span>
            {merchant.name} · {merchant.quartier}, Douala
          </span>
          <span>Relances et paiements simulés</span>
        </div>
      </footer>
    </div>
  );
}
