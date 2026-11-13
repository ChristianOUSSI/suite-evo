"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { traduire } from "@/lib/langue";

type Lien = {
  href: string;
  cle: string;
  marque: string;
};

const LIENS: Lien[] = [
  { href: "/cercle", cle: "nav.cercle", marque: "cercle" },
  { href: "/tours", cle: "nav.tours", marque: "tours" },
  { href: "/membres", cle: "nav.membres", marque: "membres" },
  { href: "/verif", cle: "nav.verifier", marque: "verif" },
  { href: "/reglages", cle: "nav.reglages", marque: "reglages" },
];

export function Rail({ langue }: { langue: string }) {
  const chemin = usePathname();
  const t = traduire(langue).t;

  return (
    <nav className="cadc-rail" aria-label={t("nav.cercle")}>
      <div className="cadc-rail__interieur cadc-gabarit">
        {LIENS.map((lien) => {
          const actif =
            lien.href === "/cercle"
              ? chemin === "/cercle" || chemin.startsWith("/cercle")
              : chemin.startsWith(lien.href);
          return (
            <Link
              key={lien.href}
              href={lien.href}
              className="cadc-rail__lien"
              aria-current={actif ? "page" : undefined}
            >
              <MarqueSigne nom={lien.marque} />
              {t(lien.cle)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function MarqueSigne({ nom }: { nom: string }) {
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
    case "cercle":
      return (
        <svg {...traits}>
          <circle cx="12" cy="12" r="7" />
          <path d="M12 5v14" />
        </svg>
      );
    case "tours":
      return (
        <svg {...traits}>
          <ellipse cx="12" cy="7" rx="6" ry="2.4" />
          <path d="M6 7v5c0 1.3 2.7 2.4 6 2.4s6-1.1 6-2.4V7" />
          <path d="M6 12v5c0 1.3 2.7 2.4 6 2.4s6-1.1 6-2.4v-5" />
        </svg>
      );
    case "membres":
      return (
        <svg {...traits}>
          <circle cx="9" cy="8" r="3" />
          <path d="M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5" />
          <path d="M16 9h4" />
          <path d="M18 7v4" />
        </svg>
      );
    case "verif":
      return (
        <svg {...traits}>
          <path d="M4 12l4 4 8-9" />
          <circle cx="12" cy="12" r="9.5" />
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
