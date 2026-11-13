"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/app", label: "Journal" },
  { href: "/app/creances", label: "Créances" },
  { href: "/app/relances", label: "Relances" },
  { href: "/app/caisse", label: "Caisse" },
  { href: "/app/import", label: "Import" },
  { href: "/app/reglages", label: "Réglages" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="app-nav" aria-label="Navigation du carnet">
      {LINKS.map((link) => {
        const active =
          link.href === "/app"
            ? pathname === "/app"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`app-nav__link${active ? " is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
