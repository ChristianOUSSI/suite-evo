"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { formats } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import { STATUTS_BIEN, TYPES_BIEN } from "@/lib/constantes";
import type { Bien, BienEntree, StatutBien } from "@/lib/types";

type Props = { biens: Bien[]; langue: string };

const VIDE = {
  type: "appartement" as const,
  titre: "",
  ville: "Douala",
  quartier: "",
  prix: "",
  surface_m2: "",
  chambres: "",
  description: "",
  proprietaire_nom: "",
  proprietaire_telephone: "",
  note: "",
};

/**
 * Les biens de l'agence : une fiche par bien, son prix, son propriétaire,
 * son statut. L'agent fiche le bien du jour ; le responsable seul touche
 * au prix et au propriétaire — le reste se suit.
 */
export function BiensGerant({ biens, langue }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const f = formats(langue);
  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState(VIDE);
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreurs, setErreurs] = useState<Record<number, string>>({});
  const [seulementDisponibles, setSeulementDisponibles] = useState(false);
  const [enCours, setEnCours] = useState<number | "ajout" | null>(null);

  const affiches = seulementDisponibles ? biens.filter((un) => un.statut === "disponible") : biens;

  async function ajouter() {
    setEnCours("ajout");
    setErreur(null);
    try {
      const corps: BienEntree = {
        type: form.type,
        titre: form.titre,
        ville: form.ville,
        quartier: form.quartier,
        prix: parseInt(form.prix.replace(/\D/g, ""), 10) || 0,
        surface_m2: parseInt(form.surface_m2, 10) || 0,
        chambres: parseInt(form.chambres, 10) || 0,
        description: form.description,
        proprietaire_nom: form.proprietaire_nom,
        proprietaire_telephone: form.proprietaire_telephone
          ? `+237${form.proprietaire_telephone}`
          : "",
        note: form.note,
      };
      await ecrire<Bien>("/biens", { body: corps, langue });
      setForm(VIDE);
      setOuvert(false);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  async function corriger(bien: Bien, patch: Record<string, unknown>) {
    setEnCours(bien.id);
    setErreurs((actuelles) => ({ ...actuelles, [bien.id]: "" }));
    try {
      await ecrire<Bien>(`/biens/${bien.id}`, { method: "PATCH", body: patch, langue });
      routeur.refresh();
    } catch (e) {
      setErreurs((actuelles) => ({
        ...actuelles,
        [bien.id]: e instanceof ErreurChantier ? e.message : t("commun.horsLigne"),
      }));
      setEnCours(null);
    }
  }

  return (
    <div className="cadc-pile">
      <div className="cadc-acts">
        <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={() => setOuvert((v) => !v)}>
          {ouvert ? t("commun.fermer") : t("biens.nouveau")}
        </button>
        <button
          type="button"
          className={`cadc-bouton ${seulementDisponibles ? "cadc-bouton--premier" : "cadc-bouton--doux"}`}
          onClick={() => setSeulementDisponibles((v) => !v)}
        >
          {t("biens.disponibles")}
        </button>
      </div>

      {ouvert ? (
        <div className="cadc-carte cadc-pile">
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("biens.type")}</span>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })}>
                {TYPES_BIEN.map((un) => (
                  <option key={un} value={un}>{t(`type.${un}`)}</option>
                ))}
              </select>
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("biens.titre-bien")}</span>
              <input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} maxLength={160} autoComplete="off" placeholder={langue === "en" ? "e.g. F3 Akwa, garden" : "ex. F3 Akwa, jardin"} />
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("biens.ville")}</span>
              <input value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} maxLength={60} autoComplete="off" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("biens.quartier")}</span>
              <input value={form.quartier} onChange={(e) => setForm({ ...form, quartier: e.target.value })} maxLength={80} autoComplete="off" placeholder={langue === "en" ? "e.g. Akwa, Bonapriso" : "ex. Akwa, Bonapriso"} />
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("biens.prix")}</span>
              <input value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value.replace(/\D/g, "") })} inputMode="numeric" placeholder="12 000 000" />
            </label>
            <div className="cadc-grille">
              <label className="cadc-champ">
                <span className="cadc-champ__titre">{t("biens.surface")}</span>
                <input value={form.surface_m2} onChange={(e) => setForm({ ...form, surface_m2: e.target.value.replace(/\D/g, "") })} inputMode="numeric" />
              </label>
              <label className="cadc-champ">
                <span className="cadc-champ__titre">{t("biens.chambres")}</span>
                <input value={form.chambres} onChange={(e) => setForm({ ...form, chambres: e.target.value.replace(/\D/g, "").slice(0, 2) })} inputMode="numeric" />
              </label>
            </div>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("biens.description")}</span>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={600} autoComplete="off" />
          </label>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("biens.proprietaire")}</span>
              <input value={form.proprietaire_nom} onChange={(e) => setForm({ ...form, proprietaire_nom: e.target.value })} maxLength={160} autoComplete="off" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("biens.telephone")}</span>
              <span className="cadc-champ__prefixe">
                <span>+237</span>
                <input
                  value={form.proprietaire_telephone}
                  onChange={(e) => setForm({ ...form, proprietaire_telephone: e.target.value.replace(/[^0-9]/g, "").slice(0, 9) })}
                  inputMode="tel"
                  placeholder="6 XX XX XX XX"
                />
              </span>
            </label>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("biens.note")}</span>
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={600} autoComplete="off" />
          </label>
          {erreur ? <p className="cadc-note cadc-note--rouge" role="alert">{erreur}</p> : null}
          <div className="cadc-acts">
            <button
              type="button"
              className="cadc-bouton cadc-bouton--premier"
              disabled={enCours !== null || form.prix === ""}
              onClick={ajouter}
            >
              {enCours === "ajout" ? t("commun.ecriture") : t("biens.nouveau")}
            </button>
          </div>
        </div>
      ) : null}

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {affiches.map((bien) => (
          <li className={`cadc-ligne${bien.statut === "disponible" ? " eleve--dette" : ""}${bien.statut === "retire" ? " ouvrier--sorti" : ""}`} key={bien.id}>
            <span className="cadc-ligne__nom">
              {bien.titre || `${t(`type.${bien.type}`)} — ${bien.quartier || bien.ville}`}
              <small>
                {t(`type.${bien.type}`)} · {bien.ville}{bien.quartier ? `, ${bien.quartier}` : ""}
                {bien.surface_m2 ? ` · ${bien.surface_m2} ${t("biens.m2")}` : ""}
                {bien.chambres ? ` · ${bien.chambres} ${langue === "en" ? "bedrooms" : "chambres"}` : ""}
                {bien.proprietaire_nom ? ` · ${bien.proprietaire_nom}` : ""}
                {bien.proprietaire_telephone_display ? ` · ${bien.proprietaire_telephone_display}` : ""}
              </small>
            </span>
            <span className="cadc-ligne__valeur">
              <strong>{f.fcfa(bien.prix)}</strong>
              <br />
              <select
                value={bien.statut}
                disabled={enCours === bien.id}
                onChange={(e) => corriger(bien, { statut: e.target.value as StatutBien })}
                aria-label={t("biens.type")}
              >
                {STATUTS_BIEN.map((un) => (
                  <option key={un} value={un}>{t(`statut.${un}`)}</option>
                ))}
              </select>
              <br />
              <small>
                {bien.visites} {t("biens.visites")} · {bien.demandes} {t("biens.demandes")}
                {bien.agent ? ` · ${bien.agent}` : ""}
              </small>
              {erreurs[bien.id] ? (
                <span className="cadc-note cadc-note--rouge" role="status">{erreurs[bien.id]}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
