"use client";

import { useState } from "react";

import { traduire } from "@/lib/langue";
import type { RappelEnvoye } from "@/lib/types";

type Props = { langue: string };

const MOTIFS = ["vente", "sav", "renseignement", "plainte", "autre"] as const;

function texteErreur(payload: unknown, langue: string, repli: string): string {
  const detail = (payload as { detail?: unknown })?.detail;
  if (detail && typeof detail === "object") {
    const corps = detail as { fr?: string; en?: string };
    return corps[langue === "en" ? "en" : "fr"] ?? corps.fr ?? repli;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const premier = detail[0] as { msg?: string };
    return premier?.msg ?? repli;
  }
  return typeof detail === "string" ? detail : repli;
}

/**
 * La demande de rappel publique : le client laisse son nom, son numéro
 * et son motif. Sa demande entre dans la file des rappels du standard -
 * traitée comme un rappel programmé, pas comme un appel perdu.
 */
export function FormulaireRappel({ langue }: Props) {
  const t = traduire(langue).t;
  const [form, setForm] = useState({
    nom: "",
    telephone: "",
    motif: "renseignement",
    creneau: "",
    note: "",
  });
  const [envoye, setEnvoye] = useState<RappelEnvoye | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function envoyer(evenement: React.FormEvent) {
    evenement.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      const reponse = await fetch("/api/public/rappel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nom: form.nom,
          telephone: form.telephone,
          motif: form.motif,
          creneau: form.creneau || null,
          note: form.note,
        }),
      });
      const payload = await reponse.json().catch(() => null);
      if (!reponse.ok) {
        throw new Error(
          texteErreur(
            payload,
            langue,
            langue === "en"
              ? "The centre did not accept this request."
              : "Le centre n'a pas accepté cette demande.",
          ),
        );
      }
      setEnvoye(payload as RappelEnvoye);
      setForm({ nom: "", telephone: "", motif: "renseignement", creneau: "", note: "" });
    } catch (e) {
      setErreur(e instanceof Error ? e.message : t("commun.horsLigne"));
    } finally {
      setEnCours(false);
    }
  }

  if (envoye) {
    return (
      <div className="cadc-carte cadc-pile">
        <p className="cadc-note cadc-note--acier" role="status">
          {t("rappel.ok-titre")}
        </p>
        <p className="cadc-note">
          {t("rappel.ok-texte", { reference: envoye.reference })}
        </p>
        <div className="cadc-acts">
          <button
            type="button"
            className="cadc-bouton cadc-bouton--premier"
            onClick={() => setEnvoye(null)}
          >
            {t("rappel.encore")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="cadc-pile" onSubmit={envoyer}>
      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("rappel.nom")}</span>
        <input
          value={form.nom}
          onChange={(e) => setForm({ ...form, nom: e.target.value })}
          maxLength={160}
          autoComplete="name"
          required
        />
      </label>
      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("rappel.telephone")}</span>
        <input
          value={form.telephone}
          onChange={(e) => setForm({ ...form, telephone: e.target.value })}
          inputMode="tel"
          placeholder="6 77 12 34 56"
          autoComplete="tel"
          required
        />
      </label>
      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("rappel.motif")}</span>
        <select
          value={form.motif}
          onChange={(e) => setForm({ ...form, motif: e.target.value })}
        >
          {MOTIFS.map((un) => (
            <option key={un} value={un}>
              {t(`motif.${un}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("rappel.creneau")}</span>
        <input
          type="date"
          value={form.creneau}
          onChange={(e) => setForm({ ...form, creneau: e.target.value })}
        />
      </label>
      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("rappel.note")}</span>
        <textarea
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          maxLength={600}
          rows={3}
        />
      </label>
      {erreur ? (
        <p className="cadc-note cadc-note--rouge" role="alert">
          {erreur}
        </p>
      ) : null}
      <button
        type="submit"
        className="cadc-bouton cadc-bouton--grand cadc-bouton--premier"
        disabled={enCours}
      >
        {enCours ? t("rappel.envoi") : t("rappel.envoyer")}
      </button>
    </form>
  );
}
