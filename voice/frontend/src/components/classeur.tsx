"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ErreurApi,
  charger,
  patcher,
  poster,
  supprimer,
} from "@/lib/client-api";
import type { Fiche, Trou } from "@/lib/types";

interface Edition {
  statement: string;
  keywords: string;
  body: string;
  area: string;
  follow_up: string;
}

interface Essai {
  found: boolean;
  score?: number;
  mots?: string[];
  fallback?: string;
  answer?: Fiche;
  dictation?: string;
}

const VIDE: Edition = {
  statement: "",
  keywords: "",
  body: "",
  area: "Accueil",
  follow_up: "",
};

function frappe(hits: number): string {
  if (hits === 0) return "jamais lue";
  if (hits === 1) return "lue une fois";
  return `lue ${hits} fois`;
}

export function Classeur({
  fiches,
  postes,
  aires,
  jours,
  trous,
}: {
  fiches: Fiche[];
  postes: { id: number; label: string }[];
  aires: string[];
  jours: number;
  trous: Trou[];
}) {
  const route = useRouter();
  const [choisie, setChoisie] = useState<Fiche | null>(null);
  const [edition, setEdition] = useState<Edition>(VIDE);
  const [touchees, setTouchees] = useState<{ digit: string; line_id: number }[]>(
    []
  );
  const [question, setQuestion] = useState("");
  const [pour, setPour] = useState("");
  const [essai, setEssai] = useState<Essai | null>(null);
  const [panne, setPanne] = useState("");
  const [enCours, setEnCours] = useState(false);

  const prets =
    edition.statement.trim().length >= 6 && edition.body.trim().length >= 10;

  async function ouvrir(fiche: Fiche) {
    setPanne("");
    setPour("");
    setChoisie(fiche);
    setEdition({
      statement: fiche.statement,
      keywords: fiche.keywords,
      body: fiche.body,
      area: fiche.area,
      follow_up: fiche.follow_up,
    });
    try {
      const detail = await charger<Fiche>(`/answers/${fiche.id}`);
      setTouchees(detail.used_by ?? []);
    } catch (erreur) {
      setPanne(texte(erreur));
    }
  }

  function nouvelle() {
    setChoisie(null);
    setEdition(VIDE);
    setTouchees([]);
    setPour("");
    setPanne("");
  }

  function partir(trou: Trou) {
    setChoisie(null);
    setTouchees([]);
    setPanne("");
    setQuestion(trou.example);
    setPour(trou.example);
    setEdition({
      statement: "",
      keywords: trou.suggestion.keywords,
      body: "",
      area: trou.suggestion.area,
      follow_up: "",
    });
  }

  async function enregistrer() {
    setEnCours(true);
    setPanne("");
    try {
      const corps = {
        statement: edition.statement.trim(),
        keywords: edition.keywords.trim(),
        body: edition.body.trim(),
        area: edition.area.trim() || "Accueil",
        follow_up: edition.follow_up.trim(),
      };
      const ecrite = choisie
        ? await patcher<Fiche>(`/answers/${choisie.id}`, corps)
        : await poster<Fiche>("/answers", corps);
      setChoisie(ecrite);
      setTouchees([]);
      route.refresh();
    } catch (erreur) {
      setPanne(texte(erreur));
    } finally {
      setEnCours(false);
    }
  }

  async function effacer() {
    if (!choisie) return;
    setEnCours(true);
    setPanne("");
    try {
      await supprimer(`/answers/${choisie.id}`);
      nouvelle();
      route.refresh();
    } catch (erreur) {
      setPanne(texte(erreur));
    } finally {
      setEnCours(false);
    }
  }

  async function tester() {
    setEnCours(true);
    setPanne("");
    try {
      const resultat = await poster<Essai>("/answers/tester", {
        question: question.trim(),
      });
      setEssai(resultat);
    } catch (erreur) {
      setPanne(texte(erreur));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="panneaux">
      <section className="panneau">
        <h2>Le fonds de réponses</h2>
        <div className="reponses">
          {fiches.map((fiche, index) => (
            <button
              type="button"
              key={fiche.id}
              className={
                choisie?.id === fiche.id ? "reponse choisie" : "reponse"
              }
              onClick={() => ouvrir(fiche)}
            >
              <span className="num">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="quoi">
                {fiche.statement}
                <span className="suite">{fiche.follow_up}</span>
              </span>
              <span className="frappe">
                {frappe(fiche.hits)}
                <span className="domaine">{fiche.area}</span>
              </span>
            </button>
          ))}
          {fiches.length === 0 && (
            <p className="vide">
              Aucune fiche ne répond à ces mots. Le fonds se remplit ici, ou
              depuis une fiche vide juste à côté.
            </p>
          )}
        </div>
        <p className="note-bas">
          {fiches.length} fiches dans le fonds. Une fiche qui n'est jamais lue
          n'est pas forcément fausse : elle attend peut-être les mauvais mots
          clefs.
        </p>
      </section>

      <div className="colonne">
        <section className="panneau">
          <h2>Éprouver le fonds</h2>
          <label className="champ-ligne">
            <span>La phrase telle qu'un appelant la dirait</span>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Je veux reporter mon inscription, c'est possible ?"
            />
          </label>
          <button
            className="bouton"
            type="button"
            onClick={tester}
            disabled={enCours || question.trim().length < 3}
          >
            Voir ce que la voix répondrait
          </button>

          {essai && !essai.found && (
            <div className="essai faux">
              <p>
                Rien d'assez proche dans le fonds. La voix note la question et
                annonce qu'un conseiller rappelle.
              </p>
              <p className="mots">
                Mots retenus de la phrase :{" "}
                {(essai.mots ?? []).join(", ") || "aucun"}
              </p>
              {essai.fallback && <p className="dictee-echo">{essai.fallback}</p>}
            </div>
          )}

          {essai?.found && essai.answer && (
            <div className="essai juste">
              <p className="detail">{essai.answer.statement}</p>
              <p className="dictee-echo">Voix : {essai.dictation}</p>
              <p className="mots">
                Lu en {essai.answer.seconde} s à voix haute, {frappe(essai.answer.hits)}.
              </p>
            </div>
          )}
        </section>

        <section className="panneau">
          <h2>{choisie ? "Corriger la fiche" : "Écrire une fiche"}</h2>

          {pour && !choisie && (
            <p className="occupe">
              La voix n'a rien à dire sur : « {pour} ». Écrivez l'affirmation,
              elle partira sur ce mot clef.
            </p>
          )}

          {touchees.length > 0 && (
            <p className="occupe">
              Touchée par :{" "}
              {touchees
                .map(
                  (t) =>
                    `${postes.find((p) => p.id === t.line_id)?.label ?? "poste sorti"} ${t.digit}`
                )
                .join(", ")}
            </p>
          )}
          {choisie && touchees.length === 0 && (
            <p className="occupe">
              Aucune touche de poste ne mène à cette fiche. Elle ne sert que
              quand l'appelant parle sans toucher de touche.
            </p>
          )}

          <label className="champ-ligne">
            <span>Ce que la fiche affirme</span>
            <input
              value={edition.statement}
              onChange={(e) => setEdition({ ...edition, statement: e.target.value })}
              placeholder="Les frais de scolarité se règlent en deux fois"
            />
          </label>

          <div className="deux-champs">
            <label className="champ-ligne">
              <span>Domaine</span>
              <input
                list="domaines"
                value={edition.area}
                onChange={(e) => setEdition({ ...edition, area: e.target.value })}
              />
            </label>
            <label className="champ-ligne">
              <span>Durée de lecture</span>
              <input
                readOnly
                value={`${Math.round(edition.body.trim().split(/\s+/).filter(Boolean).length / 2.6)} s`}
              />
            </label>
          </div>

          <datalist id="domaines">
            {aires.map((aire) => (
              <option key={aire} value={aire} />
            ))}
          </datalist>

          <label className="champ-ligne">
            <span>Mots clefs, séparés par des virgules</span>
            <input
              value={edition.keywords}
              onChange={(e) => setEdition({ ...edition, keywords: e.target.value })}
              placeholder="frais, scolarité, payer, échéance"
            />
          </label>

          <label className="champ-ligne">
            <span>Le texte lu au téléphone</span>
            <textarea
              value={edition.body}
              onChange={(e) => setEdition({ ...edition, body: e.target.value })}
              placeholder="Écrivez la phrase exacte, telle qu'elle doit être dite."
            />
          </label>

          <label className="champ-ligne">
            <span>Et si l'appelant insiste</span>
            <input
              value={edition.follow_up}
              onChange={(e) => setEdition({ ...edition, follow_up: e.target.value })}
              placeholder="Sinon, la scolarité répond au poste 2."
            />
          </label>

          {panne && <p className="message-erreur">{panne}</p>}
          {!prets && (
            <p className="attention">
              Il faut au moins une affirmation de six signes et un texte de dix
              signes.
            </p>
          )}

          <div className="ligne-action">
            <button
              className="bouton"
              type="button"
              onClick={enregistrer}
              disabled={enCours || !prets}
            >
              {choisie ? "Enregistrer" : "Ajouter au fonds"}
            </button>
            {choisie && (
              <button
                className="bouton sobre"
                type="button"
                onClick={effacer}
                disabled={enCours}
              >
                Retirer la fiche
              </button>
            )}
            {!choisie && (
              <button className="bouton sobre" type="button" onClick={nouvelle}>
                Vider le formulaire
              </button>
            )}
          </div>
        </section>

        <section className="panneau">
          <h2>Ce que la voix ne sait pas dire</h2>
          <p className="chapeau">
            {trous.length === 0
              ? `Rien n'est resté sans fiche pendant ${jours} jours. Le fonds tient.`
              : `${trous.length} questions revenues sans qu'aucune fiche ne sorte, depuis ${jours} jours. Celles qui ont été posées deux fois méritent une fiche.`}
          </p>
          {trous.length > 0 && (
            <div className="trous">
              {trous.map((trou) => (
                <div
                  className={trou.repeated ? "trou qui-revient" : "trou"}
                  key={trou.racine}
                >
                  <b className="compteur-trou">{trou.count}</b>
                  <span className="quoi">
                    {trou.example}
                    <span className="suite">{trou.keywords}</span>
                  </span>
                  <button
                    className="bouton sobre petit"
                    type="button"
                    onClick={() => partir(trou)}
                  >
                    Préparer la fiche
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function texte(erreur: unknown): string {
  return erreur instanceof ErreurApi
    ? erreur.message
    : "Le répertoire n'a pas répondu. Vérifiez que l'API tourne.";
}
