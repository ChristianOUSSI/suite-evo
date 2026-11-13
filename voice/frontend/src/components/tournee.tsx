"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErreurApi, poster } from "@/lib/client-api";
import { heure } from "@/lib/format";

interface Resultat {
  reminders: number;
  released: number;
  at: string;
  auto: boolean;
}

export function Tournee({ auto }: { auto: boolean }) {
  const route = useRouter();
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [panne, setPanne] = useState("");
  const [enCours, setEnCours] = useState(false);

  async function passer() {
    setEnCours(true);
    setPanne("");
    try {
      setResultat(await poster<Resultat>("/dispatches/relances", {}));
      route.refresh();
    } catch (erreur) {
      setPanne(
        erreur instanceof ErreurApi
          ? erreur.message
          : "La tournée n'a pas pu être lancée."
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <section className="panneau tournee">
      <h2>La tournée du soir</h2>
      <p className="chapeau">
        Le soir, on regarde qui doit passer le lendemain. Chaque place confirmée
        reçoit un rappel court, et les envois programmés dont l'heure est passée
        partent dans le même passage.
      </p>

      <p className={auto ? "reglage auto" : "reglage manuel"}>
        {auto
          ? "Passage automatique ouvert : le tableau du matin le fait déjà sans qu'on appuie."
          : "Passage automatique fermé : sans un appui ici, les rappels ne partent pas."}
      </p>

      {panne && <p className="message-erreur">{panne}</p>}
      {resultat && (
        <p className="message-erreur ok">
          Rappels posés : {resultat.reminders}. Envois programmés relâchés :{" "}
          {resultat.released}. Passage fait à {heure(resultat.at)}.
        </p>
      )}

      <div className="ligne-action">
        <button
          className="bouton mousse"
          type="button"
          onClick={passer}
          disabled={enCours}
        >
          Passer la tournée maintenant
        </button>
      </div>
    </section>
  );
}
