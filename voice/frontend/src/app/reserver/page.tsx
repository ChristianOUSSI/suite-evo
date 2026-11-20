"use client";

import { useEffect, useState } from "react";
import { charger, poster } from "@/lib/client-api";

type Guichet = {
  id: number;
  nom: string;
  salle: string;
  duree_min: number;
  note: string;
  creneaux: string[];
};

type Catalogue = {
  organisation: { nom: string; ville: string };
  guichets: Guichet[];
};

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 560, margin: "0 auto", padding: "20px 16px 64px", fontFamily: "system-ui, sans-serif" },
  titre: { fontSize: 26, margin: "8px 0 4px" },
  sous: { color: "#5b6472", marginBottom: 20 },
  carte: { border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, marginBottom: 14, background: "#fff" },
  nom: { fontSize: 18, fontWeight: 600 },
  meta: { color: "#5b6472", fontSize: 14, marginTop: 4 },
  creneau: {
    display: "inline-block", margin: "6px 6px 0 0", padding: "10px 14px",
    borderRadius: 10, border: "1px solid #2563eb", color: "#2563eb",
    background: "#eff6ff", cursor: "pointer", fontSize: 15,
  },
  creneauChoisi: { background: "#2563eb", color: "#fff" },
  champ: { width: "100%", padding: 12, borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 16, marginTop: 10, boxSizing: "border-box" },
  bouton: {
    width: "100%", padding: 14, borderRadius: 12, border: "none",
    background: "#1d4ed8", color: "#fff", fontSize: 17, fontWeight: 600, marginTop: 14, cursor: "pointer",
  },
  erreur: { background: "#fef2f2", color: "#b91c1c", padding: 12, borderRadius: 10, marginTop: 12 },
  ok: { background: "#f0fdf4", color: "#15803d", padding: 16, borderRadius: 12, marginTop: 12 },
};

export default function Reserver() {
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [charge, setCharge] = useState(true);
  const [guichet, setGuichet] = useState<Guichet | null>(null);
  const [creneau, setCreneau] = useState("");
  const [nom, setNom] = useState("");
  const [tel, setTel] = useState("");
  const [note, setNote] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [reference, setReference] = useState("");

  useEffect(() => {
    charger<Catalogue>("/public/services")
      .then(setCatalogue)
      .catch(() => setErreur("Le standard ne répond pas pour l'instant."))
      .finally(() => setCharge(false));
  }, []);

  async function soumettre() {
    if (!guichet || !creneau || nom.trim().length < 2 || !tel.trim()) {
      setErreur("Choisis un guichet, un créneau, ton nom et ton numéro.");
      return;
    }
    setEnvoi(true);
    setErreur("");
    try {
      const reponse = await poster<{ reference: string }>("/public/appointments", {
        service_id: guichet.id,
        caller_name: nom.trim(),
        caller_phone: tel.trim(),
        starts_at: creneau,
        note: note.trim(),
      });
      setReference(reponse.reference);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "La réservation n'a pas pu partir.");
    } finally {
      setEnvoi(false);
    }
  }

  function formatCreneau(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }) +
      " · " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  if (reference) {
    return (
      <main style={styles.page}>
        <h1 style={styles.titre}>Rendez-vous posé</h1>
        <div style={styles.ok}>
          <b>Référence {reference}</b>
          <p style={{ margin: "8px 0 0" }}>
            {nom} · {formatCreneau(creneau)} · {guichet?.nom}
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 14 }}>
            Note cette référence : elle sert à retrouver ton rendez-vous au guichet.
          </p>
        </div>
        <button style={styles.bouton} onClick={() => { setReference(""); setCreneau(""); }}>
          Prendre un autre rendez-vous
        </button>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <h1 style={styles.titre}>Prendre rendez-vous</h1>
      <p style={styles.sous}>
        {catalogue ? catalogue.organisation.nom + " · " + catalogue.organisation.ville : "Chargement…"}
      </p>
      {charge && <p>Un instant…</p>}
      {erreur && <div style={styles.erreur}>{erreur}</div>}
      {!charge && catalogue?.guichets.map((g) => (
        <section key={g.id} style={styles.carte}>
          <div style={styles.nom}>{g.nom}</div>
          <div style={styles.meta}>
            {g.salle}{g.duree_min ? ` · ${g.duree_min} min` : ""}{g.note ? ` · ${g.note}` : ""}
          </div>
          <div>
            {g.creneaux.length === 0 && <span style={styles.meta}>Aucun créneau pour l'instant.</span>}
            {g.creneaux.map((c) => (
              <button
                key={c}
                type="button"
                style={{ ...styles.creneau, ...(creneau === c && guichet?.id === g.id ? styles.creneauChoisi : {}) }}
                onClick={() => { setGuichet(g); setCreneau(c); }}
              >
                {formatCreneau(c)}
              </button>
            ))}
          </div>
        </section>
      ))}
      {guichet && creneau && (
        <section style={styles.carte}>
          <div style={styles.nom}>Tes coordonnées</div>
          <input style={styles.champ} placeholder="Ton nom complet" value={nom} onChange={(e) => setNom(e.target.value)} />
          <input style={styles.champ} placeholder="Ton numéro (ex. 699 12 34 56)" value={tel} onChange={(e) => setTel(e.target.value)} inputMode="tel" />
          <input style={styles.champ} placeholder="Une précision (facultatif)" value={note} onChange={(e) => setNote(e.target.value)} />
          <button style={styles.bouton} onClick={soumettre} disabled={envoi}>
            {envoi ? "Envoi…" : `Confirmer · ${guichet.nom}`}
          </button>
        </section>
      )}
    </main>
  );
}
