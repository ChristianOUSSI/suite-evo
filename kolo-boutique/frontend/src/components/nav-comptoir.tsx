"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icone } from "./icone";

const LIENS = [
  { href: "/comptoir", label: "La journée", icone: "comptoir" },
  { href: "/comptoir/dictee", label: "Dicter", icone: "voix" },
  { href: "/comptoir/rayon", label: "Le rayon", icone: "rayon" },
  { href: "/comptoir/sorties", label: "Les ventes", icone: "vente" },
  { href: "/comptoir/tiroir", label: "Le tiroir", icone: "tiroir" },
  { href: "/comptoir/reglages", label: "Le comptoir", icone: "reglage" },
];

export function NavComptoir() {
  const chemin = usePathname();

  return (
    <nav className="nav-comptoir" aria-label="Navigation du comptoir">
      {LIENS.map((lien) => {
        const actif =
          lien.href === "/comptoir"
            ? chemin === "/comptoir"
            : chemin.startsWith(lien.href);
        return (
          <Link
            key={lien.href}
            href={lien.href}
            className={`nav-comptoir__lien${actif ? " est-active" : ""}`}
            aria-current={actif ? "page" : undefined}
          >
            <Icone nom={lien.icone} taille={15} />
            {lien.label}
          </Link>
        );
      })}
    </nav>
  );
}
