"use client";

import { useEffect, useState } from "react";

import { traduire } from "@/lib/langue";
import type { ClassePublique, DemandeEntree } from "@/lib/types";

type Props = { langue: string; classes: ClassePublique[] };

const CHEMIN = "/api/public/inscriptions";

/**
 * La demande d'inscription : le parent écrit sans compte. La page publique
 * charge les classes ouvertes et envoie la demande à l'école.
 */
export function FormulaireInscription({ langue, classes }: Props) {
  const t = traduire(langue).t;
  const [form, setForm] = useState<DemandeEntree>({
    eleve_nom: "",
    parent_nom: "",
    telephone: "",
    classe_id: null,
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
              ? "The school did not accept this request."
              : "L'école n'a pas accepté cette demande."),
        );
      }
      setOk(true);
      setForm({ eleve_nom: "", parent_nom: "", telephone: "", classe_id: null, note: "" });
    } catch (e) {
      setErreur(e instanceof Error ? e.message : t("commun.horsLigne"));
    } finally {
      setEnCours(false);
    }
  }

  if (ok) {
    return (
      <section className="cadc-carte">
        <p style={{ fontWeight: 600 }}>{t("inscription.ok")}</p>
      </section>
    );
  }

  return (
    <section className="cadc-carte">
      <form onSubmit={envoyer} className="cadc-pile">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("inscription.eleve")}</span>
          <input
            required
            maxLength={160}
            value={form.eleve_nom}
            onChange={(e) => pose("eleve_nom", e.target.value)}
          />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("inscription.parent")}</span>
          <input
            maxLength={160}
            value={form.parent_nom}
            onChange={(e) => pose("parent_nom", e.target.value)}
          />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("inscription.telephone")}</span>
          <input
            required
            type="tel"
            inputMode="tel"
            maxLength={24}
            placeholder="699 11 22 33"
            value={form.telephone}
            onChange={(e) => pose("telephone", e.target.value)}
          />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("inscription.classe")}</span>
          <select
            value={form.classe_id ?? ""}
            onChange={(e) => pose("classe_id", e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{t("inscription.aucune")}</option>
            {classes.map((un) => (
              <option key={un.id} value={un.id}>
                {un.nom}
              </option>
            ))}
          </select>
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("inscription.note")}</span>
          <textarea
            maxLength={600}
            rows={3}
            value={form.note}
            onChange={(e) => pose("note", e.target.value)}
          />
        </label>
        {erreur ? <p className="cadc-erreur">{erreur}</p> : null}
        <div className="cadc-acts">
          <button type="submit" className="cadc-bouton cadc-bouton--premier" disabled={enCours}>
            {enCours ? "…" : t("inscription.envoyer")}
          </button>
        </div>
      </form>
    </section>
  );
}
