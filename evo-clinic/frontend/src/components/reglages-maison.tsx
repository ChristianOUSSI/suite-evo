"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { VILLES } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import type { Organisation, OrganisationEntree } from "@/lib/types";

type Props = {
  organisation: Organisation;
  langue: string;
  responsable: boolean;
};

/**
 * La maison et ses coordonnées.
 *
 * Rien ici n'efface une journée pointée : les réglages ne touchent que la
 * carte de visite, pas le cahier.
 */
export function ReglagesMaison({ organisation, langue, responsable }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const [champ, setChamp] = useState<OrganisationEntree>({
    nom: organisation.nom,
    ville: organisation.ville,
    quartier: organisation.quartier,
    telephone: organisation.telephone,
  });
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [ecrit, setEcrit] = useState(false);

  const quartiers = VILLES.find((un) => un.nom === champ.ville)?.quartiers ?? [];

  function setter<K extends keyof OrganisationEntree>(cle: K) {
    return (valeur: OrganisationEntree[K]) => {
      setChamp((actuel) => ({ ...actuel, [cle]: valeur }));
      setEcrit(false);
    };
  }

  async function enregistrer() {
    setEnCours(true);
    setErreur(null);
    try {
      await ecrire<Organisation>("/organisation", {
        method: "PUT",
        body: champ,
        langue,
      });
      setEcrit(true);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="cadc-pile">
      <div className="cadc-grille">
        <label className="cadc-champ" style={{ gridColumn: "1 / -1" }}>
          <span className="cadc-champ__titre">{t("reglages.nom")}</span>
          <input
            value={champ.nom}
            onChange={(e) => setter("nom")(e.target.value)}
            maxLength={160}
            disabled={!responsable}
          />
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
