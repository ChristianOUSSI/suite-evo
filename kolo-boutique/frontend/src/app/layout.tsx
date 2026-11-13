import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

const site = process.env.KOLO_SITE_URL ?? "http://localhost:3400";

export const viewport: Viewport = {
  themeColor: "#2a1e18",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: "KOLO BOUTIQUE | le cahier du comptoir",
    template: "%s | KOLO BOUTIQUE",
  },
  description:
    "Le cahier d’une boutique de quartier : dictée par vocal WhatsApp, stock, bénéfice du jour et tiroir compté le soir.",
  authors: [{ name: "CODE AXIS DIGITAL CAMEROON" }],
  keywords: [
    "boutique",
    "stock",
    "bénéfice",
    "Douala",
    "Cameroun",
    "WhatsApp",
    "Mobile Money",
  ],
  openGraph: {
    title: "KOLO BOUTIQUE | le cahier du comptoir",
    description:
      "Le stock et le bénéfice se mettent à jour par un vocal de dix secondes.",
    locale: "fr_CM",
    type: "website",
  },
  icons: { icon: "/icon.svg" },
};

export default function Racine({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <a href="#contenu" className="skip-link">
          Aller au comptoir
        </a>
        {children}
      </body>
    </html>
  );
}
