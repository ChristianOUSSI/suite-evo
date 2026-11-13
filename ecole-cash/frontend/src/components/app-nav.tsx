"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icone } from "./icone";

const LIENS = [
  { href: "/app", label: "Tableau", icone: "caisse" },
  { href: "/app/guichet", label: "Guichet", icone: "monnaie" },
  { href: "/app/eleves", label: "Élèves", icone: "eleve" },
  { href: "/app/classes", label: "Classes", icone: "classe" },
  { href: "/app/relances", label: "Relances", icone: "relance" },
  { href: "/app/recus", label: "Reçus", icone: "recu" },
  { href: "/app/journal", label: "Journal", icone: "journal" },
  { href: "/app/reglages", label: "Réglages", icone: "reglage" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="app-nav" aria-label="Navigation de la caisse">
      {LIENS.map((lien) => {
        const actif =
          lien.href === "/app"
            ? pathname === "/app"
            : pathname.startsWith(lien.href);
        return (
          <Link
            key={lien.href}
            href={lien.href}
            className={`app-nav__link${actif ? " is-active" : ""}`}
            aria-current={actif ? "page" : undefined}
          >
            <Icone nom={lien.icone} taille={16} />
            {lien.label}
          </Link>
        );
      })}
    </nav>
  );
}
