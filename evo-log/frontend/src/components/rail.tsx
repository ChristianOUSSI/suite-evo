"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { traduire } from "@/lib/langue";

const LIENS = [
  { href: "/accueil", cle: "nav.accueil", marque: "accueil" },
  { href: "/colis", cle: "nav.colis", marque: "colis" },
  { href: "/recap", cle: "nav.recap", marque: "recap" },
  { href: "/reglages", cle: "nav.reglages", marque: "reglages" },
];

export function Rail({ langue }: { langue: string }) {
  const chemin = usePathname();
  const t = traduire(langue).t;

  return (
    <nav className="cadc-rail" aria-label={t("nav.rail")}>
      <ul className="cadc-rail__liste">
        {LIENS.map((lien) => (
          <li key={lien.href}>
            <Link
              href={lien.href}
              className="cadc-rail__lien"
              aria-current={chemin === lien.href || chemin.startsWith(`${lien.href}/`) ? "page" : undefined}
            >
              <RailIcone nom={lien.marque} />
              {t(lien.cle)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function RailIcone({ nom }: { nom: string }) {
  const commun = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (nom) {
    case "accueil":
      return (
        <svg {...commun}>
          <path d="M4 11 12 4l8 7" />
          <path d="M6 10v9h12v-9" />
        </svg>
      );
    case "colis":
      return (
        <svg {...commun}>
          <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" />
          <path d="M4 7l8 4 8-4M12 11v10" />
        </svg>
      );
    case "recap":
      return (
        <svg {...commun}>
          <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
        </svg>
      );
    default:
      return (
        <svg {...commun}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.7h4l.4-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.07-.4.1-.8.1-1.2Z" />
        </svg>
      );
  }
}
