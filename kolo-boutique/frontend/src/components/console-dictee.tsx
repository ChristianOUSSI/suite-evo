"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icone } from "./icone";
import { MentionDemo } from "./mention-demo";
import { ecrire } from "@/lib/client-api";
import { ErreurComptoir } from "@/lib/errors";
import type { DicteeRendue } from "@/lib/types";

const EXEMPLES = [
  "2 fanta 900",
  "rachat 10 spaghetti 520",
  "dépense taxi Bonanjo 1500",
  "3 eau 400 momo",
  "1 biere castel 1050",
];

const VERBES: Record<string, { label: string; aide: string }> = {
  vente: {
    label: "Une sortie",
    aide: "la marchandise quitte le rayon, le bénéfice se fige au coût du jour",
  },
  entree: {
    label: "Un rachat",
    aide: "le stock remonte et le coût moyen se remélange",
  },
  depense: {
    label: "Une dépense",
    aide: "l'argent sort sans vente : transport, loyer, salaire, facture",
  },
};

export function ConsoleDictee({
  ecoutes,
  rails,
}: {
  ecoutes: { id: string; phrase: string; moment: string; etat: string }[];
  rails: { momo: boolean; orange: boolean; especes: boolean };
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
          : "La phrase n'a pas été comprise.",
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
          : "Le cahier n'a rien voulu écrire.",
      );
    } finally {
      setEnCours(false);
    }
  }

  const verbe = rendu ? VERBES[rendu.verbe] : null;
  const peutEcrire = rendu !== null && rendu.doute === null;

  return (
    <div className="dictee-zone">
      <section className="feuille bloc dictee__champ" aria-label="Dicter une écriture">
        <div className="tete-feuille">
          <h2>La phrase du comptoir</h2>
          <span className="tete-feuille__cote">
            {rails.especes ? "espèces" : "espèces coupées"} ·{" "}
            {rails.momo ? "MoMo" : "MoMo coupé"} ·{" "}
            {rails.orange ? "Orange" : "Orange coupé"}
          </span>
        </div>

        <div className="champ" style={{ marginTop: "1rem" }}>
          <label htmlFor="phrase">Ce que tu dirais au téléphone</label>
          <textarea
            id="phrase"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            maxLength={600}
            placeholder="2 fanta 900 momo"
          />
          <span className="champ__aide">
            Le premier nombre dit la quantité, le dernier dit le prix. Un nombre
            seul se lit comme le prix d&apos;une unité.
          </span>
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
            {enCours ? "À l'écoute" : "Écouter sans écrire"}
          </button>
          <button
            type="button"
            className="bouton bouton--brique"
            onClick={ecrireAuCahier}
            disabled={enCours || !assezLongue || !peutEcrire}
          >
            Écrire au cahier
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

        <MentionDemo texte="Démo : la phrase est comprise ici comme le serait un vocal. Rien ne sort de la machine." />
      </section>

      <section className="feuille feuille--decalee bloc dictee__rendu" aria-label="Ce que la phrase devient">
        <div className="tete-feuille">
          <h2>Ce que le cahier retient</h2>
          <span className="tete-feuille__cote">
            {rendu ? "une lecture" : "rien d'écouté"}
          </span>
        </div>

        {rendu === null ? (
          <p className="champ__aide" style={{ marginTop: "0.9rem" }}>
            Écris une phrase, puis « Écouter sans écrire ». Le cahier te dira
            l&apos;article, la quantité et le prix avant de rien consigner.
          </p>
        ) : (
          <>
            <dl className="dictee__ligne" style={{ marginTop: "0.9rem", borderBottom: 0, padding: 0 }}>
              <div className="dictee__ligne">
                <dt>Verbe compris</dt>
                <dd>{verbe?.label ?? rendu.verbe}</dd>
              </div>
              <div className="dictee__ligne">
                <dt>Article</dt>
                <dd>{rendu.produit ? rendu.produit.nom : rendu.libelle || "dépense sans nom"}</dd>
              </div>
              {rendu.produit ? (
                <>
                  <div className="dictee__ligne">
                    <dt>Quantité</dt>
                    <dd>
                      {rendu.quantite} {rendu.produit.unite}
                    </dd>
                  </div>
                  <div className="dictee__ligne">
                    <dt>Prix</dt>
                    <dd>{rendu.prix_label || "prix du rayon"}</dd>
                  </div>
                  <div className="dictee__ligne">
                    <dt>Reste au rayon</dt>
                    <dd>
                      {rendu.produit.stock} {rendu.produit.unite}
                    </dd>
                  </div>
                  <div className="dictee__ligne">
                    <dt>Rail</dt>
                    <dd>{rendu.mode || "espèces"}</dd>
                  </div>
                </>
              ) : (
                <div className="dictee__ligne">
                  <dt>Montant</dt>
                  <dd>{rendu.prix_label}</dd>
                </div>
              )}
            </dl>

            <p className="champ__aide">{verbe?.aide}</p>

            {rendu.doute ? (
              <p className="note-bas note-bas--tard dictee__doute" role="alert">
                {rendu.doute}
              </p>
            ) : null}

            {rendu.ecriture ? (
              <p className="note-bas note-bas--tenu dictee__doute" role="status">
                Écrit au cahier comme {rendu.ecriture.ecriture} numéro{" "}
                {rendu.ecriture.id}.
              </p>
            ) : null}
          </>
        )}

        <div style={{ marginTop: "1.1rem" }}>
          <p className="insigne">Ce que le cahier a déjà retenu aujourd&apos;hui</p>
          {ecoutes.length === 0 ? (
            <p className="champ__aide">
              Aucune dictée pour l&apos;instant.
            </p>
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
