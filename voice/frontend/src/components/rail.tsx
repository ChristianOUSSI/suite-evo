"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

export interface Groupe {
  titre: string;
  items: { href: string; label: string }[];
}

export function Rail({
  groupes,
  etablissement,
  agent,
  ville,
}: {
  groupes: Groupe[];
  etablissement: string;
  agent: string;
  ville: string;
}) {
  const chemin = usePathname();
  const route = useRouter();

  async function sortir() {
    await fetch("/api/auth/logout", { method: "POST" });
    route.push("/connexion");
    route.refresh();
  }

  return (
    <aside className="rail">
      <div>
        <div className="marque">
          <b>CADC VOICE</b>
        </div>
        <div className="etablissement">{etablissement}</div>
        <div className="detail">{ville}</div>
      </div>

      {groupes.map((groupe) => (
        <nav className="groupe" key={groupe.titre}>
          <h2>{groupe.titre}</h2>
          {groupe.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={chemin === item.href ? "actif" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ))}

      <div className="solde">
        <span>{agent}</span>
        <button type="button" onClick={sortir}>
          Fermer la séance
        </button>
      </div>
    </aside>
  );
}
