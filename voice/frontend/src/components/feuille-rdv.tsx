"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErreurApi, patcher, poster } from "@/lib/client-api";
import type { RendezVous } from "@/lib/types";

const ORIGINES: Record<string, string> = {
  voix: "dit à la voix",
  console: "posé ici",
  comptoir: "au comptoir",
};

const PASTILLES: Record<string, string> = {
  confirme: "pastille mousse",
  venu: "pastille",
  manque: "pastille rouille",
  annule: "pastille rouille",
};

export function FeuilleRendezVous({
  rendezVous,
  annules,
}: {
  rendezVous: RendezVous[];
  annules: number;
}) {
  const route = useRouter();
  const [travaille, setTravaille] = useState(0);
  const [panne, setPanne] = useState("");
  const [dit, setDit] = useState("");

  async function changer(id: number, status: string) {
    setTravaille(id);
    setPanne("");
    setDit("");
    try {
      await patcher<RendezVous>(`/appointments/${id}`, { status });
      setDit(`Rendez-vous marqué « ${status} ».`);
      route.refresh();
    } catch (erreur) {
      setPanne(texte(erreur));
    } finally {
      setTravaille(0);
    }
  }

  async function rappeler(id: number) {
    setTravaille(id);
    setPanne("");
    setDit("");
    try {
      const rappel = await poster<{ dispatch: { reference: string } }>(
        `/appointments/${id}/rappel`,
        {}
      );
      setDit(`Rappel parti sous la référence ${rappel.dispatch.reference}.`);
      route.refresh();
    } catch (erreur) {
      setPanne(texte(erreur));
    } finally {
      setTravaille(0);
    }
  }

  return (
    <section className="panneau">
      <h2>Qui doit passer</h2>
      <table className="tableau">
        <thead>
          <tr>
            <th scope="col">Place</th>
            <th scope="col">Appelant</th>
            <th scope="col">Guichet</th>
            <th scope="col">Note</th>
            <th scope="col">Venu de</th>
            <th scope="col">État</th>
            <th scope="col" className="droite">
              Tenir
            </th>
          </tr>
        </thead>
        <tbody>
          {rendezVous.map((place) => (
            <tr key={place.id}>
              <td className="mono">
                {place.day}
                <div className="detail">{place.clock}</div>
              </td>
              <td>
                {place.caller_name || "sans nom"}
                <div className="detail">
                  {place.caller_phone_display}
                </div>
              </td>
              <td>
                {place.service_name}
                <div className="detail">
                  {place.room || "bureau non dit"}
                </div>
              </td>
              <td className="tete-note">{place.note || "rien"}</td>
              <td className="detail">{ORIGINES[place.origin] ?? place.origin}</td>
              <td>
                <span className={PASTILLES[place.status] ?? "pastille"}>
                  {place.status_label}
                </span>
                {place.reminded && (
                  <div className="detail">{place.reference} rappelé</div>
                )}
                {!place.reminded && (
                  <div className="detail">{place.reference}</div>
                )}
              </td>
              <td className="droite">
                <span className="tenir">
                  {place.status === "confirme" && (
                    <button
                      className="bouton petit"
                      type="button"
                      disabled={travaille === place.id}
                      onClick={() => rappeler(place.id)}
                    >
                      Rappeler
                    </button>
                  )}
                  <button
                    className="bouton sobre petit"
                    type="button"
                    disabled={travaille === place.id}
                    onClick={() => changer(place.id, "venu")}
                  >
                    Venu
                  </button>
                  {place.status === "confirme" ? (
                    <button
                      className="bouton sobre petit"
                      type="button"
                      disabled={travaille === place.id}
                      onClick={() => changer(place.id, "manque")}
                    >
                      Manqué
                    </button>
                  ) : (
                    <button
                      className="bouton sobre petit"
                      type="button"
                      disabled={travaille === place.id}
                      onClick={() => changer(place.id, "confirme")}
                    >
                      Reprendre
                    </button>
                  )}
                  {place.status !== "annule" && (
                    <button
                      className="bouton sobre petit"
                      type="button"
                      disabled={travaille === place.id}
                      onClick={() => changer(place.id, "annule")}
                    >
                      Annuler
                    </button>
                  )}
                </span>
              </td>
            </tr>
          ))}
          {rendezVous.length === 0 && (
            <tr>
              <td colSpan={7}>
                <p className="vide">
                  Rien sur cette fenêtre. Prenez une place plus haut, ou
                  changez de fenêtre.
                </p>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {panne && <p className="message-erreur">{panne}</p>}
      {dit && <p className="message-erreur ok">{dit}</p>}

      <p className="pager">
        {rendezVous.length} lignes affichées, {annules} annulées dans le lot. La
        liste s'arrête à quatre-vingts places.
      </p>
    </section>
  );
}

function texte(erreur: unknown): string {
  return erreur instanceof ErreurApi
    ? erreur.message
    : "L'agenda n'a pas répondu. Vérifiez que l'API tourne.";
}
