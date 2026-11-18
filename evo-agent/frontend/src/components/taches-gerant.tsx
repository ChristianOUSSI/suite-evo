"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { PRIORITES, TYPES_TACHE, STATUTS_TACHE } from "@/lib/constantes";
import { ecrire, parametres } from "@/lib/client-api";
import { ErreurAgent } from "@/lib/errors";
import { formats } from "@/lib/format";
import { traduire } from "@/lib/langue";
import type { Priorite, Tache, TacheEntree, TypeTache } from "@/lib/types";


export function TachesGerant({
  taches,
  langue,
}: {
  taches: Tache[];
  langue: string;
}) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const f = formats(langue);

  const [champ, setChamp] = useState<TacheEntree>({ titre: "", consigne: "", type: "autre", priorite: "normale" });
  const [filtre, setFiltre] = useState("");
  const [statutFiltre, setStatutFiltre] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [actives, setActives] = useState<Record<number, string>>({});
  const [resultats, setResultats] = useState<Record<number, string>>({});

  async function rafraichir() {
    const qs = parametres({ statut: statutFiltre || null, recherche: filtre || null });
    routeur.push(`/taches${qs}`);
    routeur.refresh();
  }

  async function ajouter() {
    setEnCours(true);
    setErreur(null);
    try {
      await ecrire<Tache>("/taches", { body: champ, langue });
      setChamp({ titre: "", consigne: "", type: "autre", priorite: "normale" });
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurAgent ? e.message : t("commun.horsLigne"));
      setEnCours(false);
    }
  }

  async function executer(tache: Tache) {
    setActives({ ...actives, [tache.id]: "executer" });
    setErreur(null);
    try {
      await ecrire(`/taches/${tache.id}/executer`, { body: {}, langue });
      setActives((a) => ({ ...a, [tache.id]: "" }));
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurAgent ? e.message : t("commun.horsLigne"));
      setActives((a) => ({ ...a, [tache.id]: "" }));
    }
  }

  async function terminer(tache: Tache) {
    const resultat = (resultats[tache.id] ?? "").trim();
    if (!resultat) {
      setErreur(t("taches.resultat-aide"));
      return;
    }
    setActives({ ...actives, [tache.id]: "terminer" });
    setErreur(null);
    try {
      await ecrire(`/taches/${tache.id}/terminer`, { body: { resultat }, langue });
      setResultats((r) => ({ ...r, [tache.id]: "" }));
      setActives((a) => ({ ...a, [tache.id]: "" }));
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurAgent ? e.message : t("commun.horsLigne"));
      setActives((a) => ({ ...a, [tache.id]: "" }));
    }
  }

  const ouverte = taches.filter((un) => un.statut === "en_attente" || un.statut === "en_cours");
  const fermees = taches.filter((un) => !ouverte.includes(un));

  function carte(tache: Tache) {
    const lancable = tache.statut === "en_attente" || tache.statut === "echec";
    const cloturable = tache.statut === "en_cours";
    return (
      <li className={`appel tache tache--${tache.statut}`} key={tache.id}>
        <div className="appel__cat">
          {t(`ttype.${tache.type}`)} · {t(`priorite.${tache.priorite}`)} · {t(`tstatut.${tache.statut}`)}
        </div>
        <div className="appel__titre">{tache.titre}</div>
        {tache.consigne ? <p className="appel__description">{tache.consigne}</p> : null}
        <div className="appel__lieu">
          {t("taches.par")} {tache.cree_par} · {tache.executions} exéc.
          {tache.maj_le ? ` · ${f.jourDate(tache.maj_le)}` : ""}
        </div>
        {tache.resultat ? <p className="tache__resultat">{tache.resultat}</p> : null}
        {tache.erreur ? <p className="tache__erreur">{t("taches.erreur")} : {tache.erreur}</p> : null}
        <div className="cadc-acts">
          {lancable ? (
            <button
              type="button"
              className="cadc-bouton"
              disabled={actives[tache.id] === "executer"}
              onClick={() => executer(tache)}
            >
              {actives[tache.id] === "executer" ? t("taches.lancement") : t("taches.lancer")}
            </button>
          ) : null}
          {cloturable ? (
            <input
              className="cadc-champ__saisie"
              placeholder={t("taches.resultat")}
              value={resultats[tache.id] ?? ""}
              onChange={(e) => setResultats({ ...resultats, [tache.id]: e.target.value })}
              maxLength={400}
            />
          ) : null}
          {cloturable ? (
            <button
              type="button"
              className="cadc-bouton"
              disabled={actives[tache.id] === "terminer"}
              onClick={() => terminer(tache)}
            >
              {t("taches.terminer")}
            </button>
          ) : null}
        </div>
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
        <div className="cadc-grille">
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("taches.titre-champ")}</span>
            <input
              value={champ.titre}
              onChange={(e) => setChamp({ ...champ, titre: e.target.value })}
              maxLength={160}
              required
            />
          </label>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("taches.type")}</span>
            <select
              value={champ.type}
              onChange={(e) => setChamp({ ...champ, type: e.target.value as TypeTache })}
            >
              {TYPES_TACHE.map((un) => (
                <option key={un} value={un}>
                  {t(`ttype.${un}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("taches.consigne")}</span>
          <textarea
            value={champ.consigne}
            onChange={(e) => setChamp({ ...champ, consigne: e.target.value })}
            maxLength={2000}
            rows={3}
          />
        </label>
        <div className="cadc-grille">
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("taches.priorite")}</span>
            <select
              value={champ.priorite}
              onChange={(e) => setChamp({ ...champ, priorite: e.target.value as Priorite })}
            >
              {PRIORITES.map((un) => (
                <option key={un} value={un}>
                  {t(`priorite.${un}`)}
                </option>
              ))}
            </select>
          </label>
          <div className="cadc-acts">
            <button
              type="submit"
              className="cadc-bouton cadc-bouton--premier"
              disabled={enCours || champ.titre.trim().length < 3}
            >
              {enCours ? t("commun.ecriture") : t("taches.nouvelle")}
            </button>
          </div>
        </div>
        {erreur ? (
          <span className="cadc-note cadc-note--rouge" role="status">
            {erreur}
          </span>
        ) : null}
      </form>

      <div className="cadc-grille">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("taches.recherche")}</span>
          <input
            value={filtre}
            onChange={(e) => setFiltre(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") rafraichir();
            }}
            placeholder={t("taches.recherche-aide")}
          />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("taches.statut")}</span>
          <select
            value={statutFiltre}
            onChange={(e) => {
              setStatutFiltre(e.target.value);
              setTimeout(rafraichir, 0);
            }}
          >
            <option value="">{t("taches.toutes")}</option>
            {STATUTS_TACHE.map((un) => (
              <option key={un} value={un}>
                {t(`tstatut.${un}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {ouverte.length ? (
        <ul className="standard-grille">{ouverte.map(carte)}</ul>
      ) : null}
      {fermees.length ? (
        <>
          <div className="cadc-tete">
            <h2>{t("taches.toutes")}</h2>
          </div>
          <ul className="standard-grille">{fermees.map(carte)}</ul>
        </>
      ) : null}
      {!taches.length ? <p className="cadc-note">{t("commun.aucun")}</p> : null}
      <p className="cadc-note cadc-note--acier">{t("taches.aide")}</p>
    </div>
  );
}
