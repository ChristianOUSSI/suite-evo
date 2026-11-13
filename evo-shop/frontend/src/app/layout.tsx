import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "@cadc/kit/theme.css";
import "./globals.css";

import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";

const site = process.env.EVO_PRESENCE_SITE_URL ?? "http://localhost:3700";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  const t = traduire(langue).t;
  return {
    metadataBase: new URL(site),
    title: {
      default: t("meta.titre"),
      template: "%s | evo-shop",
    },
    description: t("meta.description"),
    authors: [{ name: "CODE AXIS DIGITAL CAMEROON" }],
    openGraph: {
      locale: langue === "en" ? "en_GB" : "fr_CM",
      title: "evo-shop",
      description: t("entree.titre"),
      type: "website",
    },
    icons: { icon: "/icon.svg" },
  };
}

export const viewport: Viewport = {
  themeColor: "#0e1d2b",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default async function Racine({ children }: { children: ReactNode }) {
  const langue = await langueCourante();
  const t = traduire(langue).t;

  return (
    <html lang={langue} data-texte="normal">
      <head>
        {/* La taille du texte se relit avant la première peinture : un chef de
            boutique qui agrandit la police ne doit pas la perdre en changeant
            d'écran. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var v=localStorage.getItem('cadc_texte');if(v==='grand'||v==='tres-grand'||v==='normal'){document.documentElement.setAttribute('data-texte',v)}}catch(e){}",
          }}
        />
      </head>
      <body>
        <a href="#contenu" className="cadc-eviter">
          {t("aller.contenu")}
        </a>
        {children}
      </body>
    </html>
  );
}
