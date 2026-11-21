"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icone } from "./icone";
import { MentionDemo } from "./mention-demo";
import { ecrire } from "@/lib/client-api";
import { ErreurComptoir } from "@/lib/errors";
import { t, LANGUE_DEFAUT, type Langue } from "@/lib/langue";
import type { DicteeRendue } from "@/lib/types";

const EXEMPLES = [
  "2 fanta 900",
  "rachat 10 spaghetti 520",
  "dépense taxi Bonanjo 1500",
  "3 eau 400 momo",
  "1 biere castel 1050",
];

const VERBES: Record<string, { cleLabel: string; cleAide: string }> = {
  vente: { cleLabel: "verbe.vente-label", cleAide: "verbe.vente-aide" },
  entree: { cleLabel: "verbe.entree-label", cleAide: "verbe.entree-aide" },
  depense: { cleLabel: "verbe.depense-label", cleAide: "verbe.depense-aide" },
};

export function ConsoleDictee({
  ecoutes,
  rails,
  langue = LANGUE_DEFAUT,
}: {
  ecoutes: { id: string; phrase: string; moment: string; etat: string }[];
  rails: { momo: boolean; orange: boolean; especes: boolean };
  langue?: Langue;
}) {
  const routeur = useRouter();
  const [phrase, setPhrase] = useState("");
  const [rendu, setRendu] = useState<DicteeRendue | null>(null);
  const [incident, setIncident] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const assezLongue = phrase.trim().length >= 3;

  async function ecouter() {
    setEnCours(true);
    setIncident(null);
    try {
      setRendu(await ecrire<DicteeRendue>("/dictee/analyse", { body: { phrase } }));
    } catch (erreur) {
      setRendu(null);
      setIncident(
        erreur instanceof ErreurComptoir
          ? erreur.message
          : t("dictee-console.incident-ecoute", langue),
      );
    } finally {
      setEnCours(false);
    }
  }

  async function ecrireAuCahier() {
    setEnCours(true);
    setIncident(null);
    try {
      const tracee = await ecrire<DicteeRendue>("/dictee", { body: { phrase } });
      setRendu(tracee);
      routeur.refresh();
    } catch (erreur) {
      setIncident(
        erreur instanceof ErreurComptoir
          ? erreur.message
          : t("dictee-console.incident-ecriture", langue),
      );
    } finally {
      setEnCours(false);
    }
  }

  const verbe = rendu && VERBES[rendu.verbe] ? VERBES[rendu.verbe] : null;
  const peutEcrire = rendu !== null && rendu.doute === null;
  const railTexte = (ouvert: boolean, nom: string) =>
    ouvert ? t("dictee-console.rail-on", langue, { nom }) : t("dictee-console.rail-off", langue, { nom });

  return (
    <div className="dictee-zone">
      <section className="feuille bloc dictee__champ" aria-label={t("dictee-console.aria-champ", langue)}>
        <div className="tete-feuille">
          <h2>{t("dictee-console.titre", langue)}</h2>
          <span className="tete-feuille__cote">
            {railTexte(rails.especes, t("dictee-console.especes", langue))} ·{" "}
            {railTexte(rails.momo, "MoMo")} · {railTexte(rails.orange, "Orange")}
          </span>
        </div>

        <div className="champ" style={{ marginTop: "1rem" }}>
          <label htmlFor="phrase">{t("dictee-console.label", langue)}</label>
          <textarea
            id="phrase"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            maxLength={600}
            placeholder="2 fanta 900 momo"
          />
          <span className="champ__aide">{t("dictee-console.aide", langue)}</span>
        </div>

        <div className="dictee__exemples">
          {EXEMPLES.map((exemple) => (
            <button
              type="button"
              key={exemple}
              className="dictee__exemple"
              onClick={() => setPhrase(exemple)}
            >
              {exemple}
            </button>
          ))}
        </div>

        <div className="acts">
          <button
            type="button"
            className="bouton"
            onClick={ecouter}
            disabled={enCours || !assezLongue}
          >
            <Icone nom="voix" taille={15} />
            {enCours ? t("dictee-console.a-lecoute", langue) : t("dictee-console.ecouter", langue)}
          </button>
          <button
            type="button"
            className="bouton bouton--brique"
            onClick={ecrireAuCahier}
            disabled={enCours || !assezLongue || !peutEcrire}
          >
            {t("dictee-console.ecrire", langue)}
            <span className="bouton__fleche">
              <Icone nom="fleche" taille={15} />
            </span>
          </button>
        </div>

        {incident ? (
          <p className="note-bas note-bas--tard dictee__doute" role="alert">
            {incident}
          </p>
        ) : null}

        <MentionDemo texte={t("dictee-console.demo", langue)} langue={langue} />
      </section>

      <section className="feuille feuille--decalee bloc dictee__rendu" aria-label={t("dictee-console.aria-rendu", langue)}>
        <div className="tete-feuille">
          <h2>{t("dictee-console.rendu-titre", langue)}</h2>
          <span className="tete-feuille__cote">
            {rendu ? t("dictee-console.lecture", langue) : t("dictee-console.rien", langue)}
          </span>
        </div>

        {rendu === null ? (
          <p className="champ__aide" style={{ marginTop: "0.9rem" }}>
            {t("dictee-console.vide-aide", langue)}
          </p>
        ) : (
          <>
            <dl className="dictee__ligne" style={{ marginTop: "0.9rem", borderBottom: 0, padding: 0 }}>
              <div className="dictee__ligne">
                <dt>{t("dictee-console.verbe", langue)}</dt>
                <dd>{verbe ? t(verbe.cleLabel, langue) : rendu.verbe}</dd>
              </div>
              <div className="dictee__ligne">
                <dt>{t("vente.article", langue)}</dt>
                <dd>{rendu.produit ? rendu.produit.nom : rendu.libelle || t("dictee-console.depense-sans-nom", langue)}</dd>
              </div>
              {rendu.produit ? (
                <>
                  <div className="dictee__ligne">
                    <dt>{t("vente.quantite", langue)}</dt>
                    <dd>
                      {rendu.quantite} {rendu.produit.unite}
                    </dd>
                  </div>
                  <div className="dictee__ligne">
                    <dt>{t("dictee-console.prix", langue)}</dt>
                    <dd>{rendu.prix_label || t("vente.prix-rayon", langue)}</dd>
                  </div>
                  <div className="dictee__ligne">
                    <dt>{t("dictee-console.reste-rayon", langue)}</dt>
                    <dd>
                      {rendu.produit.stock} {rendu.produit.unite}
                    </dd>
                  </div>
                  <div className="dictee__ligne">
                    <dt>{t("vente.rail", langue)}</dt>
                    <dd>{rendu.mode || t("vente.rail-especes", langue)}</dd>
                  </div>
                </>
              ) : (
                <div className="dictee__ligne">
                  <dt>{t("dictee-console.montant", langue)}</dt>
                  <dd>{rendu.prix_label}</dd>
                </div>
              )}
            </dl>

            {verbe ? <p className="champ__aide">{t(verbe.cleAide, langue)}</p> : null}

            {rendu.doute ? (
              <p className="note-bas note-bas--tard dictee__doute" role="alert">
                {rendu.doute}
              </p>
            ) : null}

            {rendu.ecriture ? (
              <p className="note-bas note-bas--tenu dictee__doute" role="status">
                {t("dictee-console.ecrit", langue, {
                  ecriture: rendu.ecriture.ecriture,
                  id: rendu.ecriture.id,
                })}
              </p>
            ) : null}
          </>
        )}

        <div style={{ marginTop: "1.1rem" }}>
          <p className="insigne">{t("dictee-console.historique", langue)}</p>
          {ecoutes.length === 0 ? (
            <p className="champ__aide">{t("dictee-console.historique-vide", langue)}</p>
          ) : (
            <ul className="dictee__historique">
              {ecoutes.map((ligne) => (
                <li key={ligne.id}>
                  <span className="dictee__phrase">« {ligne.phrase} »</span>
                  <span className="insigne">
                    {ligne.moment} · {ligne.etat}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
