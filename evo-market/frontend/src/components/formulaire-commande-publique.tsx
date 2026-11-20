"use client";

import { useState } from "react";

import { formats } from "@/lib/format";
import { traduire } from "@/lib/langue";
import type { AnnoncePublique, DemandeEntree } from "@/lib/types";

type Props = { langue: string; annonces: AnnoncePublique[]; annonceId: number | null };

const CHEMIN = "/api/public/commandes";

/**
 * La commande publique : l'acheteur écrit depuis les annonces, sans
 * compte. La boutique voit la demande dans /demandes.
 */
export function FormulaireCommandePublique({ langue, annonces, annonceId }: Props) {
  const t = traduire(langue).t;
  const f = formats(langue);
  const [form, setForm] = useState<DemandeEntree>({
    annonce_id: annonceId,
    quantite: 1,
    acheteur_nom: "",
    acheteur_telephone: "",
    note: "",
  });
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
              ? "The shop did not accept this order."
              : "La boutique n'a pas accepté cette commande."),
        );
      }
      setOk(true);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : t("commun.horsLigne"));
    } finally {
      setEnCours(false);
    }
  }

  if (ok) {
    return (
      <section className="cadc-carte">
        <p style={{ fontWeight: 600 }}>{t("commander.ok")}</p>
      </section>
    );
  }

  return (
    <section className="cadc-carte">
      <form onSubmit={envoyer} className="cadc-pile">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("commander.annonce")}</span>
          <select
            value={form.annonce_id ?? ""}
            onChange={(e) => pose("annonce_id", e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{t("commander.autre")}</option>
            {annonces.map((un) => (
              <option key={un.id} value={un.id}>
                {un.titre} - {f.fcfa(un.prix)}
              </option>
            ))}
          </select>
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("commander.quantite")}</span>
          <input
            type="number"
            min={1}
            max={999}
            value={form.quantite}
            onChange={(e) => pose("quantite", Math.max(1, Number(e.target.value) || 1))}
          />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("commander.nom")}</span>
          <input required maxLength={160} value={form.acheteur_nom} onChange={(e) => pose("acheteur_nom", e.target.value)} />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("commander.telephone")}</span>
          <input
            required
            type="tel"
            inputMode="tel"
            maxLength={24}
            placeholder="690 12 34 56"
            value={form.acheteur_telephone}
            onChange={(e) => pose("acheteur_telephone", e.target.value)}
          />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("commander.note")}</span>
          <textarea maxLength={600} rows={3} value={form.note} onChange={(e) => pose("note", e.target.value)} />
        </label>
        {erreur ? <p className="cadc-erreur">{erreur}</p> : null}
        <div className="cadc-acts">
          <button type="submit" className="cadc-bouton cadc-bouton--premier" disabled={enCours}>
            {enCours ? "…" : t("commander.envoyer")}
          </button>
        </div>
      </form>
    </section>
  );
}
