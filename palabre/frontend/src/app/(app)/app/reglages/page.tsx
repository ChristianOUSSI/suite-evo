import type { Metadata } from "next";
import Link from "next/link";

import { SettingsForm } from "@/components/settings-form";
import { apiGet } from "@/lib/api";
import type { SettingsPayload } from "@/lib/types";

import "../../../../styles/reglages.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Réglages",
};

export default async function ReglagesPage() {
  const settings = await apiGet<SettingsPayload>("/settings");

  return (
    <div className="shell reglages">
      <header className="page-head reglages__head">
        <div className="page-head__main">
          <span className="kicker">Feuille 06 · Les réglages</span>
          <h1>Le carnet à votre main.</h1>
          <p className="page-head__lede">
            Le nom sur les messages, le ton des relances, les canaux ouverts et
            l’objectif du mois. Ce qui change ici se répercute sur les dossiers
            en cours, sans réécrire le passé.
          </p>
        </div>
        <div className="page-head__aside">
          <Link href="/app" className="btn">
            Retour au journal
          </Link>
        </div>
      </header>

      <SettingsForm
        merchant={settings.merchant}
        pricing={settings.pricing}
        demoMode={settings.demo_mode}
      />
    </div>
  );
}
