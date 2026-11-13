"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { formats, VILLES } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import { CATEGORIES, STATUTS_ANNONCE } from "@/lib/constantes";
import type { Annonce, AnnonceEntree } from "@/lib/types";

type Props = { annonces: Annonce[]; langue: string };

const VIDE = {
  titre: "",
  categorie: "autre",
  description: "",
  prix: "",
  stock: "1",
  ville: "Douala",
  quartier: "",
  vendeur_nom: "",
  vendeur_telephone: "",
  note: "",
};

/**
 * Les annonces de la boutique : une fiche par article, son prix FCFA,
 * son stock, son vendeur. Le statut avance d'un geste — en ligne,
 * vendu, retiré — et la page publique ne montre que les en ligne.
 */
export function AnnoncesGerant({ annonces, langue }: Props) {
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

  const affiches = annonces.filter((un) => {
    if (filtre && un.statut !== filtre) return false;
    if (!recherche.trim()) return true;
    const motif = recherche.trim().toLowerCase();
    return (
      un.titre.toLowerCase().includes(motif) ||
      un.description.toLowerCase().includes(motif) ||
      un.quartier.toLowerCase().includes(motif) ||
      un.vendeur_nom.toLowerCase().includes(motif)
    );
  });

  async function ajouter() {
    setEnCours("ajout");
    setErreur(null);
    try {
      const corps: AnnonceEntree = {
        titre: form.titre,
        categorie: form.categorie,
        description: form.description,
        prix: parseInt(form.prix.replace(/\D/g, ""), 10) || 0,
        stock: parseInt(form.stock.replace(/\D/g, ""), 10) || 0,
        ville: form.ville,
        quartier: form.quartier,
        vendeur_nom: form.vendeur_nom,
        vendeur_telephone: form.vendeur_telephone ? `+237${form.vendeur_telephone}` : "",
        note: form.note,
      };
      await ecrire<Annonce>("/annonces", { body: corps, langue });
      setForm(VIDE);
      setOuvert(false);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  async function corriger(un: Annonce, patch: Record<string, unknown>) {
    setEnCours(un.id);
    setErreurs((actuelles) => ({ ...actuelles, [un.id]: "" }));
    try {
      await ecrire<Annonce>(`/annonces/${un.id}`, { method: "PATCH", body: patch, langue });
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
          {ouvert ? t("commun.fermer") : t("annonces.nouvelle")}
        </button>
      </div>

      {ouvert ? (
        <div className="cadc-carte cadc-pile">
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("annonces.titre_champ")}</span>
            <input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} maxLength={200} autoComplete="off" />
          </label>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("annonces.categorie")}</span>
              <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
                {CATEGORIES.map((un) => (
                  <option key={un} value={un}>{t(`categorie.${un}`)}</option>
                ))}
              </select>
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("annonces.stock")}</span>
              <input value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value.replace(/\D/g, "") })} inputMode="numeric" />
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("annonces.prix")}</span>
              <input value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value.replace(/\D/g, "") })} inputMode="numeric" placeholder="25 000" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("annonces.ville")}</span>
              <select value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })}>
                {VILLES.map((un) => (
                  <option key={un.nom} value={un.nom}>{un.nom}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("annonces.quartier")}</span>
            <input value={form.quartier} onChange={(e) => setForm({ ...form, quartier: e.target.value })} maxLength={80} autoComplete="off" list="cadc-quartiers-annonce" />
            <datalist id="cadc-quartiers-annonce">
              {(VILLES.find((un) => un.nom === form.ville)?.quartiers ?? []).map((un) => (
                <option key={un} value={un} />
              ))}
            </datalist>
          </label>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("annonces.vendeur")}</span>
              <input value={form.vendeur_nom} onChange={(e) => setForm({ ...form, vendeur_nom: e.target.value })} maxLength={160} autoComplete="off" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("annonces.telephone")}</span>
              <span className="cadc-champ__prefixe">
                <span>+237</span>
                <input
                  value={form.vendeur_telephone}
                  onChange={(e) => setForm({ ...form, vendeur_telephone: e.target.value.replace(/[^0-9]/g, "").slice(0, 9) })}
                  inputMode="tel"
                  placeholder="6 XX XX XX XX"
                />
              </span>
            </label>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("annonces.description")}</span>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={3000} autoComplete="off" />
          </label>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("annonces.note")}</span>
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={600} autoComplete="off" />
          </label>
          {erreur ? <p className="cadc-note cadc-note--rouge" role="alert">{erreur}</p> : null}
          <div className="cadc-acts">
            <button
              type="button"
              className="cadc-bouton cadc-bouton--premier"
              disabled={enCours !== null || form.titre.trim().length < 2}
              onClick={ajouter}
            >
              {enCours === "ajout" ? t("commun.ecriture") : t("annonces.nouvelle")}
            </button>
          </div>
        </div>
      ) : null}

      <div className="cadc-grille">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("annonces.recherche")}</span>
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder={t("annonces.recherche-aide")} autoComplete="off" />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("annonces.categorie")}</span>
          <select value={filtre} onChange={(e) => setFiltre(e.target.value)}>
            <option value="">{t("pub.cat-choix")}</option>
            {STATUTS_ANNONCE.map((un) => (
              <option key={un} value={un}>{t(`statut_annonce.${un}`)}</option>
            ))}
          </select>
        </label>
      </div>

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {affiches.map((un) => (
          <li className={`cadc-ligne${un.statut === "vendu" ? " commande--livree" : ""}${un.statut === "retire" ? " ouvrier--sorti" : ""}`} key={un.id}>
            <span className="cadc-ligne__nom">
              {un.titre}
              <small>
                {t(`categorie.${un.categorie}`)} · {un.quartier || un.ville}
                {un.vendeur_nom ? ` · ${un.vendeur_nom}` : ""}
                {un.vendeur_telephone_display ? ` · ${un.vendeur_telephone_display}` : ""}
                {un.stock <= 0 ? ` · ${t("annonces.en_rupture")}` : ` · ${un.stock}`}
                {un.commandes ? ` · ${un.commandes} ${t("annonces.commandes")}` : ""}
                {un.vendu ? ` · ${un.vendu} ${t("annonces.vendu")}` : ""}
              </small>
              {un.description ? <small>{un.description}</small> : null}
            </span>
            <span className="cadc-ligne__valeur">
              <strong>{f.fcfa(un.prix)}</strong>
              <br />
              <select
                value={un.statut}
                disabled={enCours === un.id}
                onChange={(e) => corriger(un, { statut: e.target.value })}
              >
                {STATUTS_ANNONCE.map((s) => (
                  <option key={s} value={s}>{t(`statut_annonce.${s}`)}</option>
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
