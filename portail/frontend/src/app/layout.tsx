import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "@cadc/kit/theme.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.PORTAIL_URL ?? "http://localhost:5800"),
  title: "suite-evo | la maison des logiciels de comptoir",
  description:
    "Les 22 produits CODE AXIS DIGITAL CAMEROON : chaque métier a son logiciel, chaque logiciel tient sur un téléphone.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RacineLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
