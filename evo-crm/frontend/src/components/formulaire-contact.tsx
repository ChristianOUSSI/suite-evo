"use client";

import { useState } from "react";

import { traduire } from "@/lib/langue";
import type { ContactEnvoye } from "@/lib/types";

type Props = { langue: string };

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
 * Le formulaire public : le prospect laisse son nom, son numéro et son
 * besoin. L'équipe le retrouve dans son carnet avec une reprise déjà
 * programmée - le contact n'attend pas d'être retapé.
 */
export function FormulaireContact({ langue }: Props) {
  const t = traduire(langue).t;
  const [form, setForm] = useState({ nom: "", telephone: "", quartier: "", besoin: "" });
  const [envoye, setEnvoye] = useState<ContactEnvoye | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function envoyer(evenement: React.FormEvent) {
    evenement.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      const reponse = await fetch("/api/public/contact", {
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
              ? "The company did not accept this message."
              : "L'entreprise n'a pas accepté ce message.",
          ),
        );
      }
      setEnvoye(payload as ContactEnvoye);
      setForm({ nom: "", telephone: "", quartier: "", besoin: "" });
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
          {t("contact.ok-titre")}
        </p>
        <p className="cadc-note">
          {t("contact.ok-texte", { entreprise: envoye.entreprise.nom })}
        </p>
        <div className="cadc-acts">
          <button
            type="button"
            className="cadc-bouton cadc-bouton--premier"
            onClick={() => setEnvoye(null)}
          >
            {t("contact.encore")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="cadc-pile" onSubmit={envoyer}>
      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("contact.nom")}</span>
        <input
          value={form.nom}
          onChange={(e) => setForm({ ...form, nom: e.target.value })}
          maxLength={160}
          autoComplete="name"
          required
        />
      </label>
      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("contact.telephone")}</span>
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
        <span className="cadc-champ__titre">{t("contact.quartier")}</span>
        <input
          value={form.quartier}
          onChange={(e) => setForm({ ...form, quartier: e.target.value })}
          maxLength={80}
        />
      </label>
      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("contact.besoin")}</span>
        <textarea
          value={form.besoin}
          onChange={(e) => setForm({ ...form, besoin: e.target.value })}
          maxLength={1000}
          rows={4}
          required
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
        {enCours ? t("contact.envoi") : t("contact.envoyer")}
      </button>
    </form>
  );
}
