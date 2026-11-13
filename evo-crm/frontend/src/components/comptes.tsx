"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { ecrire } from "@/lib/client-api";
import { ErreurCarnet } from "@/lib/errors";
import type { Compte, CompteEntree, Role } from "@/lib/types";

const ROLES: Role[] = ["responsable", "vendeur"];

type Props = {
  comptes: Compte[];
  langue: string;
  responsable: boolean;
};

/**
 * Qui tient le carnet.
 *
 * Le rôle décide des gestes, pas l'adresse : le vendeur qui remplit le journal
 * depuis le dépôt ouvre le même carnet que la patronne, avec moins de portes.
 */
export function Comptes({ comptes, langue, responsable }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const [champ, setChamp] = useState<CompteEntree>({
    nom: "",
    email: "",
    mot_de_passe: "",
    role: "vendeur",
  });
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function ajouter() {
    setEnCours(true);
    setErreur(null);
    try {
      await ecrire<Compte>("/comptes", { body: champ, langue });
      setChamp({ nom: "", email: "", mot_de_passe: "", role: "vendeur" });
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurCarnet ? e.message : t("commun.horsLigne"));
      setEnCours(false);
    }
  }

  return (
    <div className="cadc-pile">
      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {comptes.map((compte) => (
          <li className="cadc-ligne" key={compte.id}>
            <span className="cadc-ligne__nom">
              {compte.nom}
              <small>{compte.email}</small>
            </span>
            <span className="cadc-badge cadc-badge--doux">{t(`role.${compte.role}`)}</span>
          </li>
        ))}
      </ul>

      {responsable ? (
        <>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("reglages.compte-nom")}</span>
              <input
                value={champ.nom}
                onChange={(e) => setChamp({ ...champ, nom: e.target.value })}
                maxLength={120}
                autoComplete="name"
              />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("reglages.compte-adresse")}</span>
              <input
                value={champ.email}
                onChange={(e) => setChamp({ ...champ, email: e.target.value })}
                maxLength={160}
                inputMode="email"
                autoComplete="email"
              />
            </label>
          </div>

          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("reglages.compte-mot")}</span>
              <input
                type="password"
                value={champ.mot_de_passe}
                onChange={(e) => setChamp({ ...champ, mot_de_passe: e.target.value })}
                maxLength={120}
                autoComplete="new-password"
              />
              <span className="cadc-champ__aide">{t("reglages.mot-aide", { n: 6 })}</span>
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("reglages.role")}</span>
              <select
                value={champ.role}
                onChange={(e) => setChamp({ ...champ, role: e.target.value as Role })}
              >
                {ROLES.map((un) => (
                  <option key={un} value={un}>
                    {t(`role.${un}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="cadc-acts">
            <button
              type="button"
              className="cadc-bouton cadc-bouton--premier"
              onClick={ajouter}
              disabled={enCours || champ.nom.trim().length < 2 || champ.email.trim() === ""}
            >
              {enCours ? t("commun.ecriture") : t("reglages.ajouterCompte")}
            </button>
            <span className="cadc-champ__aide">{t("reglages.aideComptes")}</span>
            {erreur ? (
              <span className="cadc-note cadc-note--rouge" role="status">
                {erreur}
              </span>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
