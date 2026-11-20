"use client";

import { useState } from "react";

import { traduire } from "@/lib/langue";
import type { Annonce, DemandePubliqueEntree } from "@/lib/types";

type Props = { langue: string; annonces: Annonce[]; bienId: number | null };

const CHEMIN = "/api/public/demandes";

/**
 * La demande publique : le prospect écrit depuis les annonces, sans
 * compte. L'agence voit la demande dans /demandes avec le canal
 * « annonce ».
 */
export function FormulaireDemandePublique({ langue, annonces, bienId }: Props) {
  const t = traduire(langue).t;
  const [form, setForm] = useState<DemandePubliqueEntree>({
    bien_id: bienId,
    nom: "",
    telephone: "",
    message: "",
  });
  const [erreur, setErreur] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [enCours, setEnCours] = useState(false);

  function pose<K extends keyof DemandePubliqueEntree>(cle: K, valeur: DemandePubliqueEntree[K]) {
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
              ? "The agency did not accept this request."
              : "L'agence n'a pas accepté cette demande."),
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
        <p style={{ fontWeight: 600 }}>{t("demande.ok")}</p>
      </section>
    );
  }

  return (
    <section className="cadc-carte">
      <form onSubmit={envoyer} className="cadc-pile">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("demande.bien")}</span>
          <select
            value={form.bien_id ?? ""}
            onChange={(e) => pose("bien_id", e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{t("demande.autre")}</option>
            {annonces.map((un) => (
              <option key={un.id} value={un.id}>
                {un.titre || `${t(`type.${un.type}`)} - ${un.quartier || un.ville}`}
              </option>
            ))}
          </select>
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("demande.nom")}</span>
          <input required maxLength={160} value={form.nom} onChange={(e) => pose("nom", e.target.value)} />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("demande.telephone")}</span>
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
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("demande.message")}</span>
          <textarea maxLength={2000} rows={4} value={form.message} onChange={(e) => pose("message", e.target.value)} />
        </label>
        {erreur ? <p className="cadc-erreur">{erreur}</p> : null}
        <div className="cadc-acts">
          <button type="submit" className="cadc-bouton cadc-bouton--premier" disabled={enCours}>
            {enCours ? "…" : t("demande.envoyer")}
          </button>
        </div>
      </form>
    </section>
  );
}
