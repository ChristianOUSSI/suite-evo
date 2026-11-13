"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { formats, RAILS, VILLES } from "@/lib/format";
import { traduire } from "@/lib/langue";
import { ecrire } from "@/lib/client-api";
import { ErreurCercle } from "@/lib/errors";
import type { Groupe, GroupeEntree } from "@/lib/types";

type Props = {
  groupe: Groupe;
  langue: string;
  gestion: boolean;
};

const RYTHMES = ["hebdo", "quinzaine", "mensuel"] as const;

/** Les trois rails que ce produit sait encaisser, dans l'ordre du comptoir. */
const PORTES = ["especes", "momo_mtn", "momo_orange"] as const;

const CHAMP_RAIL: Record<(typeof PORTES)[number], keyof GroupeEntree> = {
  especes: "especes_actifs",
  momo_mtn: "momo_actif",
  momo_orange: "orange_actif",
};

/**
 * Les réglages du cercle, écrits en une fois.
 *
 * Tout le modèle repart au serveur : un PUT qui ne porterait que trois champs
 * en effacerait d'autres. La ville décide de la liste des quartiers, et le
 * quartier se corrige à la main s'il n'y est pas encore.
 */
export function ReglagesGroupe({ groupe, langue, gestion }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const [champ, setChamp] = useState<GroupeEntree>({
    nom: groupe.nom,
    ville: groupe.ville,
    quartier: groupe.quartier,
    frequence: groupe.frequence,
    jour_ancre: groupe.jour_ancre,
    cotisation: groupe.cotisation,
    penalite: groupe.penalite,
    telephone: groupe.telephone,
    mot_du_groupe: groupe.mot_du_groupe,
    momo_actif: groupe.momo_actif,
    orange_actif: groupe.orange_actif,
    especes_actifs: groupe.especes_actifs,
  });
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [ecrit, setEcrit] = useState(false);

  const quartiers = VILLES.find((un) => un.nom === champ.ville)?.quartiers ?? [];
  const code = formats(langue).langue;

  function setter<K extends keyof GroupeEntree>(cle: K) {
    return (valeur: GroupeEntree[K]) => {
      setChamp((actuel) => ({ ...actuel, [cle]: valeur }));
      setEcrit(false);
    };
  }

  async function enregistrer() {
    setEnCours(true);
    setErreur(null);
    try {
      await ecrire<Groupe>("/groupe", { method: "PUT", body: champ, langue });
      setEcrit(true);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurCercle ? e.message : t("commun.horsLigne"));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="cadc-pile">
      <div className="cadc-grille">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("reglages.nom")}</span>
          <input
            value={champ.nom}
            onChange={(e) => setter("nom")(e.target.value)}
            maxLength={160}
            disabled={!gestion}
          />
        </label>

        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("reglages.ville")}</span>
          <select
            value={champ.ville}
            onChange={(e) => {
              setter("ville")(e.target.value);
              setter("quartier")("");
            }}
            disabled={!gestion}
          >
            {VILLES.map((un) => (
              <option key={un.nom} value={un.nom}>
                {un.nom} · {un.region}
              </option>
            ))}
          </select>
        </label>

        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("reglages.quartier")}</span>
          <input
            value={champ.quartier}
            onChange={(e) => setter("quartier")(e.target.value)}
            list="cadc-quartiers"
            maxLength={80}
            disabled={!gestion}
          />
          <datalist id="cadc-quartiers">
            {quartiers.map((un) => (
              <option key={un} value={un} />
            ))}
          </datalist>
          <span className="cadc-champ__aide">
            {quartiers.length} {langue === "en" ? "known quartiers" : "quartiers connus"}
          </span>
        </label>
      </div>

      <div className="cadc-grille">
        <fieldset className="cadc-ensemble">
          <legend>{t("cercle.rythme")}</legend>
          {RYTHMES.map((un) => (
            <label className="cadc-choix" key={un}>
              <input
                type="radio"
                name="frequence"
                checked={champ.frequence === un}
                onChange={() => setter("frequence")(un)}
                disabled={!gestion}
              />
              <span className="cadc-choix__boite" aria-hidden />
              <span className="cadc-choix__texte">{t(`rythme.${un}`)}</span>
            </label>
          ))}
        </fieldset>

        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("reglages.jour")}</span>
          <input
            type="number"
            min={1}
            max={28}
            value={champ.jour_ancre}
            onChange={(e) => setter("jour_ancre")(Number(e.target.value))}
            disabled={!gestion}
          />
          <span className="cadc-champ__aide">{t("reglages.jour-aide")}</span>
        </label>
      </div>

      <div className="cadc-grille">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("reglages.cotisation")}</span>
          <input
            type="number"
            min={100}
            step={500}
            value={champ.cotisation}
            onChange={(e) => setter("cotisation")(Number(e.target.value))}
            disabled={!gestion}
          />
          <span className="cadc-champ__aide">{t("reglages.montant-aide")}</span>
        </label>

        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("reglages.penalite")}</span>
          <input
            type="number"
            min={0}
            step={100}
            value={champ.penalite}
            onChange={(e) => setter("penalite")(Number(e.target.value))}
            disabled={!gestion}
          />
          <span className="cadc-champ__aide">{t("reglages.penalite-aide")}</span>
        </label>

        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("reglages.telephone")}</span>
          <span className="cadc-champ__prefixe">
            <span>+237</span>
            <input
              value={champ.telephone.replace(/^\+237\s?/, "").replace(/[^0-9]/g, "").slice(0, 9)}
              onChange={(e) =>
                setter("telephone")(
                  e.target.value.replace(/[^0-9]/g, "").slice(0, 9),
                )
              }
              inputMode="tel"
              placeholder="6 XX XX XX XX"
              aria-label={t("reglages.telephone")}
              disabled={!gestion}
            />
          </span>
          <span className="cadc-champ__aide">{t("membres.telephone-aide")}</span>
        </label>
      </div>

      <fieldset className="cadc-ensemble">
        <legend>{t("reglages.rails")}</legend>
        {PORTES.map((cle) => {
          const rail = RAILS.find((un) => un.cle === cle);
          if (!rail) return null;
          const actif =
            cle === "especes"
              ? champ.especes_actifs
              : cle === "momo_mtn"
                ? champ.momo_actif
                : champ.orange_actif;
          return (
            <label className="cadc-choix" key={cle}>
              <input
                type="checkbox"
                checked={actif}
                onChange={(e) =>
                  setChamp((actuel) => ({ ...actuel, [CHAMP_RAIL[cle]]: e.target.checked }))
                }
                disabled={!gestion}
              />
              <span className="cadc-choix__boite" aria-hidden />
              <span className="cadc-choix__texte">
                {rail.label[code]}
                <small>{rail.aide[code]}</small>
              </span>
            </label>
          );
        })}
        <p className="cadc-champ__aide">{t("reglages.aideRails")}</p>
      </fieldset>

      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("cercle.mot")}</span>
        <textarea
          value={champ.mot_du_groupe}
          onChange={(e) => setter("mot_du_groupe")(e.target.value)}
          maxLength={400}
          disabled={!gestion}
        />
      </label>

      {gestion ? (
        <div className="cadc-acts">
          <button
            type="button"
            className="cadc-bouton cadc-bouton--premier cadc-bouton--grand"
            onClick={enregistrer}
            disabled={enCours || champ.nom.trim().length < 2}
          >
            {enCours ? t("reglages.enCours") : t("reglages.enregistrer")}
          </button>
          {ecrit && !enCours ? (
            <span className="cadc-note cadc-note--vert" role="status">
              {t("reglages.ecrit")}
            </span>
          ) : null}
          {erreur ? (
            <span className="cadc-note cadc-note--rouge" role="status">
              {erreur}
            </span>
          ) : null}
        </div>
      ) : (
        <p className="cadc-note">{t("commun.droitManquant")}</p>
      )}
    </div>
  );
}
