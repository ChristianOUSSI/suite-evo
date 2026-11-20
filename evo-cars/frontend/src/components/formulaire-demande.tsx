"use client";

import { useState } from "react";

import { formats } from "@/lib/format";
import { traduire } from "@/lib/langue";
import type { Catalogue, DemandeEntree, TypeDemande } from "@/lib/types";

type Props = { langue: string; catalogue: Catalogue | null; voitureId: number | null; pieceId: number | null };

const CHEMIN = "/api/public/demandes";

/**
 * La demande publique : le client écrit pour une voiture ou une
 * pièce, sans compte. Le garage voit la demande dans /demandes.
 */
export function FormulaireDemande({ langue, catalogue, voitureId, pieceId }: Props) {
  const t = traduire(langue).t;
  const f = formats(langue);
  const [form, setForm] = useState<DemandeEntree>({
    type: "voiture" as TypeDemande,
    voiture_id: voitureId,
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
              ? "The garage did not accept this request."
              : "Le garage n'a pas accepté cette demande."),
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

  const voitures = catalogue?.voitures ?? [];
  const pieces = catalogue?.pieces ?? [];

  return (
    <section className="cadc-carte">
      <form onSubmit={envoyer} className="cadc-pile">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("demande.type")}</span>
          <select
            value={form.type}
            onChange={(e) => {
              const type = e.target.value as TypeDemande;
              setForm((avant) => ({
                ...avant,
                type,
                voiture_id: type === "piece" ? null : avant.voiture_id,
                piece_id: type === "voiture" ? null : avant.piece_id,
              }));
            }}
          >
            <option value="voiture">{t("demande.type_voiture")}</option>
            <option value="piece">{t("demande.type_piece")}</option>
          </select>
        </label>
        {form.type === "voiture" ? (
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("demande.voiture")}</span>
            <select
              value={form.voiture_id ?? ""}
              onChange={(e) => pose("voiture_id", e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">{t("demande.autre")}</option>
              {voitures.map((un) => (
                <option key={un.id} value={un.id}>
                  {un.marque} {un.modele} {un.annee} - {f.fcfa(un.prix)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("demande.piece")}</span>
            <select
              value={form.piece_id ?? ""}
              onChange={(e) => pose("piece_id", e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">{t("demande.autre")}</option>
              {pieces.map((un) => (
                <option key={un.id} value={un.id}>
                  {un.reference} · {un.designation} - {f.fcfa(un.prix_vente)}
                </option>
              ))}
            </select>
          </label>
        )}
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
