"use client";

import { useState } from "react";

import { traduire } from "@/lib/langue";
import type { DemandeEnvoyee } from "@/lib/types";

type Props = { langue: string };

const CATEGORIES = ["identite", "autorisation", "contrat", "courrier", "autre"] as const;

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
 * La demande publique : le citoyen dit quel document il faut, l'équipe
 * prépare puis remet. Sans compte, sans installation - le numéro camerounais
 * suffit pour être rappelé.
 */
export function FormulaireDemande({ langue }: Props) {
  const t = traduire(langue).t;
  const [form, setForm] = useState({
    nom: "",
    telephone: "",
    categorie: "identite",
    motif: "",
  });
  const [envoye, setEnvoye] = useState<DemandeEnvoyee | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function envoyer(evenement: React.FormEvent) {
    evenement.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      const reponse = await fetch("/api/public/demandes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await reponse.json().catch(() => null);
      if (!reponse.ok) {
        throw new Error(
          texteErreur(
            payload,
            langue,
            langue === "en"
              ? "The organisation did not accept this request."
              : "L'organisation n'a pas accepté cette demande.",
          ),
        );
      }
      setEnvoye(payload as DemandeEnvoyee);
      setForm({ nom: "", telephone: "", categorie: "identite", motif: "" });
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
          {t("demande.ok-titre")}
        </p>
        <p className="cadc-note">
          {t("demande.ok-texte", { reference: envoye.demande.reference })}
        </p>
        <div className="cadc-acts">
          <button
            type="button"
            className="cadc-bouton cadc-bouton--premier"
            onClick={() => setEnvoye(null)}
          >
            {t("demande.encore")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="cadc-pile" onSubmit={envoyer}>
      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("demande.nom")}</span>
        <input
          value={form.nom}
          onChange={(e) => setForm({ ...form, nom: e.target.value })}
          maxLength={160}
          autoComplete="name"
          required
        />
      </label>
      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("demande.telephone")}</span>
        <input
          value={form.telephone}
          onChange={(e) => setForm({ ...form, telephone: e.target.value })}
          inputMode="tel"
          placeholder="6 77 12 34 56"
          autoComplete="tel"
        />
      </label>
      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("demande.categorie")}</span>
        <select
          value={form.categorie}
          onChange={(e) => setForm({ ...form, categorie: e.target.value })}
        >
          {CATEGORIES.map((une) => (
            <option key={une} value={une}>
              {t(`categorie.${une}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("demande.motif")}</span>
        <textarea
          value={form.motif}
          onChange={(e) => setForm({ ...form, motif: e.target.value })}
          maxLength={1000}
          rows={4}
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
        {enCours ? t("demande.envoi") : t("demande.envoyer")}
      </button>
    </form>
  );
}
