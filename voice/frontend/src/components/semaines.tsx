import type { Barre } from "@/lib/types";

const HAUTEUR = 96;

export function Semaines({ barres }: { barres: Barre[] }) {
  const sommet = Math.max(...barres.map((b) => b.total), 1);
  return (
    <div className="semaine" role="img" aria-label="Appels par jour sur sept jours">
      {barres.map((barre) => (
        <div className="barre" key={barre.day}>
          <span className="chiffre">{barre.total || ""}</span>
          <div
            className="total"
            style={{ height: `${Math.round((barre.total / sommet) * HAUTEUR)}px` }}
            title={`${barre.total} appels`}
          />
          <div
            className="voix"
            style={{ height: `${Math.round((barre.voice / sommet) * HAUTEUR)}px` }}
            title={`${barre.voice} tenus par la voix`}
          />
          <span>{barre.label}</span>
        </div>
      ))}
    </div>
  );
}
