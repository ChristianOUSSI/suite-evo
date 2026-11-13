"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { traduire } from "@/lib/langue";

const LIENS = [
  { href: "/accueil", cle: "nav.accueil", marque: "accueil" },
  { href: "/caisse", cle: "nav.caisse", marque: "caisse" },
  { href: "/eleves", cle: "nav.eleves", marque: "eleves" },
  { href: "/classes", cle: "nav.classes", marque: "classes" },
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
            aria-current={chemin === lien.href || chemin.startsWith(`${lien.href}/`) ? "page" : undefined}
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
    case "caisse":
      return (
        <svg {...traits}>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10h18" />
          <circle cx="12" cy="15" r="2" />
        </svg>
      );
    case "eleves":
      return (
        <svg {...traits}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M15.5 14.5c2.8.4 4.5 2.4 4.5 5.5" />
        </svg>
      );
    case "classes":
      return (
        <svg {...traits}>
          <path d="M4 5h16v14H4z" />
          <path d="M4 10h16" />
          <path d="M9 3v4" />
          <path d="M15 3v4" />
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
