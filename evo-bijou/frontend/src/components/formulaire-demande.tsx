"use client";

import { useState } from "react";

import { formats } from "@/lib/format";
import { traduire } from "@/lib/langue";
import type { DemandeEntree, Piece } from "@/lib/types";

type Props = { langue: string; pieces: Piece[]; pieceId: number | null };

const CHEMIN = "/api/public/demandes";

/**
 * La demande publique : le client écrit depuis le catalogue, sans
 * compte. La bijouterie voit la demande dans /demandes.
 */
export function FormulaireDemande({ langue, pieces, pieceId }: Props) {
  const t = traduire(langue).t;
  const f = formats(langue);
  const [form, setForm] = useState<DemandeEntree>({
    piece_id: pieceId,
    client_nom: "",
    client_telephone: "",
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
              ? "The shop did not accept this request."
              : "La bijouterie n'a pas accepté cette demande."),
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
          <span className="cadc-champ__titre">{t("demande.piece")}</span>
          <select
            value={form.piece_id ?? ""}
            onChange={(e) => pose("piece_id", e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{t("demande.autre")}</option>
            {pieces.map((un) => (
              <option key={un.id} value={un.id}>
                {un.reference} · {un.nom} - {f.fcfa(un.prix_vente)}
              </option>
            ))}
          </select>
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("demande.nom")}</span>
          <input required maxLength={160} value={form.client_nom} onChange={(e) => pose("client_nom", e.target.value)} />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("demande.telephone")}</span>
          <input
            required
            type="tel"
            inputMode="tel"
            maxLength={24}
            placeholder="690 12 34 56"
            value={form.client_telephone}
            onChange={(e) => pose("client_telephone", e.target.value)}
          />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("demande.note")}</span>
          <textarea maxLength={600} rows={3} value={form.note} onChange={(e) => pose("note", e.target.value)} />
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
