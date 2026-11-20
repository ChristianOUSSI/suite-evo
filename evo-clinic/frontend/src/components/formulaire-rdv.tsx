"use client";

import { useState } from "react";

import { traduire } from "@/lib/langue";
import type { RendezVousEntree } from "@/lib/types";

type Props = { langue: string };

const CHEMIN = "/api/public/rendez-vous";

/**
 * La demande de rendez-vous publique : le patient écrit sans compte.
 * La clinique voit la demande dans /rendez-vous et tranche.
 */
export function FormulaireRdv({ langue }: Props) {
  const t = traduire(langue).t;
  const [form, setForm] = useState<RendezVousEntree>({
    nom: "",
    telephone: "",
    motif: "",
    jour: "",
    heure: "",
    note: "",
  });
  const [erreur, setErreur] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [enCours, setEnCours] = useState(false);

  function pose<K extends keyof RendezVousEntree>(cle: K, valeur: RendezVousEntree[K]) {
    setForm((avant) => ({ ...avant, [cle]: valeur }));
  }

  async function envoyer(evenement: React.FormEvent) {
    evenement.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      const reponse = await fetch(CHEMIN, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await reponse.json().catch(() => null);
      if (!reponse.ok) {
        const detail = (payload as { detail?: unknown })?.detail;
        const texte =
          detail && typeof detail === "object"
            ? ((detail as { fr?: string; en?: string })[langue === "en" ? "en" : "fr"] ??
              (detail as { fr?: string }).fr ??
              "")
            : typeof detail === "string"
              ? detail
              : "";
        throw new Error(
          texte ||
            (langue === "en"
              ? "The clinic did not accept this request."
              : "La clinique n'a pas accepté cette demande."),
        );
      }
      setOk(true);
      setForm({ nom: "", telephone: "", motif: "", jour: "", heure: "", note: "" });
    } catch (e) {
      setErreur(e instanceof Error ? e.message : t("commun.horsLigne"));
    } finally {
      setEnCours(false);
    }
  }

  if (ok) {
    return (
      <section className="cadc-carte">
        <p style={{ fontWeight: 600 }}>{t("rdv.ok")}</p>
      </section>
    );
  }

  return (
    <section className="cadc-carte">
      <form onSubmit={envoyer} className="cadc-pile">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("rdv.nom")}</span>
          <input required maxLength={160} value={form.nom} onChange={(e) => pose("nom", e.target.value)} />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("rdv.telephone")}</span>
          <input
            required
            type="tel"
            inputMode="tel"
            maxLength={24}
            placeholder="677 44 55 66"
            value={form.telephone}
            onChange={(e) => pose("telephone", e.target.value)}
          />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("rdv.motif")}</span>
          <input maxLength={160} value={form.motif} onChange={(e) => pose("motif", e.target.value)} />
        </label>
        <div className="cadc-2col">
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("rdv.jour")}</span>
            <input
              required
              type="date"
              value={form.jour}
              onChange={(e) => pose("jour", e.target.value)}
            />
          </label>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("rdv.heure")}</span>
            <input
              type="time"
              value={form.heure}
              onChange={(e) => pose("heure", e.target.value)}
            />
          </label>
        </div>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("rdv.note")}</span>
          <textarea maxLength={600} rows={3} value={form.note} onChange={(e) => pose("note", e.target.value)} />
        </label>
        {erreur ? <p className="cadc-erreur">{erreur}</p> : null}
        <div className="cadc-acts">
          <button type="submit" className="cadc-bouton cadc-bouton--premier" disabled={enCours}>
            {enCours ? "…" : t("rdv.envoyer")}
          </button>
        </div>
      </form>
    </section>
  );
}
