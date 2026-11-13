"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErreurApi, poster, supprimer } from "@/lib/client-api";
import { JOURS } from "@/lib/format";
import type { Horaire, Ligne } from "@/lib/types";

export function Horaires({ ligne }: { ligne: Ligne }) {
  const route = useRouter();
  const [jour, setJour] = useState("0");
  const [ouvre, setOuvre] = useState("08:00");
  const [ferme, setFerme] = useState("16:00");
  const [panne, setPanne] = useState("");
  const [enCours, setEnCours] = useState(false);

  const creneaux = [...(ligne.schedules ?? [])].sort(
    (a, b) => a.weekday - b.weekday || a.opens.localeCompare(b.opens)
  );

  const parJour = JOURS.map((nom, index) => ({
    nom,
    creneaux: creneaux.filter((creneau) => creneau.weekday === index),
  }));

  async function ajouter() {
    setEnCours(true);
    setPanne("");
    try {
      await poster<Horaire>(`/lines/${ligne.id}/schedules`, {
        weekday: Number(jour),
        opens: ouvre,
        closes: ferme,
      });
      route.refresh();
    } catch (erreur) {
      setPanne(texte(erreur));
    } finally {
      setEnCours(false);
    }
  }

  async function retirer(id: number) {
    setEnCours(true);
    setPanne("");
    try {
      await supprimer(`/schedules/${id}`);
      route.refresh();
    } catch (erreur) {
      setPanne(texte(erreur));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <section className="panneau">
      <h2>Les heures de « {ligne.label} »</h2>

      {creneaux.length === 0 && (
        <p className="vide">
          Aucun horaire : le poste sonnera toujours fermé et la voix donnera la
          messagerie.
        </p>
      )}

      <div className="jours">
        {parJour.map((journee) => (
          <div key={journee.nom} className={journee.creneaux.length ? "jour tenu" : "jour vide"}>
            <span className="nom">{journee.nom}</span>
            <span className="fenetres-jour">
              {journee.creneaux.length
                ? journee.creneaux.map((creneau) => (
                    <button
                      type="button"
                      className="fenetre"
                      key={creneau.id}
                      disabled={enCours}
                      onClick={() => retirer(creneau.id)}
                      title="Retirer cette fenêtre"
                    >
                      {creneau.opens} {creneau.closes}
                    </button>
                  ))
                : "repos"}
            </span>
          </div>
        ))}
      </div>

      <p className="sous">Une fenêtre de plus</p>
      <div className="trois-champs">
        <label className="champ-ligne">
          <span>Jour</span>
          <select value={jour} onChange={(e) => setJour(e.target.value)}>
            {JOURS.map((nom, index) => (
              <option key={nom} value={String(index)}>
                {nom}
              </option>
            ))}
          </select>
        </label>
        <label className="champ-ligne">
          <span>Ouvre à</span>
          <input type="time" value={ouvre} onChange={(e) => setOuvre(e.target.value)} />
        </label>
        <label className="champ-ligne">
          <span>Ferme à</span>
          <input type="time" value={ferme} onChange={(e) => setFerme(e.target.value)} />
        </label>
      </div>

      {ferme <= ouvre && (
        <p className="attention">
          La fermeture doit suivre l'ouverture, sinon la voix ne saura rien dire.
        </p>
      )}
      {panne && <p className="message-erreur">{panne}</p>}

      <div className="ligne-action">
        <button
          className="bouton"
          type="button"
          onClick={ajouter}
          disabled={enCours || ferme <= ouvre}
        >
          Poser cette fenêtre
        </button>
      </div>

      <p className="note-bas">
        Deux fenêtres le même jour se cumulent : le midi reste joignable quand
        l'après-midi ouvre à part. Une fenêtre se retire en cliquant dessus.
      </p>
    </section>
  );
}

function texte(erreur: unknown): string {
  return erreur instanceof ErreurApi
    ? erreur.message
    : "Les horaires n'ont pas répondu. Vérifiez que l'API tourne.";
}
