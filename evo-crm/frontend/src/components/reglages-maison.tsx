"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { VILLES } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurCarnet } from "@/lib/errors";
import type { Entreprise, EntrepriseEntree } from "@/lib/types";

type Props = {
  entreprise: Entreprise;
  langue: string;
  responsable: boolean;
};

/**
 * La maison et son seuil de silence.
 *
 * Le nombre de jours sans nouvelles est le seul réglage qui change ce que
 * l'écran montre : plus haut, la liste des oubliés se vide ; plus bas, elle
 * déborde. Rien ici n'efface une ligne du journal.
 */
export function ReglagesMaison({ entreprise, langue, responsable }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const [champ, setChamp] = useState<EntrepriseEntree>({
    nom: entreprise.nom,
    ville: entreprise.ville,
    quartier: entreprise.quartier,
    secteur: entreprise.secteur,
    telephone: entreprise.telephone,
    silence_jours: entreprise.silence_jours,
    rappel_jours: entreprise.rappel_jours,
  });
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [ecrit, setEcrit] = useState(false);

  const quartiers = VILLES.find((un) => un.nom === champ.ville)?.quartiers ?? [];

  function setter<K extends keyof EntrepriseEntree>(cle: K) {
    return (valeur: EntrepriseEntree[K]) => {
      setChamp((actuel) => ({ ...actuel, [cle]: valeur }));
      setEcrit(false);
    };
  }

  async function enregistrer() {
    setEnCours(true);
    setErreur(null);
    try {
      await ecrire<Entreprise>("/entreprise", {
        method: "PUT",
        body: champ,
        langue,
      });
      setEcrit(true);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurCarnet ? e.message : t("commun.horsLigne"));
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
            disabled={!responsable}
          />
        </label>

        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("reglages.secteur")}</span>
          <input
            value={champ.secteur}
            onChange={(e) => setter("secteur")(e.target.value)}
            maxLength={60}
            disabled={!responsable}
          />
          <span className="cadc-champ__aide">{t("reglages.secteur-aide")}</span>
        </label>
      </div>

      <div className="cadc-grille">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("reglages.ville")}</span>
          <select
            value={champ.ville}
            onChange={(e) => {
              setter("ville")(e.target.value);
              setter("quartier")("");
            }}
            disabled={!responsable}
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
            list="cadc-quartiers-maison"
            maxLength={80}
            disabled={!responsable}
          />
          <datalist id="cadc-quartiers-maison">
            {quartiers.map((un) => (
              <option key={un} value={un} />
            ))}
          </datalist>
        </label>

        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("reglages.telephone")}</span>
          <span className="cadc-champ__prefixe">
            <span>+237</span>
            <input
              value={champ.telephone.replace(/^\+?237/, "").replace(/[^0-9]/g, "").slice(0, 9)}
              onChange={(e) => setter("telephone")(e.target.value.replace(/[^0-9]/g, "").slice(0, 9))}
              inputMode="tel"
              placeholder="6 XX XX XX XX"
              aria-label={t("reglages.telephone")}
              disabled={!responsable}
            />
          </span>
        </label>
      </div>

      <div className="cadc-grille">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("reglages.silence")}</span>
          <input
            type="number"
            min={7}
            max={365}
            step={1}
            value={champ.silence_jours}
            onChange={(e) => setter("silence_jours")(Number(e.target.value))}
            disabled={!responsable}
          />
          <span className="cadc-champ__aide">{t("reglages.silence-aide")}</span>
        </label>

        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("reglages.rappel")}</span>
          <input
            type="number"
            min={1}
            max={90}
            step={1}
            value={champ.rappel_jours}
            onChange={(e) => setter("rappel_jours")(Number(e.target.value))}
            disabled={!responsable}
          />
          <span className="cadc-champ__aide">{t("reglages.rappel-aide")}</span>
        </label>
      </div>

      {responsable ? (
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
