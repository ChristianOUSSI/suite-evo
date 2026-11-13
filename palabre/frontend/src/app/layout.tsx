import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.PALABRE_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "PALABRE | Le carnet des comptes",
    template: "%s | PALABRE",
  },
  description:
    "Relances, promesses et encaissements pour les commerçants de Douala. Un seul carnet pour savoir qui doit quoi, et depuis quand.",
  applicationName: "PALABRE",
  authors: [{ name: "Atelier CADC" }],
  keywords: [
    "recouvrement",
    "créances",
    "Douala",
    "Cameroun",
    "Mobile Money",
    "relances",
  ],
  openGraph: {
    title: "PALABRE | Le carnet des comptes",
    description:
      "Les créances de votre commerce, tenues comme un carnet. Relances justes, paiements MoMo, caisse claire.",
    locale: "fr_CM",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#142a44",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <a className="skip-link" href="#contenu">
          Aller au contenu
        </a>
        {children}
      </body>
    </html>
  );
}
