"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

import { Icone } from "@/components/icone";
import { MentionDemo } from "@/components/mention-demo";
import { ecrire } from "@/lib/client-api";
import { ErreurCaisse } from "@/lib/errors";
import { fcfa, pourcentage } from "@/lib/format";
import type { Classe, EngagementPose, EnteteClasse } from "@/lib/types";

const VIDE: EnteteClasse = {
  label: "",
  niveau: 2,
  salle: "",
  titulaire: "",
  effectif_max: 45,
  annee: "",
  scolarite: 0,
  cantine: 0,
  transport: 0,
  autres: 0,
  tranches: 3,
};

export function ClassesConsole({
  classes,
  annee,
  auDepart = null,
}: {
  classes: Classe[];
  annee: string;
  auDepart?: number | null;
}) {
  const routeur = useRouter();
  const [choisie, setChoisie] = useState<number | null>(auDepart);
  const [nouvelle, setNouvelle] = useState(false);
  const [champ, setChamp] = useState<EnteteClasse>(() =>
    auDepart
      ? enteteDepuis(classeDans(classes, auDepart) ?? null, annee)
      : { ...VIDE, annee },
  );
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const total =
    champ.scolarite + champ.cantine + champ.transport + champ.autres;
  const selection = choisie === null ? null : classeDans(classes, choisie);

  function choisir(classe: Classe) {
    setChoisie(classe.id);
    setNouvelle(false);
    setMessage(null);
    setChamp(enteteDepuis(classe, annee));
  }

  function creerNouvelle() {
    setNouvelle(true);
    setChoisie(null);
    setMessage(null);
    setChamp({ ...VIDE, annee });
  }

  function changeNombre(
    cle: "niveau" | "effectif_max" | "scolarite" | "cantine" | "transport" | "autres" | "tranches",
  ) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setChamp((actuel) => ({
        ...actuel,
        [cle]: Number.parseInt(event.target.value.replace(/\D/g, ""), 10) || 0,
      }));
  }

  function change(cle: "label" | "salle" | "titulaire" | "annee") {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setChamp((actuel) => ({ ...actuel, [cle]: event.target.value }));
  }

  async function enregistrer(event: React.FormEvent) {
    event.preventDefault();
    setEnCours(true);
    setMessage(null);
    try {
      if (nouvelle || choisie === null) {
        await ecrire<Classe>("/classes", { method: "POST", body: champ });
        setMessage(`Classe ${champ.label} ouverte pour ${champ.annee}.`);
      } else {
        await ecrire<Classe>(`/classes/${choisie}`, { method: "PATCH", body: champ });
        setMessage(`Barème de ${champ.label} recouché.`);
      }
      routeur.refresh();
    } catch (erreur) {
      setMessage(
        erreur instanceof ErreurCaisse ? erreur.message : "La classe n'a pas été retenue.",
      );
    } finally {
      setEnCours(false);
    }
  }

  async function engager() {
    if (choisie === null) {
      return;
    }
    setEnCours(true);
    setMessage(null);
    try {
      const rendu = await ecrire<EngagementPose>(
        `/classes/${choisie}/engager`,
        { method: "POST" },
      );
      setMessage(
        `${rendu.creees} ardoise${rendu.creees > 1 ? "s" : ""} posée${rendu.creees > 1 ? "s" : ""}, ${rendu.deja_posees} déjà là, ${rendu.eleves} élèves couverts, ${rendu.relances_programmees} relances programmées.`,
      );
      routeur.refresh();
    } catch (erreur) {
      setMessage(
        erreur instanceof ErreurCaisse ? erreur.message : "L'engagement a échoué.",
      );
    } finally {
      setEnCours(false);
    }
  }

  async function supprimer() {
    if (choisie === null) {
      return;
    }
    setEnCours(true);
    setMessage(null);
    try {
      await ecrire<void>(`/classes/${choisie}`, { method: "DELETE" });
      setMessage("Classe effacée.");
      setChoisie(null);
      routeur.refresh();
    } catch (erreur) {
      setMessage(
        erreur instanceof ErreurCaisse
          ? erreur.message
          : "La classe n'a pas pu être effacée.",
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="console-classes">
      <section className="sheet bloc" aria-label="Classes de l'année">
        <div className="section-head">
          <h2>Les classes</h2>
          <span className="section-head__aside">{annee}</span>
        </div>

        <div className="filer" style={{ marginTop: "1.1rem" }}>
          {classes.length === 0 ? (
            <p className="vide-note">
              Aucune classe ouverte pour {annee}. La première se crée à droite.
            </p>
          ) : null}
          {classes.map((classe) => (
            <button
              type="button"
              key={classe.id}
              className={`classe-onglet${choisie === classe.id ? " is-choisie" : ""}`}
              onClick={() => choisir(classe)}
              aria-pressed={choisie === classe.id}
            >
              <span className="classe-onglet__nom">
                {classe.label}
                <small>
                  {classe.titulaire || "sans titulaire"} · {classe.salle || "sans salle"}
                </small>
              </span>
              <span className="mono" style={{ fontSize: "0.75rem" }}>
                {classe.effectif}/{classe.effectif_max}
              </span>
              <span className={`tag ${classe.part >= 60 ? "tag--paid" : classe.part > 0 ? "tag--wait" : "tag--late"}`}>
                {pourcentage(classe.part)}
              </span>
            </button>
          ))}
        </div>

        <div className="form-actions" style={{ marginTop: "1.2rem" }}>
          <button type="button" className="btn btn--small" onClick={creerNouvelle}>
            <Icone nom="classe" taille={15} />
            Ouvrir une classe
          </button>
          {selection ? (
            <Link
              href={`/app/eleves?classe=${selection.id}`}
              className="btn btn--small btn--quiet"
            >
              Les {selection.effectif} élèves
            </Link>
          ) : null}
        </div>
      </section>

      <section className="sheet bloc" aria-label="Barème">
        <div className="section-head">
          <h2>{nouvelle ? "Nouvelle classe" : (selection?.label ?? "Choisir une classe")}</h2>
          {selection ? (
            <span className="section-head__aside">
              {fcfa(selection.rentre)} rentrés sur {fcfa(selection.attendu)}
            </span>
          ) : null}
        </div>

        {message ? (
          <p className="notice" role="status" style={{ marginTop: "1rem" }}>
            {message}
          </p>
        ) : null}

        {!nouvelle && !selection ? (
          <div className="empty" style={{ marginTop: "1.1rem" }}>
            <h3>Rien à régler.</h3>
            <p>
              Une classe porte le barème de l&apos;année : scolarité, cantine,
              transport, autres, et le nombre de tranches.
            </p>
            <button type="button" className="text-link" onClick={creerNouvelle}>
              Ouvrir la première classe
            </button>
          </div>
        ) : (
          <form onSubmit={enregistrer} style={{ marginTop: "1.1rem" }}>
            <div className="form-grid" style={{ gridTemplateColumns: "1.4fr 0.5fr 0.7fr" }}>
              <div className="field">
                <label htmlFor="label">Nom de la classe</label>
                <input
                  id="label"
                  value={champ.label}
                  onChange={change("label")}
                  placeholder="CP2, 6e A, Tle D…"
                  maxLength={40}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="niveau">Niveau</label>
                <input
                  id="niveau"
                  className="money"
                  type="text"
                  inputMode="numeric"
                  value={champ.niveau}
                  onChange={changeNombre("niveau")}
                />
                <span className="field__aide">1 à 13, pour l&apos;ordre.</span>
              </div>
              <div className="field">
                <label htmlFor="annee-classe">Année</label>
                <input
                  id="annee-classe"
                  value={champ.annee}
                  onChange={change("annee")}
                  placeholder="2026/2027"
                  maxLength={12}
                  required
                />
              </div>
            </div>

            <div className="form-grid form-grid--pair" style={{ marginTop: "1rem" }}>
              <div className="field">
                <label htmlFor="titulaire">Titulaire</label>
                <input
                  id="titulaire"
                  value={champ.titulaire}
                  onChange={change("titulaire")}
                  placeholder="madame Abena"
                  maxLength={120}
                />
              </div>
              <div className="field">
                <label htmlFor="salle">Salle</label>
                <input
                  id="salle"
                  value={champ.salle}
                  onChange={change("salle")}
                  placeholder="salle 4"
                  maxLength={40}
                />
              </div>
            </div>

            <hr className="divider divider--ink" style={{ marginBlock: "1.3rem" }} />

            <span className="eyebrow">Barème annuel, par élève</span>
            <div className="barème" style={{ marginTop: "0.8rem" }}>
              <div className="field aide-chiffre">
                <label htmlFor="scolarite">Scolarité</label>
                <input
                  id="scolarite"
                  className="money"
                  type="text"
                  inputMode="numeric"
                  value={champ.scolarite}
                  onChange={changeNombre("scolarite")}
                  required
                />
                <span className="aide-chiffre__unite">F</span>
              </div>
              <div className="field aide-chiffre">
                <label htmlFor="cantine">Cantine</label>
                <input
                  id="cantine"
                  className="money"
                  type="text"
                  inputMode="numeric"
                  value={champ.cantine}
                  onChange={changeNombre("cantine")}
                />
                <span className="aide-chiffre__unite">F</span>
              </div>
              <div className="field aide-chiffre">
                <label htmlFor="transport">Transport</label>
                <input
                  id="transport"
                  className="money"
                  type="text"
                  inputMode="numeric"
                  value={champ.transport}
                  onChange={changeNombre("transport")}
                />
                <span className="aide-chiffre__unite">F</span>
              </div>
              <div className="field aide-chiffre">
                <label htmlFor="autres">Autres</label>
                <input
                  id="autres"
                  className="money"
                  type="text"
                  inputMode="numeric"
                  value={champ.autres}
                  onChange={changeNombre("autres")}
                />
                <span className="aide-chiffre__unite">F</span>
              </div>
            </div>

            <div className="form-grid form-grid--pair" style={{ marginTop: "1rem" }}>
              <div className="field">
                <label htmlFor="tranches">Tranches</label>
                <select
                  id="tranches"
                  value={champ.tranches}
                  onChange={changeNombre("tranches")}
                >
                  <option value="1">1 · tout à la rentrée + 9 mois</option>
                  <option value="2">2 · rentrée et + 5 mois</option>
                  <option value="3">3 · rentrée, + 5, + 9 mois</option>
                  <option value="4">4 · rentrée, + 3, + 6, + 9 mois</option>
                </select>
                <span className="field__aide">
                  Tous les termes tombent le 25 du mois.
                </span>
              </div>
              <div className="field">
                <label htmlFor="effectif">Effectif maximum</label>
                <input
                  id="effectif"
                  className="money"
                  type="text"
                  inputMode="numeric"
                  value={champ.effectif_max}
                  onChange={changeNombre("effectif_max")}
                />
              </div>
            </div>

            <div className="barème__total" style={{ marginTop: "1.1rem" }}>
              <span className="eyebrow">Une famille de cette classe doit</span>
              <strong className="money">{fcfa(total)}</strong>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn--ink" disabled={enCours || total <= 0}>
                {enCours ? "Écriture…" : nouvelle ? "Ouvrir la classe" : "Recoucher le barème"}
              </button>
              {!nouvelle && selection ? (
                <>
                  <button
                    type="button"
                    className="btn"
                    onClick={engager}
                    disabled={enCours || selection.effectif === 0}
                    title={
                      selection.effectif === 0
                        ? "Aucun élève dans cette classe"
                        : "Poser l'ardoise de chaque élève et le calendrier"
                    }
                  >
                    Engager les {selection.effectif} élèves
                  </button>
                  <button
                    type="button"
                    className="btn btn--quiet"
                    onClick={supprimer}
                    disabled={enCours || selection.effectif > 0}
                    title={
                      selection.effectif > 0
                        ? "Déplacez d'abord les élèves"
                        : "Effacer une classe vide"
                    }
                  >
                    Effacer
                  </button>
                </>
              ) : null}
            </div>

            <MentionDemo texte="Démo : le barème s'applique à une école fictive. Aucun élève réel ne voit ses frais changer." />
          </form>
        )}
      </section>
    </div>
  );
}

function classeDans(classes: Classe[], id: number): Classe | undefined {
  return classes.find((classe) => classe.id === id);
}

function enteteDepuis(classe: Classe | null | undefined, annee: string): EnteteClasse {
  if (!classe) {
    return { ...VIDE, annee };
  }
  return {
    label: classe.label,
    niveau: classe.niveau,
    salle: classe.salle,
    titulaire: classe.titulaire,
    effectif_max: classe.effectif_max,
    annee: classe.annee || annee,
    scolarite: classe.scolarite,
    cantine: classe.cantine,
    transport: classe.transport,
    autres: classe.autres,
    tranches: classe.tranches,
  };
}
