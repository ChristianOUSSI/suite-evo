"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import { TYPES_CLIENT } from "@/lib/constantes";
import type { Client, ClientEntree } from "@/lib/types";

type Props = { clients: Client[]; langue: string };

const VIDE = { nom: "", telephone: "", type: "particulier", note: "" };

/**
 * Les clients du quai : une fiche par expéditeur ou destinataire — le
 * nom, le numéro camerounais, le type. Le carnet ne perd personne.
 */
export function ClientsGerant({ clients, langue }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState(VIDE);
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreurs, setErreurs] = useState<Record<number, string>>({});
  const [enCours, setEnCours] = useState<number | "ajout" | null>(null);
  const [recherche, setRecherche] = useState("");

  const affiches = clients.filter((un) => {
    if (!recherche.trim()) return true;
    const motif = recherche.trim().toLowerCase();
    return (
      un.nom.toLowerCase().includes(motif) ||
      un.telephone.replace(/\D/g, "").includes(motif.replace(/\D/g, "") || motif) ||
      un.note.toLowerCase().includes(motif)
    );
  });

  async function ajouter() {
    setEnCours("ajout");
    setErreur(null);
    try {
      const corps: ClientEntree = {
        nom: form.nom,
        telephone: form.telephone,
        type: form.type,
        note: form.note,
      };
      await ecrire<Client>("/clients", { body: corps, langue });
      setForm(VIDE);
      setOuvert(false);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  async function corriger(un: Client, patch: Record<string, unknown>) {
    setEnCours(un.id);
    setErreurs((actuelles) => ({ ...actuelles, [un.id]: "" }));
    try {
      await ecrire<Client>(`/clients/${un.id}`, { method: "PATCH", body: patch, langue });
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
          {ouvert ? t("commun.fermer") : t("clients.nouveau")}
        </button>
      </div>

      {ouvert ? (
        <div className="cadc-carte cadc-pile">
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("clients.nom")}</span>
              <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} maxLength={160} autoComplete="off" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("clients.telephone")}</span>
              <input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} inputMode="tel" placeholder="6 77 12 34 56" autoComplete="off" />
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("clients.type")}</span>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPES_CLIENT.map((un) => (
                  <option key={un} value={un}>{t(`type.${un}`)}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("clients.note")}</span>
            <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={600} rows={2} />
          </label>
          {erreur ? (
            <span className="cadc-note cadc-note--rouge" role="status">{erreur}</span>
          ) : null}
          <div className="cadc-acts">
            <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={ajouter} disabled={enCours === "ajout"}>
              {enCours === "ajout" ? t("commun.ecriture") : t("clients.nouveau")}
            </button>
          </div>
        </div>
      ) : null}

      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("clients.recherche")}</span>
        <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder={t("clients.recherche-aide")} autoComplete="off" />
      </label>

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {affiches.map((un) => (
          <li className="cadc-ligne" key={un.id}>
            <span className="cadc-ligne__nom">
              {un.nom}
              <small>
                {un.telephone_display || "—"}
                {un.telephone_joignable ? ` · ${un.operateur}` : ""} · {t(`type.${un.type}`)}
              </small>
              {un.note ? <small>{un.note}</small> : null}
            </span>
            <span className="cadc-ligne__valeur">
              <select
                value={un.type}
                disabled={enCours === un.id}
                onChange={(e) => corriger(un, { type: e.target.value })}
              >
                {TYPES_CLIENT.map((s) => (
                  <option key={s} value={s}>{t(`type.${s}`)}</option>
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
