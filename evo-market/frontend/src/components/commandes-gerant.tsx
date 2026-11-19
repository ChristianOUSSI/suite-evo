"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { formats } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import { MOYENS, STATUTS_COMMANDE } from "@/lib/constantes";
import type { Annonce, Commande, CommandeEntree } from "@/lib/types";

type Props = { commandes: Commande[]; annonces: Annonce[]; langue: string };

const VIDE = {
  annonce_id: "",
  quantite: "1",
  acheteur_nom: "",
  acheteur_telephone: "",
  moyen: "especes",
  date: "",
  note: "",
};

/**
 * Les commandes de la boutique : une vente par ligne - l'annonce, la
 * quantité, l'acheteur, le moyen, le statut. Confirmer descend le stock,
 * annuler le rend ; le montant est figé au moment de la vente.
 */
export function CommandesGerant({ commandes, annonces, langue }: Props) {
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

  const enLigne = annonces.filter((un) => un.statut === "en_ligne" && un.stock > 0);

  const affichees = commandes.filter((un) => {
    if (filtre && un.statut !== filtre) return false;
    if (!recherche.trim()) return true;
    const motif = recherche.trim().toLowerCase();
    return (
      un.annonce.toLowerCase().includes(motif) ||
      un.acheteur_nom.toLowerCase().includes(motif)
    );
  });

  async function ajouter() {
    setEnCours("ajout");
    setErreur(null);
    try {
      const corps: CommandeEntree = {
        annonce_id: parseInt(form.annonce_id, 10),
        quantite: parseInt(form.quantite.replace(/\D/g, ""), 10) || 1,
        acheteur_nom: form.acheteur_nom,
        acheteur_telephone: form.acheteur_telephone ? `+237${form.acheteur_telephone}` : "",
        moyen: form.moyen,
        date: form.date || null,
        note: form.note,
      };
      await ecrire<Commande>("/commandes", { body: corps, langue });
      setForm(VIDE);
      setOuvert(false);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  async function corriger(un: Commande, patch: Record<string, unknown>) {
    setEnCours(un.id);
    setErreurs((actuelles) => ({ ...actuelles, [un.id]: "" }));
    try {
      await ecrire<Commande>(`/commandes/${un.id}`, { method: "PATCH", body: patch, langue });
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
          {ouvert ? t("commun.fermer") : t("commandes.nouvelle")}
        </button>
      </div>

      {ouvert ? (
        <div className="cadc-carte cadc-pile">
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("commandes.annonce")}</span>
            <select value={form.annonce_id} onChange={(e) => setForm({ ...form, annonce_id: e.target.value })}>
              <option value="">-</option>
              {enLigne.map((un) => (
                <option key={un.id} value={un.id}>
                  {un.titre} · {f.fcfa(un.prix)} · {un.stock}
                </option>
              ))}
            </select>
          </label>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("commandes.quantite")}</span>
              <input value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value.replace(/\D/g, "") })} inputMode="numeric" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("commandes.date")}</span>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </label>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("commandes.acheteur")}</span>
            <input value={form.acheteur_nom} onChange={(e) => setForm({ ...form, acheteur_nom: e.target.value })} maxLength={160} autoComplete="off" />
          </label>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("commandes.telephone")}</span>
              <span className="cadc-champ__prefixe">
                <span>+237</span>
                <input
                  value={form.acheteur_telephone}
                  onChange={(e) => setForm({ ...form, acheteur_telephone: e.target.value.replace(/[^0-9]/g, "").slice(0, 9) })}
                  inputMode="tel"
                  placeholder="6 XX XX XX XX"
                />
              </span>
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("commandes.moyen")}</span>
              <select value={form.moyen} onChange={(e) => setForm({ ...form, moyen: e.target.value })}>
                {MOYENS.map((un) => (
                  <option key={un} value={un}>{t(`moyen.${un}`)}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("commandes.note")}</span>
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={600} autoComplete="off" />
          </label>
          {erreur ? <p className="cadc-note cadc-note--rouge" role="alert">{erreur}</p> : null}
          <div className="cadc-acts">
            <button
              type="button"
              className="cadc-bouton cadc-bouton--premier"
              disabled={enCours !== null || !form.annonce_id}
              onClick={ajouter}
            >
              {enCours === "ajout" ? t("commun.ecriture") : t("commandes.nouvelle")}
            </button>
          </div>
        </div>
      ) : null}

      <div className="cadc-grille">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("commandes.recherche")}</span>
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder={t("commandes.recherche-aide")} autoComplete="off" />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("commandes.moyen")}</span>
          <select value={filtre} onChange={(e) => setFiltre(e.target.value)}>
            <option value="">{t("commandes.toutes")}</option>
            {STATUTS_COMMANDE.map((un) => (
              <option key={un} value={un}>{t(`statut_commande.${un}`)}</option>
            ))}
          </select>
        </label>
      </div>

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {affichees.map((un) => (
          <li className={`cadc-ligne${un.statut === "livree" ? " commande--livree" : ""}${un.statut === "annulee" ? " ouvrier--sorti" : ""}`} key={un.id}>
            <span className="cadc-ligne__nom">
              {un.annonce}
              <small>
                {un.quantite} × {f.fcfa(un.prix_unitaire)} · {f.jourDate(un.date)}
                {un.acheteur_nom ? ` · ${un.acheteur_nom}` : ""}
                {un.acheteur_telephone_display ? ` · ${un.acheteur_telephone_display}` : ""}
                {un.cree_par ? ` · ${un.cree_par}` : ""}
              </small>
              {un.note ? <small>{un.note}</small> : null}
            </span>
            <span className="cadc-ligne__valeur">
              <strong>{f.fcfa(un.montant)}</strong>
              <br />
              <small>{t(`moyen.${un.moyen}`)}</small>
              <br />
              <select
                value={un.statut}
                disabled={enCours === un.id}
                onChange={(e) => corriger(un, { statut: e.target.value })}
              >
                {STATUTS_COMMANDE.map((s) => (
                  <option key={s} value={s}>{t(`statut_commande.${s}`)}</option>
                ))}
              </select>
              {erreurs[un.id] ? (
                <span className="cadc-note cadc-note--rouge" role="status">{erreurs[un.id]}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
