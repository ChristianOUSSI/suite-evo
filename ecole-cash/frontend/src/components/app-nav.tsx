"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { t, type Langue } from "@/lib/langue";

import { Icone } from "./icone";

const LIENS = [
  { href: "/app", cle: "nav.tableau", icone: "caisse" },
  { href: "/app/guichet", cle: "nav.guichet", icone: "monnaie" },
  { href: "/app/eleves", cle: "nav.eleves", icone: "eleve" },
  { href: "/app/classes", cle: "nav.classes", icone: "classe" },
  { href: "/app/relances", cle: "nav.relances", icone: "relance" },
  { href: "/app/recus", cle: "nav.recus", icone: "recu" },
  { href: "/app/journal", cle: "nav.journal", icone: "journal" },
  { href: "/app/reglages", cle: "nav.reglages", icone: "reglage" },
];

export function AppNav({ langue = "fr" }: { langue?: Langue }) {
  const pathname = usePathname();

  return (
    <nav className="app-nav" aria-label={t("nav.aria", langue)}>
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
            {t(lien.cle, langue)}
          </Link>
        );
      })}
    </nav>
  );
}
