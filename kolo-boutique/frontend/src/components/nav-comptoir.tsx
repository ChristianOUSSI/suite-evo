"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { t, type Langue } from "@/lib/langue";

import { Icone } from "./icone";

const LIENS = [
  { href: "/comptoir", cle: "jour.titre", icone: "comptoir" },
  { href: "/comptoir/dictee", cle: "jour.dicter", icone: "voix" },
  { href: "/comptoir/rayon", cle: "rayon.titre", icone: "rayon" },
  { href: "/comptoir/sorties", cle: "sorties.meta", icone: "vente" },
  { href: "/comptoir/tiroir", cle: "tiroir.meta", icone: "tiroir" },
  { href: "/comptoir/reglages", cle: "reglages.nav-comptoir", icone: "reglage" },
];

export function NavComptoir({ langue = "fr" }: { langue?: Langue }) {
  const chemin = usePathname();

  return (
    <nav className="nav-comptoir" aria-label={t("nav.aria", langue)}>
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
            {t(lien.cle, langue)}
          </Link>
        );
      })}
    </nav>
  );
}
