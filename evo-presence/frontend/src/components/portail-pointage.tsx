"use client";

import { useCallback, useState } from "react";

import { traduire } from "@/lib/langue";
import { formats, ETATS } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurPresence } from "@/lib/errors";
import type { Equipe, Place, Presence, StatutPresence } from "@/lib/types";

type Props = {
  equipeInitiale: Place[];
  jourInitial: string;
  langue: string;
};

const HEURES = ["", "06:00", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "17:30", "18:00", "18:30", "19:00"];

/**
 * Le portail du matin.
 *
 * Une case par employé et par jour : le second pointage corrige le premier,
 * il ne le double pas - la règle vit dans le backend, l'écran la rend simple.
 * L'agent peut revenir sur une journée passée pour corriger une case oubliée,
 * jamais écrire dans le futur.
 */
export function PortailPointage({ equipeInitiale, jourInitial, langue }: Props) {
  const t = traduire(langue).t;
  const f = formats(langue);
  const [jour, setJour] = useState(jourInitial);
  const [equipe, setEquipe] = useState<Place[]>(equipeInitiale);
  const [notes, setNotes] = useState<Record<number, string>>(() =>
    Object.fromEntries(equipeInitiale.map((un) => [un.employe_id, un.note])),
  );
  const [heures, setHeures] = useState<Record<number, { arrivee: string; depart: string }>>(() =>
    Object.fromEntries(
      equipeInitiale.map((un) => [
        un.employe_id,
        { arrivee: un.arrivee, depart: un.depart },
      ]),
    ),
  );
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupes, setOccupes] = useState<Record<number, boolean>>({});
  const [tordu, setTordu] = useState<string | null>(null);

  const charger = useCallback(
    async (cible: string) => {
      setChargement(true);
      setErreur(null);
      try {
        const corps = await ecrire<Equipe>(`/pointage?jour=${cible}`, { method: "GET", langue });
        setEquipe(corps.equipe);
        setNotes(Object.fromEntries(corps.equipe.map((un) => [un.employe_id, un.note])));
        setHeures(
          Object.fromEntries(
            corps.equipe.map((un) => [
              un.employe_id,
              { arrivee: un.arrivee, depart: un.depart },
            ]),
          ),
        );
      } catch (e) {
        setErreur(e instanceof ErreurPresence ? e.message : t("commun.horsLigne"));
      } finally {
        setChargement(false);
      }
    },
    [langue, t],
  );

  function choisirJour(valeur: string) {
    if (!valeur || valeur === jour) return;
    setJour(valeur);
    void charger(valeur);
  }

  const pointes = equipe.filter((un) => un.pointe).length;

  async function pointer(place: Place, statut: StatutPresence) {
    if (occupes[place.employe_id]) return;
    setOccupes((actuelles) => ({ ...actuelles, [place.employe_id]: true }));
    setTordu(null);
    const note = notes[place.employe_id] ?? "";
    const h = heures[place.employe_id] ?? { arrivee: "", depart: "" };
    let id = place.id;
    try {
      if (id !== null) {
        await ecrire<Presence>(`/pointages/${id}`, {
          method: "PATCH",
          body: { statut, arrivee: h.arrivee, depart: h.depart, note },
          langue,
        });
      } else {
        const cree = await ecrire<Presence>("/pointages", {
          method: "POST",
          body: {
            employe_id: place.employe_id,
            jour,
            statut,
            arrivee: h.arrivee,
            depart: h.depart,
            note,
          },
          langue,
        });
        id = cree.id;
      }
      setEquipe((actuelles) =>
        actuelles.map((un) =>
          un.employe_id === place.employe_id
            ? { ...un, pointe: true, id, statut, note, arrivee: h.arrivee, depart: h.depart }
            : un,
        ),
      );
    } catch (e) {
      setTordu(e instanceof ErreurPresence ? e.message : t("commun.horsLigne"));
    } finally {
      setOccupes((actuelles) => ({ ...actuelles, [place.employe_id]: false }));
    }
  }

  return (
    <div className="cadc-pile">
      <div className="cadc-grille">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("pointage.sur")}</span>
          <input
            type="date"
            value={jour}
            max={jourInitial}
            onChange={(e) => choisirJour(e.target.value)}
          />
        </label>
        <div className="cadc-champ" style={{ justifyContent: "end" }}>
          <span className="cadc-champ__aide" role="status">
            {chargement
              ? t("commun.chargement")
              : `${pointes}/${equipe.length} ${t("pointage.pointees")}`}
          </span>
        </div>
      </div>

      {tordu ? (
        <p className="cadc-note cadc-note--rouge" role="alert">
          {tordu}
        </p>
      ) : null}
      {erreur ? (
        <p className="cadc-note cadc-note--rouge" role="alert">
          {erreur}
        </p>
      ) : null}

      {equipe.length === 0 ? (
        <p className="cadc-note">{t("pointage.rien")}</p>
      ) : (
        equipe.map((place) => {
          const occupe = occupes[place.employe_id];
          const h = heures[place.employe_id] ?? { arrivee: "", depart: "" };
          return (
            <article
              key={place.employe_id}
              className={`place${place.statut ? ` place--${place.statut}` : ""}`}
            >
              <div className="place__tete">
                <span className="place__nom">
                  {place.nom}
                  <small>
                    {place.service}
                    {place.telephone ? ` · ${f.telephone(place.telephone)}` : ""}
                  </small>
                </span>
                {place.pointe && place.statut ? (
                  <span className="cadc-badge cadc-badge--doux">{t(`etat.${place.statut}`)}</span>
                ) : null}
              </div>

              <div className="cadc-grille" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <label className="cadc-champ">
                  <span className="cadc-champ__titre">{t("commun.heure")} · ↓</span>
                  <select
                    value={h.arrivee}
                    disabled={occupe}
                    onChange={(e) =>
                      setHeures((actuelles) => ({
                        ...actuelles,
                        [place.employe_id]: { ...h, arrivee: e.target.value },
                      }))
                    }
                  >
                    {HEURES.map((un) => (
                      <option key={un} value={un}>
                        {un || "-"}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="cadc-champ">
                  <span className="cadc-champ__titre">{t("commun.heure")} · ↑</span>
                  <select
                    value={h.depart}
                    disabled={occupe}
                    onChange={(e) =>
                      setHeures((actuelles) => ({
                        ...actuelles,
                        [place.employe_id]: { ...h, depart: e.target.value },
                      }))
                    }
                  >
                    {HEURES.map((un) => (
                      <option key={un} value={un}>
                        {un || "-"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="etats" role="group" aria-label={place.nom}>
                {ETATS.map((statut) => (
                  <button
                    key={statut}
                    type="button"
                    className={`etat etat--${statut}`}
                    aria-pressed={place.statut === statut}
                    disabled={occupe || chargement}
                    onClick={() => pointer(place, statut)}
                  >
                    {t(`etat.${statut}`)}
                  </button>
                ))}
              </div>

              <label className="cadc-champ">
                <span className="cadc-champ__titre">{t("pointage.note")}</span>
                <input
                  value={notes[place.employe_id] ?? ""}
                  disabled={occupe}
                  maxLength={600}
                  autoComplete="off"
                  onChange={(e) =>
                    setNotes((actuelles) => ({
                      ...actuelles,
                      [place.employe_id]: e.target.value,
                    }))
                  }
                />
              </label>
            </article>
          );
        })
      )}
    </div>
  );
}
