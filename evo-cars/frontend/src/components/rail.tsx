"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { traduire } from "@/lib/langue";

const LIENS = [
  { href: "/accueil", cle: "nav.accueil", marque: "accueil" },
  { href: "/voitures", cle: "nav.voitures", marque: "voitures" },
  { href: "/pieces", cle: "nav.pieces", marque: "pieces" },
  { href: "/clients", cle: "nav.clients", marque: "clients" },
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
    case "voitures":
      return (
        <svg {...commun}>
          <path d="M4 15l1.5-5A2 2 0 0 1 7.4 8.5h9.2a2 2 0 0 1 1.9 1.5L20 15" />
          <path d="M4 15h16v4h-2.5M4 15h2.5M7 19h10" />
          <circle cx="8" cy="19" r="1.6" />
          <circle cx="16" cy="19" r="1.6" />
        </svg>
      );
    case "pieces":
      return (
        <svg {...commun}>
          <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
          <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" />
        </svg>
      );
    case "clients":
      return (
        <svg {...commun}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
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
