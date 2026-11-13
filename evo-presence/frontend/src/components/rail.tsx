"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { traduire } from "@/lib/langue";

const LIENS = [
  { href: "/pointage", cle: "nav.pointage", marque: "pointage" },
  { href: "/employes", cle: "nav.employes", marque: "employes" },
  { href: "/journal", cle: "nav.journal", marque: "journal" },
  { href: "/recap", cle: "nav.recap", marque: "recap" },
  { href: "/reglages", cle: "nav.reglages", marque: "reglages" },
];

export function Rail({ langue }: { langue: string }) {
  const chemin = usePathname();
  const t = traduire(langue).t;

  return (
    <nav className="cadc-rail" aria-label={t("nav.pointage")}>
      <div className="cadc-rail__interieur cadc-gabarit">
        {LIENS.map((lien) => (
          <Link
            key={lien.href}
            href={lien.href}
            className="cadc-rail__lien"
            aria-current={chemin.startsWith(lien.href) ? "page" : undefined}
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
    case "pointage":
      return (
        <svg {...traits}>
          <rect x="4" y="3.5" width="16" height="17" rx="2.5" />
          <path d="M4 9h16" />
          <path d="M9 3.5V1.5" />
          <path d="M15 3.5V1.5" />
          <path d="M8.5 14l2.5 2.5 4.5-5" />
        </svg>
      );
    case "employes":
      return (
        <svg {...traits}>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3.5 19c0-3 2.5-5.4 5.5-5.4s5.5 2.4 5.5 5.4" />
          <path d="M16 8.5h5" />
          <path d="M18.5 6v5" />
        </svg>
      );
    case "journal":
      return (
        <svg {...traits}>
          <path d="M5 4h11l3 3v13H5Z" />
          <path d="M8 10h8" />
          <path d="M8 14h8" />
          <path d="M8 18h5" />
        </svg>
      );
    case "recap":
      return (
        <svg {...traits}>
          <path d="M4 7h16v11H4Z" />
          <path d="M4 11h16" />
          <path d="M8 15h4" />
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
