"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { traduire } from "@/lib/langue";

const LIENS = [
  { href: "/carnet", cle: "nav.carnet", marque: "aujourd_hui" },
  { href: "/clients", cle: "nav.clients", marque: "clients" },
  { href: "/relances", cle: "nav.relances", marque: "relances" },
  { href: "/silence", cle: "nav.silence", marque: "silence" },
  { href: "/reglages", cle: "nav.reglages", marque: "reglages" },
];

export function Rail({ langue }: { langue: string }) {
  const chemin = usePathname();
  const t = traduire(langue).t;

  return (
    <nav className="cadc-rail" aria-label={t("nav.carnet")}>
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
    case "aujourd_hui":
      return (
        <svg {...traits}>
          <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
          <path d="M3.5 10h17" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
          <path d="M9 15h2" />
        </svg>
      );
    case "clients":
      return (
        <svg {...traits}>
          <circle cx="9" cy="9" r="3.2" />
          <path d="M3.5 20c0-3 2.5-5.4 5.5-5.4s5.5 2.4 5.5 5.4" />
          <path d="M17 6.5v6" />
          <path d="M14 9.5h6" />
        </svg>
      );
    case "relances":
      return (
        <svg {...traits}>
          <circle cx="12" cy="12" r="7.5" />
          <path d="M12 8v4.5l3 2" />
        </svg>
      );
    case "silence":
      return (
        <svg {...traits}>
          <path d="M4 9h3l5-4v18l-5-4H4Z" />
          <path d="M16.5 9.5 21 14" />
          <path d="M21 9.5 16.5 14" />
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
