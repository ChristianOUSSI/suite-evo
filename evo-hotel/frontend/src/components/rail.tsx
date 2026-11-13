"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { traduire } from "@/lib/langue";

const LIENS = [
  { href: "/accueil", cle: "nav.accueil", marque: "accueil" },
  { href: "/sejours", cle: "nav.sejours", marque: "sejours" },
  { href: "/chambres", cle: "nav.chambres", marque: "chambres" },
  { href: "/clients", cle: "nav.clients", marque: "clients" },
  { href: "/recap", cle: "nav.recap", marque: "recap" },
  { href: "/reglages", cle: "nav.reglages", marque: "reglages" },
];

export function Rail({ langue }: { langue: string }) {
  const chemin = usePathname();
  const t = traduire(langue).t;

  return (
    <nav className="cadc-rail" aria-label={t("nav.accueil")}>
      <div className="cadc-rail__interieur cadc-gabarit">
        {LIENS.map((lien) => (
          <Link
            key={lien.href}
            href={lien.href}
            className="cadc-rail__lien"
            aria-current={
              lien.href === "/accueil" ? chemin === "/accueil" : chemin.startsWith(lien.href)
                ? "page"
                : undefined
            }
          >
            <Signe nom={lien.marque} />
            {t(lien.cle)}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function Signe({ nom }: { nom: string }) {
  const traits = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "square" as const,
    "aria-hidden": true,
  };

  switch (nom) {
    case "accueil":
      return (
        <svg {...traits}>
          <path d="M4 11l8-7 8 7" />
          <path d="M6 9.5V20h12V9.5" />
          <path d="M10 20v-5h4v5" />
        </svg>
      );
    case "sejours":
      return (
        <svg {...traits}>
          <rect x="3.5" y="5" width="17" height="16" rx="2" />
          <path d="M3.5 10h17" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
          <path d="M7 14.5h4" />
          <path d="M13 14.5h4" />
        </svg>
      );
    case "chambres":
      return (
        <svg {...traits}>
          <path d="M4 20V6a2 2 0 012-2h8a2 2 0 012 2v14" />
          <path d="M4 20h16" />
          <path d="M14 8h4v12h-4" />
          <circle cx="10" cy="12" r="1" fill="currentColor" />
        </svg>
      );
    case "clients":
      return (
        <svg {...traits}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
        </svg>
      );
    case "recap":
      return (
        <svg {...traits}>
          <path d="M4 20V10" />
          <path d="M10 20V4" />
          <path d="M16 20v-7" />
          <path d="M22 20H2" />
        </svg>
      );
    default:
      return (
        <svg {...traits}>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h10" />
        </svg>
      );
  }
}
