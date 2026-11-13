"use client";

import { useState } from "react";

import { traduire } from "@/lib/langue";
import { ErreurChantier } from "@/lib/errors";
import type { CommandeEntree } from "@/lib/types";

type Props = { langue: string };

const CHEMIN = "/api/public/commandes";

/**
 * La commande publique : le client tape son nom, son numéro, son quartier
 * et la quantité. Le dépôt voit la commande sans compte.
 */
export function FormulaireCommande({ langue }: Props) {
  const t = traduire(langue).t;
  const [form, setForm] = useState({ nom: "", telephone: "", quartier: "", quantite: 1 });
  const [erreur, setErreur] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function envoyer(evenement: React.FormEvent) {
    evenement.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      const corps: CommandeEntree = {
        nom: form.nom,
        telephone: form.telephone,
        quartier: form.quartier,
        quantite: form.quantite,
      };
      const reponse = await fetch(CHEMIN, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(corps),
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
        throw new ErreurChantier(
          texte || (langue === "en" ? "The depot did not accept this order." : "Le dépôt n'a pas accepté cette commande."),
          reponse.status,
        );
      }
      const telephone = form.telephone;
      setOk(telephone);
      setForm({ nom: "", telephone: "", quartier: "", quantite: 1 });
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
    } finally {
      setEnCours(false);
    }
  }

  if (ok !== null) {
    return (
      <div className="cadc-carte cadc-pile">
        <p className="cadc-note cadc-note--acier" role="status">
          {t("commander.ok", { numero: ok })}
        </p>
        <p className="cadc-note">{t("commander.aide")}</p>
        <div className="cadc-acts">
          <button
            type="button"
            className="cadc-bouton cadc-bouton--premier"
            onClick={() => setOk(null)}
          >
            {t("commander.encore")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="cadc-carte cadc-pile" onSubmit={envoyer}>
      <div className="cadc-grille">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("commander.nom")}</span>
          <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} maxLength={160} autoComplete="name" required />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("commander.telephone")}</span>
          <input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} inputMode="tel" placeholder="6 77 12 34 56" autoComplete="tel" required />
        </label>
      </div>
      <div className="cadc-grille">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("commander.quartier")}</span>
          <input value={form.quartier} onChange={(e) => setForm({ ...form, quartier: e.target.value })} maxLength={80} autoComplete="off" />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("commander.quantite")}</span>
          <input type="number" min={1} max={100} value={form.quantite || ""} onChange={(e) => setForm({ ...form, quantite: Number(e.target.value) || 1 })} inputMode="numeric" required />
        </label>
      </div>
      {erreur ? (
        <p className="cadc-note cadc-note--rouge" role="alert">{erreur}</p>
      ) : null}
      <button type="submit" className="cadc-bouton cadc-bouton--grand cadc-bouton--premier" disabled={enCours}>
        {enCours ? t("commander.envoi") : t("commander.envoyer")}
      </button>
      <p className="cadc-note">{t("commander.aide")}</p>
    </form>
  );
}
