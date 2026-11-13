"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { formats } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import { MODES, STATUTS } from "@/lib/constantes";
import type { Client, Envoi, EnvoiEntree } from "@/lib/types";

type Props = { envois: Envoi[]; clients: Client[]; langue: string };

const VIDE = {
  description: "",
  mode: "maritime",
  expéditeur_nom: "",
  expéditeur_pays: "",
  destinataire_nom: "",
  destinataire_ville: "",
  poids_kg: 0,
  valeur_declaree: 0,
  frais: 0,
  client_id: "",
  date_envoi: "",
  note: "",
};

/**
 * Les envois du quai : une fiche par colis — la description, le mode, les
 * deux bouts, le poids, la valeur, les frais. Le parcours avance d'un
 * geste : chaque passage laisse sa ligne dans le suivi.
 */
export function EnvoisGerant({ envois, clients, langue }: Props) {
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

  const affiches = envois.filter((un) => {
    if (filtre && un.statut !== filtre) return false;
    if (!recherche.trim()) return true;
    const motif = recherche.trim().toLowerCase();
    return (
      un.numero_suivi.toLowerCase().includes(motif) ||
      un.description.toLowerCase().includes(motif) ||
      un.destinataire_nom.toLowerCase().includes(motif) ||
      un.destinataire_ville.toLowerCase().includes(motif) ||
      un.expéditeur_nom.toLowerCase().includes(motif) ||
      un.note.toLowerCase().includes(motif)
    );
  });

  async function ajouter() {
    setEnCours("ajout");
    setErreur(null);
    try {
      const corps: EnvoiEntree = {
        description: form.description,
        mode: form.mode,
        expéditeur_nom: form.expéditeur_nom,
        expéditeur_pays: form.expéditeur_pays,
        destinataire_nom: form.destinataire_nom,
        destinataire_ville: form.destinataire_ville,
        poids_kg: form.poids_kg,
        valeur_declaree: form.valeur_declaree,
        frais: form.frais,
        client_id: form.client_id ? Number(form.client_id) : null,
        date_envoi: form.date_envoi || null,
        note: form.note,
      };
      await ecrire<Envoi>("/envois", { body: corps, langue });
      setForm(VIDE);
      setOuvert(false);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  async function avancer(un: Envoi, statut: string, note: string) {
    setEnCours(un.id);
    setErreurs((actuelles) => ({ ...actuelles, [un.id]: "" }));
    try {
      await ecrire<Envoi>(`/envois/${un.id}/suivi`, {
        body: { statut, note },
        langue,
      });
      routeur.refresh();
    } catch (e) {
      setErreurs((actuelles) => ({
        ...actuelles,
        [un.id]: e instanceof ErreurChantier ? e.message : t("commun.horsLigne"),
      }));
      setEnCours(null);
    }
  }

  const suivant = (statut: string): string => {
    const ordre = ["en_attente", "en_transit", "en_douane", "livre"];
    const i = ordre.indexOf(statut);
    return i >= 0 && i < ordre.length - 1 ? ordre[i + 1] : "";
  };

  return (
    <div className="cadc-pile">
      <div className="cadc-acts">
        <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={() => setOuvert((v) => !v)}>
          {ouvert ? t("commun.fermer") : t("envois.nouveau")}
        </button>
      </div>

      {ouvert ? (
        <div className="cadc-carte cadc-pile">
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("envois.description")}</span>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={200} autoComplete="off" />
          </label>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("envois.mode")}</span>
              <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                {MODES.map((un) => (
                  <option key={un} value={un}>{t(`mode.${un}`)}</option>
                ))}
              </select>
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("envois.date_envoi")}</span>
              <input type="date" value={form.date_envoi} onChange={(e) => setForm({ ...form, date_envoi: e.target.value })} />
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("envois.expediteur")}</span>
              <input value={form.expéditeur_nom} onChange={(e) => setForm({ ...form, expéditeur_nom: e.target.value })} maxLength={160} autoComplete="off" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("envois.pays")}</span>
              <input value={form.expéditeur_pays} onChange={(e) => setForm({ ...form, expéditeur_pays: e.target.value })} maxLength={60} autoComplete="off" placeholder="France, Chine, Dubaï…" />
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("envois.destinataire")}</span>
              <input value={form.destinataire_nom} onChange={(e) => setForm({ ...form, destinataire_nom: e.target.value })} maxLength={160} autoComplete="off" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("envois.ville")}</span>
              <input value={form.destinataire_ville} onChange={(e) => setForm({ ...form, destinataire_ville: e.target.value })} maxLength={80} autoComplete="off" />
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("envois.poids")}</span>
              <input type="number" min={0} max={100000} step="0.1" value={form.poids_kg || ""} onChange={(e) => setForm({ ...form, poids_kg: Number(e.target.value) || 0 })} inputMode="decimal" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("envois.client")}</span>
              <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
                <option value="">—</option>
                {clients.map((un) => (
                  <option key={un.id} value={un.id}>{un.nom}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("envois.valeur")}</span>
              <input type="number" min={0} max={10000000000} value={form.valeur_declaree || ""} onChange={(e) => setForm({ ...form, valeur_declaree: Number(e.target.value) || 0 })} inputMode="numeric" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("envois.frais")}</span>
              <input type="number" min={0} max={10000000000} value={form.frais || ""} onChange={(e) => setForm({ ...form, frais: Number(e.target.value) || 0 })} inputMode="numeric" />
            </label>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("envois.note")}</span>
            <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={600} rows={2} />
          </label>
          {erreur ? (
            <span className="cadc-note cadc-note--rouge" role="status">{erreur}</span>
          ) : null}
          <div className="cadc-acts">
            <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={ajouter} disabled={enCours === "ajout"}>
              {enCours === "ajout" ? t("commun.ecriture") : t("envois.nouveau")}
            </button>
          </div>
        </div>
      ) : null}

      <div className="cadc-grille">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("envois.recherche")}</span>
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder={t("envois.recherche-aide")} autoComplete="off" />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("envois.statut")}</span>
          <select value={filtre} onChange={(e) => setFiltre(e.target.value)}>
            <option value="">{t("envois.tous")}</option>
            {STATUTS.map((un) => (
              <option key={un} value={un}>{t(`statut.${un}`)}</option>
            ))}
          </select>
        </label>
      </div>

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {affiches.map((un) => {
          const etape = suivant(un.statut);
          return (
            <li
              className={`cadc-ligne${un.statut === "en_attente" ? " appel--file" : ""}${un.statut === "bloque" || un.statut === "annule" ? " appel--perdu" : ""}${un.statut === "livre" ? " appel--clos" : ""}`}
              key={un.id}
            >
              <span className="cadc-ligne__nom">
                {un.description}
                <small>
                  {un.numero_suivi} · {t(`mode.${un.mode}`)} · {f.jourDate(un.date_envoi)}
                  {un.client ? ` · ${un.client}` : ""}
                </small>
                <small>
                  {un.expéditeur_pays || un.expéditeur_nom || "—"} → {un.destinataire_ville || un.destinataire_nom || "—"}
                  {un.poids_kg > 0 ? ` · ${un.poids_kg} ${t("envois.kg")}` : ""}
                  {un.date_livraison ? ` · ${t("envois.livre_le")} ${f.jourDate(un.date_livraison)}` : ""}
                </small>
                {un.suivi.length > 0 ? (
                  <small>
                    {un.suivi.map((ligne) => `${t(`statut.${ligne.statut}`)}${ligne.note ? ` (${ligne.note})` : ""}`).join(" → ")}
                  </small>
                ) : null}
                {un.note ? <small>{un.note}</small> : null}
              </span>
              <span className="cadc-ligne__valeur">
                {etape ? (
                  <button
                    type="button"
                    className="cadc-bouton cadc-bouton--petit cadc-bouton--premier"
                    disabled={enCours === un.id}
                    onClick={() => avancer(un, etape, "")}
                  >
                    {t("envois.avancer")} · {t(`statut.${etape}`)}
                  </button>
                ) : null}
                {un.statut === "bloque" || un.statut === "annule" ? (
                  <button
                    type="button"
                    className="cadc-bouton cadc-bouton--petit cadc-bouton--doux"
                    disabled={enCours === un.id}
                    onClick={() => avancer(un, "en_attente", "Remis en file.")}
                  >
                    {t("statut.en_attente")}
                  </button>
                ) : null}
                {erreurs[un.id] ? (
                  <span className="cadc-note cadc-note--rouge" role="status">{erreurs[un.id]}</span>
                ) : null}
              </span>
            </li>
          );
        })}
        {affiches.length === 0 ? (
          <li className="cadc-note">{t("commun.aucun")}</li>
        ) : null}
      </ul>
    </div>
  );
}
