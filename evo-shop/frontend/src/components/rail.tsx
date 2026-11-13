"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { traduire } from "@/lib/langue";

const LIENS = [
  { href: "/accueil", cle: "nav.accueil", marque: "accueil" },
  { href: "/ventes", cle: "nav.ventes", marque: "ventes" },
  { href: "/produits", cle: "nav.produits", marque: "produits" },
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
            aria-current={chemin === lien.href ? "page" : chemin.startsWith(`${lien.href}/`) ? "page" : undefined}
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
          <path d="M4 7h16v13H4z" />
          <path d="M4 7l2-3h12l2 3" />
          <path d="M9 11h6" />
        </svg>
      );
    case "ventes":
      return (
        <svg {...traits}>
          <path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21z" />
          <path d="M9 8h6" />
          <path d="M9 12h6" />
        </svg>
      );
    case "produits":
      return (
        <svg {...traits}>
          <path d="M4 8l8-4 8 4v8l-8 4-8-4z" />
          <path d="M4 8l8 4 8-4" />
          <path d="M12 12v8" />
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
