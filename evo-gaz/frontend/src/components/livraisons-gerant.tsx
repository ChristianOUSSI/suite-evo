"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { formats } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import { STATUTS_LIVRAISON } from "@/lib/constantes";
import type { Client, Livraison, LivraisonEntree } from "@/lib/types";

type Props = { livraisons: Livraison[]; clients: Client[]; langue: string };

const VIDE = {
  client_id: "",
  quantite: 1,
  prix_unitaire: 6800,
  adresse: "",
  note: "",
};

/**
 * Les livraisons du dépôt : une fiche par bonbonne partie - le client, le
 * quartier, la quantité, le statut. Commandée → en route → livrée.
 */
export function LivraisonsGerant({ livraisons, clients, langue }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const f = formats(langue);
  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState(VIDE);
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreurs, setErreurs] = useState<Record<number, string>>({});
  const [enCours, setEnCours] = useState<number | "ajout" | null>(null);
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("");

  const affiches = livraisons.filter((un) => {
    if (filtre && un.statut !== filtre) return false;
    if (!recherche.trim()) return true;
    const motif = recherche.trim().toLowerCase();
    return (
      un.client.toLowerCase().includes(motif) ||
      (un.telephone ?? "").replace(/\D/g, "").includes(motif.replace(/\D/g, "") || motif) ||
      (un.quartier ?? "").toLowerCase().includes(motif) ||
      un.adresse.toLowerCase().includes(motif) ||
      un.note.toLowerCase().includes(motif)
    );
  });

  async function ajouter() {
    setEnCours("ajout");
    setErreur(null);
    try {
      const corps: LivraisonEntree = {
        client_id: Number(form.client_id),
        quantite: form.quantite,
        prix_unitaire: form.prix_unitaire,
        adresse: form.adresse,
        note: form.note,
      };
      await ecrire<Livraison>("/livraisons", { body: corps, langue });
      setForm(VIDE);
      setOuvert(false);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  async function corriger(un: Livraison, patch: Record<string, unknown>) {
    setEnCours(un.id);
    setErreurs((actuelles) => ({ ...actuelles, [un.id]: "" }));
    try {
      await ecrire<Livraison>(`/livraisons/${un.id}`, { method: "PATCH", body: patch, langue });
      routeur.refresh();
    } catch (e) {
      setErreurs((actuelles) => ({
        ...actuelles,
        [un.id]: e instanceof ErreurChantier ? e.message : t("commun.horsLigne"),
      }));
      setEnCours(null);
    }
  }

  return (
    <div className="cadc-pile">
      <div className="cadc-acts">
        <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={() => setOuvert((v) => !v)}>
          {ouvert ? t("commun.fermer") : t("livraisons.nouvelle")}
        </button>
      </div>

      {ouvert ? (
        <div className="cadc-carte cadc-pile">
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("livraisons.client")}</span>
              <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
                <option value="">-</option>
                {clients.map((un) => (
                  <option key={un.id} value={un.id}>{un.nom}</option>
                ))}
              </select>
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("livraisons.quantite")}</span>
              <input type="number" min={1} max={500} value={form.quantite || ""} onChange={(e) => setForm({ ...form, quantite: Number(e.target.value) || 1 })} inputMode="numeric" />
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("livraisons.prix")}</span>
              <input type="number" min={0} max={10000000} value={form.prix_unitaire || ""} onChange={(e) => setForm({ ...form, prix_unitaire: Number(e.target.value) || 0 })} inputMode="numeric" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("livraisons.adresse")}</span>
              <input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} maxLength={160} autoComplete="off" placeholder={t("livraisons.recherche-aide")} />
            </label>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("livraisons.note")}</span>
            <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={600} rows={2} />
          </label>
          {erreur ? (
            <span className="cadc-note cadc-note--rouge" role="status">{erreur}</span>
          ) : null}
          <div className="cadc-acts">
            <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={ajouter} disabled={enCours === "ajout" || !form.client_id}>
              {enCours === "ajout" ? t("commun.ecriture") : t("livraisons.nouvelle")}
            </button>
          </div>
        </div>
      ) : null}

      <div className="cadc-grille">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("livraisons.recherche")}</span>
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder={t("livraisons.recherche-aide")} autoComplete="off" />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("livraisons.statut")}</span>
          <select value={filtre} onChange={(e) => setFiltre(e.target.value)}>
            <option value="">{t("livraisons.tous")}</option>
            {STATUTS_LIVRAISON.map((un) => (
              <option key={un} value={un}>{t(`lstatut.${un}`)}</option>
            ))}
          </select>
        </label>
      </div>

      <span className="cadc-note">{t("livraisons.aide")}</span>

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {affiches.map((un) => (
          <li
            className={`cadc-ligne${un.statut === "en_route" ? " appel--file" : ""}${un.statut === "annulee" ? " appel--perdu" : ""}${un.statut === "livree" ? " appel--clos" : ""}`}
            key={un.id}
          >
            <span className="cadc-ligne__nom">
              {un.client}
              <small>
                ×{un.quantite} · {t(`lstatut.${un.statut}`)}
                {un.quartier ? ` · ${un.quartier}` : ""}
                {un.date_commande ? ` · ${t("livraisons.commandee_le")} ${f.jourDate(un.date_commande)}` : ""}
                {un.date_livraison ? ` · ${t("livraisons.livree_le")} ${f.jourDate(un.date_livraison)}` : ""}
              </small>
              {un.adresse ? <small>{un.adresse}</small> : null}
              {un.note ? <small>{un.note}</small> : null}
            </span>
            <span className="cadc-ligne__valeur">
              <strong>{f.fcfa(un.montant)}</strong>
              <select
                value={un.statut}
                disabled={enCours === un.id}
                onChange={(e) => corriger(un, { statut: e.target.value })}
              >
                {STATUTS_LIVRAISON.map((s) => (
                  <option key={s} value={s}>{t(`lstatut.${s}`)}</option>
                ))}
              </select>
              {erreurs[un.id] ? (
                <span className="cadc-note cadc-note--rouge" role="status">{erreurs[un.id]}</span>
              ) : null}
            </span>
          </li>
        ))}
        {affiches.length === 0 ? (
          <li className="cadc-note">{t("commun.aucun")}</li>
        ) : null}
      </ul>
    </div>
  );
}
