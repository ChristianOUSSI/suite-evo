"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErreurApi, patcher, poster, supprimer } from "@/lib/client-api";
import { JOURS } from "@/lib/format";
import type { Guichet } from "@/lib/types";

interface JourRegle {
  actif: boolean;
  opens: string;
  closes: string;
}

interface Reglage {
  name: string;
  room: string;
  duration_min: number;
  step_min: number;
  lead_days: number;
  horizon_days: number;
  note: string;
  jours: JourRegle[];
}

const NEANT: Reglage = {
  name: "",
  room: "",
  duration_min: 20,
  step_min: 20,
  lead_days: 1,
  horizon_days: 14,
  note: "",
  jours: JOURS.map(() => ({ actif: false, opens: "08:00", closes: "16:00" })),
};

function copie(guichet: Guichet): Reglage {
  const jours = JOURS.map(() => ({ actif: false, opens: "08:00", closes: "16:00" }));
  for (const jour of guichet.days) {
    jours[jour.weekday] = { actif: true, opens: jour.opens, closes: jour.closes };
  }
  return {
    name: guichet.name,
    room: guichet.room,
    duration_min: guichet.duration_min,
    step_min: guichet.step_min,
    lead_days: guichet.lead_days,
    horizon_days: guichet.horizon_days,
    note: guichet.note,
    jours,
  };
}

