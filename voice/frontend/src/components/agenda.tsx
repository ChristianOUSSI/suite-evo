"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErreurApi, charger, poster } from "@/lib/client-api";
import { heure } from "@/lib/format";
import type { Guichet, JourneeLibre, RendezVous } from "@/lib/types";

export interface Places {
  service: string;
  slots: string[];
  calendar: JourneeLibre[];
  lead_days: number;
  horizon_days: number;
  duration_min: number;
}

export function Preneur({
  guichets,
  depart,
}: {
  guichets: Guichet[];
  depart: Places | null;
}) {
  const route = useRouter();
  const [choisi, setChoisi] = useState(String(guichets[0]?.id ?? ""));
  const [places, setPlaces] = useState<Places | null>(depart);
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [note, setNote] = useState("");
  const [panne, setPanne] = useState("");
  const [pose, setPose] = useState<RendezVous | null>(null);
  const [enCours, setEnCours] = useState(false);

  const guichet = guichets.find((item) => String(item.id) === choisi);

  async function choisir(id: string) {
    setChoisi(id);
    setEnCours(true);
    setPanne("");
    try {
      setPlaces(
        await charger<Places>(`/appointments/slots?service_id=${id}&limit=18`)
      );
    } catch (erreur) {
      setPanne(texte(erreur));
    } finally {
      setEnCours(false);
    }
  }

  async function poser(place: string) {
    setEnCours(true);
    setPanne("");
    try {
      const rendezVous = await poster<RendezVous>("/appointments", {
        service_id: Number(choisi),
        caller_name: nom.trim(),
        caller_phone: telephone.trim(),
        starts_at: place,
        note: note.trim(),
        origin: "console",
      });
      setPose(rendezVous);
      setNote("");
      const suite = await charger<Places>(
        `/appointments/slots?service_id=${choisi}&limit=18`
      );
      setPlaces(suite);
      route.refresh();
    } catch (erreur) {
      setPanne(texte(erreur));
    } finally {
      setEnCours(false);
    }
  }

  if (guichets.length === 0) {
    return (
      <section className="panneau">
        <h2>Prendre une place</h2>
        <p className="vide">
          Aucun guichet ouvert. Réglez-en un plus bas : sans guichet, la voix ne
          peut proposer aucune heure.
        </p>
      </section>
    );
  }

  return (
    <section className="panneau">
      <h2>Prendre une place pour {places?.service ?? guichet?.name}</h2>

      <div className="deux-champs">
        <label className="champ-ligne">
          <span>Guichet</span>
          <select value={choisi} onChange={(e) => choisir(e.target.value)}>
            {guichets.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.name}
                {item.room ? `, ${item.room}` : ""}
              </option>
            ))}
          </select>
        </label>
        <p className="reglages-guichet">
          {guichet
            ? `${guichet.duration_min} min par place, prise ${avance(
                guichet.lead_days
              )} et ${guichet.horizon_days} jours devant.`
            : ""}
        </p>
      </div>

      {places && places.calendar.length > 0 && (
        <div className="jours-libres">
          {places.calendar.map((journee) => (
            <div
              key={journee.day}
              className={journee.closed ? "jour-libre ferme" : "jour-libre"}
            >
              <b>{journee.free}</b>
              <span>{journee.label}</span>
              <div className="detail">
                {journee.closed
                  ? "le guichet ne tient pas"
                  : journee.first
                    ? `${heure(journee.first)} au plus tôt`
                    : "plus de place"}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="sous">Créneaux posables</p>
      <div className="creneaux">
        {(places?.slots ?? []).map((place) => (
          <button
            className="creneau"
            type="button"
            key={place}
            disabled={enCours || nom.trim().length < 2 || telephone.trim() === ""}
            onClick={() => poser(place)}
          >
            {dateHeure(place)}
          </button>
        ))}
        {places && places.slots.length === 0 && (
          <p className="vide">
            Toutes les places sont prises sur la fenêtre ouverte par ce guichet.
          </p>
        )}
      </div>

      <div className="deux-champs">
        <label className="champ-ligne">
          <span>Nom de l'appelant</span>
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Blaise Njo"
          />
        </label>
        <label className="champ-ligne">
          <span>Numéro</span>
          <input
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="6 99 30 77 24"
          />
        </label>
      </div>

      <label className="champ-ligne">
        <span>Ce qu'on note en face</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="apporte la carte de l'année dernière"
        />
      </label>

      {panne && <p className="message-erreur">{panne}</p>}
      {pose && (
        <p className="message-erreur ok">
          {pose.day} à {pose.clock}, référence {pose.reference}. La confirmation
          est partie en Démo vers {pose.caller_phone_display}.
        </p>
      )}
      <p className="note-bas">
        Le même formulaire sert à la voix : quand un appelant choisit un créneau
        au téléphone, la place est posée ici, avec une référence dictable.
      </p>
    </section>
  );
}

function avance(nombre: number): string {
  if (nombre === 0) return "le jour même";
  if (nombre === 1) return "dès le lendemain";
  return `seulement à partir de ${nombre} jours`;
}

function dateHeure(iso: string): string {
  const instant = new Date(iso);
  return `${instant.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })} ${heure(iso)}`;
}

function texte(erreur: unknown): string {
  return erreur instanceof ErreurApi
    ? erreur.message
    : "L'agenda n'a pas répondu. Vérifiez que l'API tourne.";
}
