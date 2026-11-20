"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { traduire } from "@/lib/langue";

const LIENS = [
  { href: "/accueil", cle: "nav.accueil", marque: "accueil" },
  { href: "/patients", cle: "nav.patients", marque: "patients" },
  { href: "/actes", cle: "nav.actes", marque: "actes" },
  { href: "/rendez-vous", cle: "nav.rendezvous", marque: "patients" },
  { href: "/caisse", cle: "nav.caisse", marque: "caisse" },
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
    case "patients":
      return (
        <svg {...commun}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M16 14.5c2.8.4 5 2.4 5 5.5" />
        </svg>
      );
    case "actes":
      return (
        <svg {...commun}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 8h6M9 12h6M9 16h4" />
        </svg>
      );
    case "caisse":
      return (
        <svg {...commun}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18M7 15h4" />
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
