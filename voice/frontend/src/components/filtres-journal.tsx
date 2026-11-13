"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { RESULTATS } from "@/lib/format";

interface Props {
  postes: { id: number; label: string }[];
  issue: string;
  poste: string;
  jours: string;
  motif: string;
}

export function FiltresJournal({
  postes,
  issue,
  poste,
  jours,
  motif,
}: Props) {
  const route = useRouter();
  const [etat, setEtat] = useState({ issue, poste, jours, motif });
  const premier = useRef(true);

  useEffect(() => {
    if (premier.current) {
      premier.current = false;
      return;
    }
    const URL = new URLSearchParams();
    if (etat.issue) URL.set("issue", etat.issue);
    if (etat.poste) URL.set("poste", etat.poste);
    if (etat.jours !== "14") URL.set("jours", etat.jours);
    if (etat.motif) URL.set("motif", etat.motif);
    route.push(`/journal${URL.toString() ? `?${URL}` : ""}`, { scroll: false });
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
        Issue
        <select
          value={etat.issue}
          onChange={(e) => setEtat({ ...etat, issue: e.target.value })}
        >
          <option value="">Toutes</option>
          {RESULTATS.map((resultat) => (
            <option key={resultat.code} value={resultat.code}>
              {resultat.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Poste
        <select
          value={etat.poste}
          onChange={(e) => setEtat({ ...etat, poste: e.target.value })}
        >
          <option value="">Tous les postes</option>
          {postes.map((ligne) => (
            <option key={ligne.id} value={String(ligne.id)}>
              {ligne.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Fenêtre
        <select
          value={etat.jours}
          onChange={(e) => setEtat({ ...etat, jours: e.target.value })}
        >
          {["1", "3", "7", "14", "30", "60"].map((nombre) => (
            <option key={nombre} value={nombre}>
              {nombre === "1" ? "hier et aujourd'hui" : `${nombre} jours`}
            </option>
          ))}
        </select>
      </label>

      <label>
        Nom ou numéro
        <input
          value={etat.motif}
          onChange={(e) => setEtat({ ...etat, motif: e.target.value })}
          placeholder="6 77, Njo, …"
        />
      </label>

      <button className="bouton sobre" type="submit">
        Filtrer
      </button>
    </form>
  );
}
