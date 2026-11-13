"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Props {
  aires: string[];
  domaine: string;
  motif: string;
}

export function FiltresRepertoire({ aires, domaine, motif }: Props) {
  const route = useRouter();
  const [etat, setEtat] = useState({ domaine, motif });
  const premier = useRef(true);

  useEffect(() => {
    if (premier.current) {
      premier.current = false;
      return;
    }
    const URL = new URLSearchParams();
    if (etat.domaine) URL.set("domaine", etat.domaine);
    if (etat.motif) URL.set("motif", etat.motif);
    route.push(`/repertoire${URL.toString() ? `?${URL}` : ""}`, {
      scroll: false,
    });
  }, [etat, route]);

  return (
    <form
      className="filtres"
      onSubmit={(e) => {
        e.preventDefault();
        setEtat((actuel) => ({ ...actuel }));
      }}
    >
      <label>
        Domaine
        <select
          value={etat.domaine}
          onChange={(e) => setEtat({ ...etat, domaine: e.target.value })}
        >
          <option value="">Tous les domaines</option>
          {aires.map((aire) => (
            <option key={aire} value={aire}>
              {aire}
            </option>
          ))}
        </select>
      </label>

      <label>
        Mot cherché
        <input
          value={etat.motif}
          onChange={(e) => setEtat({ ...etat, motif: e.target.value })}
          placeholder="frais, report, salle…"
        />
      </label>

      <button className="bouton sobre" type="submit">
        Chercher dans le fonds
      </button>
    </form>
  );
}
