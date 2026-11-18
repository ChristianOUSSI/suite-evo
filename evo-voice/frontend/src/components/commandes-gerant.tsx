"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { INTENTIONS, STATUTS_COMMANDE } from "@/lib/constantes";
import { ecrire, parametres } from "@/lib/client-api";
import { ErreurVoix } from "@/lib/errors";
import { formats } from "@/lib/format";
import { traduire } from "@/lib/langue";
import type { Commande, CommandeEntree } from "@/lib/types";


const OUVERTES = new Set(["recue", "interpretee"]);

export function CommandesGerant({
  commandes,
  langue,
}: {
  commandes: Commande[];
  langue: string;
}) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const f = formats(langue);

  const [champ, setChamp] = useState<CommandeEntree>({ transcription: "" });
  const [filtre, setFiltre] = useState("");
  const [statutFiltre, setStatutFiltre] = useState("");
  const [intentionFiltre, setIntentionFiltre] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [actives, setActives] = useState<Record<number, string>>({});

  async function rafraichir() {
    const qs = parametres({
      statut: statutFiltre || null,
      intention: intentionFiltre || null,
      recherche: filtre || null,
    });
    routeur.push(`/commandes${qs}`);
    routeur.refresh();
  }

  async function ajouter() {
    setEnCours(true);
    setErreur(null);
    try {
      await ecrire<Commande>("/commandes", { body: champ, langue });
      setChamp({ transcription: "" });
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurVoix ? e.message : t("commun.horsLigne"));
      setEnCours(false);
    }
  }

  async function executer(commande: Commande) {
    setActives({ ...actives, [commande.id]: "executer" });
    setErreur(null);
    try {
      await ecrire(`/commandes/${commande.id}/executer`, { body: {}, langue });
      setActives((a) => ({ ...a, [commande.id]: "" }));
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurVoix ? e.message : t("commun.horsLigne"));
      setActives((a) => ({ ...a, [commande.id]: "" }));
    }
  }

  async function annuler(commande: Commande) {
    setActives({ ...actives, [commande.id]: "annuler" });
    setErreur(null);
    try {
      await ecrire(`/commandes/${commande.id}`, {
        method: "PATCH",
        body: { statut: "annulee" },
        langue,
      });
      setActives((a) => ({ ...a, [commande.id]: "" }));
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurVoix ? e.message : t("commun.horsLigne"));
      setActives((a) => ({ ...a, [commande.id]: "" }));
    }
  }

  const ouvertes = commandes.filter((un) => OUVERTES.has(un.statut));
  const fermees = commandes.filter((un) => !OUVERTES.has(un.statut));

  function carte(commande: Commande) {
    const executable = OUVERTES.has(commande.statut);
    return (
      <li className={`appel commande commande--${commande.statut}`} key={commande.id}>
        <div className="appel__cat">
          {commande.intention
            ? t(`intention.${commande.intention}`)
            : t("commandes.sans_intention")}{" "}
          · {t(`cstatut.${commande.statut}`)}
        </div>
        <div className="appel__titre">« {commande.transcription} »</div>
        <div className="appel__lieu">
          {t("commandes.par")} {commande.auteur}
          {commande.maj_le ? ` · ${f.jourDate(commande.maj_le)}` : ""}
        </div>
        {commande.resultat ? <p className="commande__resultat">{commande.resultat}</p> : null}
        {executable ? (
          <div className="cadc-acts">
            <button
              type="button"
              className="cadc-bouton cadc-bouton--premier"
              disabled={actives[commande.id] === "executer"}
              onClick={() => executer(commande)}
            >
              {actives[commande.id] === "executer" ? t("commandes.execution") : t("commandes.executer")}
            </button>
            <button
              type="button"
              className="cadc-bouton cadc-bouton--doux"
              disabled={actives[commande.id] === "annuler"}
              onClick={() => annuler(commande)}
            >
              {t("commandes.annuler")}
            </button>
          </div>
        ) : null}
      </li>
    );
  }

  return (
    <div className="cadc-pile">
      <form
        className="cadc-carte cadc-pile"
        onSubmit={(e) => {
          e.preventDefault();
          ajouter();
        }}
      >
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("commandes.transcription")}</span>
          <textarea
            value={champ.transcription}
            onChange={(e) => setChamp({ transcription: e.target.value })}
            maxLength={2000}
            rows={3}
            required
            placeholder={t("commandes.transcription-aide")}
          />
          <span className="cadc-champ__aide">{t("commandes.transcription-aide")}</span>
        </label>
        <div className="cadc-acts">
          <button
            type="submit"
            className="cadc-bouton cadc-bouton--grand cadc-bouton--premier"
            disabled={enCours || champ.transcription.trim().length < 3}
          >
            {enCours ? t("commun.ecriture") : t("commandes.nouvelle")}
          </button>
        </div>
        {erreur ? (
          <span className="cadc-note cadc-note--rouge" role="status">
            {erreur}
          </span>
        ) : null}
      </form>

      <div className="cadc-grille">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("commandes.recherche")}</span>
          <input
            value={filtre}
            onChange={(e) => setFiltre(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") rafraichir();
            }}
            placeholder={t("commandes.recherche-aide")}
          />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("commandes.statut")}</span>
          <select
            value={statutFiltre}
            onChange={(e) => {
              setStatutFiltre(e.target.value);
              setTimeout(rafraichir, 0);
            }}
          >
            <option value="">{t("commandes.toutes")}</option>
            {STATUTS_COMMANDE.map((un) => (
              <option key={un} value={un}>
                {t(`cstatut.${un}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("commandes.intention")}</span>
          <select
            value={intentionFiltre}
            onChange={(e) => {
              setIntentionFiltre(e.target.value);
              setTimeout(rafraichir, 0);
            }}
          >
            <option value="">{t("commandes.toutes")}</option>
            {INTENTIONS.map((un) => (
              <option key={un} value={un}>
                {t(`intention.${un}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {ouvertes.length ? (
        <ul className="standard-grille">{ouvertes.map(carte)}</ul>
      ) : null}
      {fermees.length ? (
        <>
          <div className="cadc-tete">
            <h2>{t("commandes.toutes")}</h2>
          </div>
          <ul className="standard-grille">{fermees.map(carte)}</ul>
        </>
      ) : null}
      {!commandes.length ? <p className="cadc-note">{t("commun.aucun")}</p> : null}
      <p className="cadc-note cadc-note--acier">{t("commandes.aide")}</p>
    </div>
  );
}