export function Guichets({ guichets }: { guichets: Guichet[] }) {
  const route = useRouter();
  const [ouvert, setOuvert] = useState("");
  const [reglage, setReglage] = useState<Reglage>(NEANT);
  const [panne, setPanne] = useState("");
  const [enCours, setEnCours] = useState(false);

  function regler(guichet: Guichet) {
    if (ouvert === String(guichet.id)) {
      setOuvert("");
      return;
    }
    setPanne("");
    setOuvert(String(guichet.id));
    setReglage(copie(guichet));
  }

  function nouveau() {
    setPanne("");
    setOuvert("nouveau");
    setReglage(NEANT);
  }

  function jour(index: number, changements: Partial<JourRegle>) {
    setReglage((actuel) => ({
      ...actuel,
      jours: actuel.jours.map((un, i) => (i === index ? { ...un, ...changements } : un)),
    }));
  }

  async function enregistrer() {
    setEnCours(true);
    setPanne("");
    const days = reglage.jours
      .map((un, weekday) => ({ ...un, weekday }))
      .filter((un) => un.actif)
      .map((un) => ({ weekday: un.weekday, opens: un.opens, closes: un.closes }));
    const corps = {
      name: reglage.name.trim(),
      room: reglage.room.trim(),
      duration_min: reglage.duration_min,
      step_min: reglage.step_min,
      lead_days: reglage.lead_days,
      horizon_days: reglage.horizon_days,
      note: reglage.note.trim(),
      days,
    };
    try {
      if (ouvert === "nouveau") {
        const cree = await poster<Guichet>("/services", corps);
        setOuvert(String(cree.id));
      } else {
        await patcher<Guichet>(`/services/${ouvert}`, corps);
      }
      route.refresh();
    } catch (erreur) {
      setPanne(texte(erreur));
    } finally {
      setEnCours(false);
    }
  }

  async function fermer() {
    setEnCours(true);
    setPanne("");
    try {
      await supprimer(`/services/${ouvert}`);
      setOuvert("");
      route.refresh();
    } catch (erreur) {
      setPanne(texte(erreur));
    } finally {
      setEnCours(false);
    }
  }

  const choisit = guichets.find((item) => String(item.id) === ouvert);
  const tient = reglage.jours.some((un) => un.actif);

  return (
    <section className="panneau guichets-voisin">
      <h2>Les guichets de l'établissement</h2>

      <div className="guichets">
        {guichets.map((guichet) => (
          <article
            key={guichet.id}
            className={
              ouvert === String(guichet.id) ? "guichet actif" : "guichet"
            }
          >
            <p className="nom">{guichet.name}</p>
            <p className="detail">{guichet.room || "sans bureau précisé"}</p>
            <p className="tenue">
              {guichet.days.length
                ? [...new Set(guichet.days.map((jour) => jour.label))]
                    .map((label) => label.slice(0, 3))
                    .join(" ")
                : "aucun jour tenu"}
            </p>
            <p className="detail">
              {guichet.duration_min} min, {guichet.step_min} min d'écart,{" "}
              {guichet.horizon_days} jours devant
            </p>
            {guichet.next && guichet.next.length > 0 && (
              <p className="prochaine">
                prochaine place {dateCourte(guichet.next[0])}
              </p>
            )}
            <button
              className="bouton sobre petit"
              type="button"
              onClick={() => regler(guichet)}
            >
              {ouvert === String(guichet.id) ? "Refermer" : "Régler le guichet"}
            </button>
          </article>
        ))}
        <article className="guichet neuf">
          <p className="nom">Un guichet de plus</p>
          <p className="detail">
            Le retrait de dossiers, la scolarité, le laboratoire, les urgences
            médicales : ce que l'on peut poser comme rendez-vous.
          </p>
          <button className="bouton petit" type="button" onClick={nouveau}>
            Ouvrir un guichet
          </button>
        </article>
      </div>

      {(ouvert === "nouveau" || choisit) && (
        <div className="reglage-guichet">
          <p className="sous">
            {choisit ? `Ce que tient « ${choisit.name} »` : "Le nouveau guichet"}
          </p>

          <div className="deux-champs">
            <label className="champ-ligne">
              <span>Nom du guichet</span>
              <input
                value={reglage.name}
                onChange={(e) => setReglage({ ...reglage, name: e.target.value })}
                placeholder="retrait de dossier"
              />
            </label>
            <label className="champ-ligne">
              <span>Bureau</span>
              <input
                value={reglage.room}
                onChange={(e) => setReglage({ ...reglage, room: e.target.value })}
                placeholder="bureau 3, aile B"
              />
            </label>
          </div>

          <div className="quatre-champs">
            <label className="champ-ligne">
              <span>Place (min)</span>
              <input
                type="number"
                min={5}
                max={120}
                step={5}
                value={reglage.duration_min}
                onChange={(e) =>
                  setReglage({ ...reglage, duration_min: Number(e.target.value) })
                }
              />
            </label>
            <label className="champ-ligne">
              <span>Écart (min)</span>
              <input
                type="number"
                min={5}
                max={120}
                step={5}
                value={reglage.step_min}
                onChange={(e) =>
                  setReglage({ ...reglage, step_min: Number(e.target.value) })
                }
              />
            </label>
            <label className="champ-ligne">
              <span>Préavis (jours)</span>
              <input
                type="number"
                min={0}
                max={30}
                value={reglage.lead_days}
                onChange={(e) =>
                  setReglage({ ...reglage, lead_days: Number(e.target.value) })
                }
              />
            </label>
            <label className="champ-ligne">
              <span>Horizon (jours)</span>
              <input
                type="number"
                min={1}
                max={60}
                value={reglage.horizon_days}
                onChange={(e) =>
                  setReglage({ ...reglage, horizon_days: Number(e.target.value) })
                }
              />
            </label>
          </div>

          <p className="sous">Jours tenus</p>
          <div className="jours-regles">
            {reglage.jours.map((regle, index) => (
              <div
                key={JOURS[index]}
                className={regle.actif ? "jour-regle actif" : "jour-regle"}
              >
                <label className="case">
                  <input
                    type="checkbox"
                    checked={regle.actif}
                    onChange={(e) => jour(index, { actif: e.target.checked })}
                  />
                  {JOURS[index]}
                </label>
                {regle.actif && (
                  <span className="heures">
                    <input
                      type="time"
                      value={regle.opens}
                      onChange={(e) => jour(index, { opens: e.target.value })}
                    />
                    <input
                      type="time"
                      value={regle.closes}
                      onChange={(e) => jour(index, { closes: e.target.value })}
                    />
                  </span>
                )}
              </div>
            ))}
          </div>

          <label className="champ-ligne">
            <span>Ce que la voix ajoute en le proposant</span>
            <input
              value={reglage.note}
              onChange={(e) => setReglage({ ...reglage, note: e.target.value })}
              placeholder="apporter la carte étudiante"
            />
          </label>

          {panne && <p className="message-erreur">{panne}</p>}
          {!tient && (
            <p className="attention">
              Sans jour coché, aucune place ne sort de ce guichet.
            </p>
          )}

          <div className="ligne-action">
            <button
              className="bouton"
              type="button"
              onClick={enregistrer}
              disabled={enCours || reglage.name.trim().length < 3}
            >
              {choisit ? "Enregistrer le guichet" : "Ouvrir ce guichet"}
            </button>
            {choisit && (
              <button
                className="bouton sobre"
                type="button"
                onClick={fermer}
                disabled={enCours}
              >
                Fermer le guichet
              </button>
            )}
            <button
              className="bouton sobre"
              type="button"
              onClick={() => setOuvert("")}
            >
              Laisser tranquille
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function dateCourte(iso: string): string {
  const instant = new Date(iso);
  return instant.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function texte(erreur: unknown): string {
  return erreur instanceof ErreurApi
    ? erreur.message
    : "Les guichets n'ont pas répondu. Vérifiez que l'API tourne.";
}
