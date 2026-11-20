"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { traduire } from "@/lib/langue";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import type { Catalogue, VehiculePublic } from "@/lib/types";

type Props = { langue: string; catalogue: Catalogue | null };

const CHEMIN = "/api/public/demandes";

/** La demande publique : le visiteur écrit pour un véhicule, sans compte. */
export function FormulaireDemande({ langue, catalogue }: Props) {
  const t = traduire(langue).t;
  const f = { fcfa: (n: number) => `${n.toLocaleString(langue === "en" ? "en-GB" : "fr-FR")} FCFA` };
  const routeur = useRouter();
  const params = useSearchParams();
  const vehiculeId = Number(params.get("vehicule") ?? "0") || null;
  const vehicules: VehiculePublic[] = catalogue?.vehicules ?? [];
  const [form, setForm] = useState({ vehicule_id: vehiculeId, client_nom: "", client_telephone: "", note: "" });
  const [enCours, setEnCours] = useState(false);
  const [ok, setOk] = useState(false);
  const [erreur, setErreur] = useState("");

  function pose(cle: keyof typeof form, valeur: string | number | null) {
    setForm((avant) => ({ ...avant, [cle]: valeur }));
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setErreur("");
    try {
      await ecrire(CHEMIN.replace("/api", ""), {
        method: "POST",
        body: {
          vehicule_id: form.vehicule_id,
          client_nom: form.client_nom,
          client_telephone: form.client_telephone,
          note: form.note,
        },
        langue,
      });
      setOk(true);
      routeur.refresh();
    } catch (err) {
      setErreur(err instanceof ErreurChantier ? err.message : t("commun.horsLigne"));
    } finally {
      setEnCours(false);
    }
  }

  if (ok) {
    return (
      <div className="cadc-carte">
        <p className="cadc-ok">{t("demande.ok")}</p>
      </div>
    );
  }

  return (
    <form className="cadc-carte" onSubmit={envoyer}>
      {vehicules.length > 0 ? (
        <label>
          {t("demande.vehicule")}
          <select
            value={form.vehicule_id ?? ""}
            onChange={(e) => pose("vehicule_id", e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{t("demande.aucun")}</option>
            {vehicules.map((un) => (
              <option key={un.id} value={un.id}>
                {un.marque} {un.modele} {un.annee} - {f.fcfa(un.prix)}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label>
        {t("demande.nomme")}
        <input value={form.client_nom} onChange={(e) => pose("client_nom", e.target.value)} required minLength={2} />
      </label>
      <label>
        {t("demande.tel")}
        <input
          value={form.client_telephone}
          onChange={(e) => pose("client_telephone", e.target.value)}
          required
          inputMode="tel"
          placeholder="690 12 34 56"
        />
      </label>
      <label>
        {t("demande.note")}
        <textarea value={form.note} onChange={(e) => pose("note", e.target.value)} rows={3} />
      </label>
      {erreur ? <p className="cadc-erreur">{erreur}</p> : null}
      <button className="cadc-bouton" type="submit" disabled={enCours}>
        {t("demande.envoyer")}
      </button>
    </form>
  );
}
