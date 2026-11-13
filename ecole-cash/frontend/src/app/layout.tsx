import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.CASH_SITE_URL ?? "http://localhost:3200",
  ),
  title: {
    default: "ÉCOLE CASH | La caisse de l'école",
    template: "%s | ÉCOLE CASH",
  },
  description:
    "Scolarité, cantine et transport d'une école privée à Douala : l'encaissement au guichet, le reçu sur WhatsApp, la caisse tenue chaque soir.",
  applicationName: "ÉCOLE CASH",
  authors: [{ name: "Atelier CADC" }],
  keywords: [
    "scolarité",
    "école privée",
    "Douala",
    "Cameroun",
    "reçu WhatsApp",
    "Mobile Money",
    "caisse",
  ],
  openGraph: {
    title: "ÉCOLE CASH | La caisse de l'école",
    description:
      "Le reçu part sur WhatsApp dès le paiement. La directrice voit la caisse en direct.",
    locale: "fr_CM",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#12312a",
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
