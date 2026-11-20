"use client";

import { useState } from "react";

import { MODES } from "@/lib/constantes";
import { formats } from "@/lib/format";
import { traduire } from "@/lib/langue";
import type { DemandeEntree } from "@/lib/types";

type Props = { langue: string };

const CHEMIN = "/api/public/devis";

const VIDE: DemandeEntree = {
  nom: "",
  telephone: "",
  description: "",
  mode: "maritime",
  expediteur_pays: "",
  destinataire_ville: "",
  poids_kg: 0,
  valeur_declaree: 0,
  note: "",
};

/**
 * La demande de devis publique : le client écrit sans compte.
 * Le transitaire voit la demande dans /demandes et répond.
 */
export function FormulaireDevis({ langue }: Props) {
  const t = traduire(langue).t;
  const f = formats(langue);
  const [form, setForm] = useState<DemandeEntree>(VIDE);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [enCours, setEnCours] = useState(false);

  function pose<K extends keyof DemandeEntree>(cle: K, valeur: DemandeEntree[K]) {
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
              ? "The forwarder did not accept this request."
              : "Le transitaire n'a pas accepté cette demande."),
        );
      }
      setOk(true);
      setForm(VIDE);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : t("commun.horsLigne"));
    } finally {
      setEnCours(false);
    }
  }

  if (ok) {
    return (
      <section className="cadc-carte">
        <p style={{ fontWeight: 600 }}>{t("devis.ok")}</p>
      </section>
    );
  }

  return (
    <section className="cadc-carte">
      <form onSubmit={envoyer} className="cadc-pile">
        <div className="cadc-2col">
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("devis.nom")}</span>
            <input required maxLength={160} value={form.nom} onChange={(e) => pose("nom", e.target.value)} />
          </label>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("devis.telephone")}</span>
            <input
              required
              type="tel"
              inputMode="tel"
              maxLength={24}
              placeholder="690 12 34 56"
              value={form.telephone}
              onChange={(e) => pose("telephone", e.target.value)}
            />
          </label>
        </div>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("devis.description")}</span>
          <input required maxLength={200} value={form.description} onChange={(e) => pose("description", e.target.value)} />
        </label>
        <div className="cadc-2col">
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("devis.mode")}</span>
            <select value={form.mode} onChange={(e) => pose("mode", e.target.value)}>
              {MODES.map((un) => (
                <option key={un} value={un}>
                  {t(`mode.${un}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("devis.poids")}</span>
            <input
              type="number"
              min={0}
              step="0.5"
              value={form.poids_kg}
              onChange={(e) => pose("poids_kg", Number(e.target.value) || 0)}
            />
          </label>
        </div>
        <div className="cadc-2col">
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("devis.pays")}</span>
            <input maxLength={60} value={form.expediteur_pays} onChange={(e) => pose("expediteur_pays", e.target.value)} />
          </label>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("devis.ville")}</span>
            <input maxLength={80} value={form.destinataire_ville} onChange={(e) => pose("destinataire_ville", e.target.value)} />
          </label>
        </div>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("devis.valeur")}</span>
          <input
            type="number"
            min={0}
            step="1000"
            value={form.valeur_declaree}
            onChange={(e) => pose("valeur_declaree", Number(e.target.value) || 0)}
          />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("devis.note")}</span>
          <textarea maxLength={600} rows={3} value={form.note} onChange={(e) => pose("note", e.target.value)} />
        </label>
        {erreur ? <p className="cadc-erreur">{erreur}</p> : null}
        <div className="cadc-acts">
          <button type="submit" className="cadc-bouton cadc-bouton--premier" disabled={enCours}>
            {enCours ? "…" : t("devis.envoyer")}
          </button>
        </div>
      </form>
    </section>
  );
}
