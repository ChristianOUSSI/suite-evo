"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

import { ChampTelephone } from "@/components/champ-telephone";
import { MentionDemo } from "@/components/mention-demo";
import { ecrire } from "@/lib/client-api";
import { ErreurCaisse } from "@/lib/errors";
import { canoniseTelephone } from "@/lib/format";
import type { Classe, Eleve, EnteteEleve } from "@/lib/types";

const QUARTIERS = [
  "Bonabéri",
  "Bonapriso",
  "Deido",
  "Akwa",
  "Bassa",
  "Makepe",
  "Yassa",
  "Logbaba",
  "New-Bell",
  "Nkoabang",
];

export function FormulaireEleve({
  classes,
  annee,
}: {
  classes: Classe[];
  annee: string;
}) {
  const routeur = useRouter();
  const [champ, setChamp] = useState({
    prenoms: "",
    nom: "",
    sexe: "F",
    classe_id: classes[0] ? String(classes[0].id) : "",
    tuteur_nom: "",
    tuteur_lien: "mère",
    quartier: QUARTIERS[0],
    note: "",
  });
  const [premier, setPremier] = useState("");
  const [second, setSecond] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [creer, setCreer] = useState(false);

  const canonique = canoniseTelephone(premier);
  const erreurTelephone = premier.trim() !== "" && canonique === null;

  function change(cle: keyof typeof champ) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setChamp((actuel) => ({ ...actuel, [cle]: event.target.value }));
  }

  async function inscrire(event: React.FormEvent) {
    event.preventDefault();
    setCreer(true);
    setMessage(null);
    const corps: EnteteEleve = {
      prenoms: champ.prenoms.trim(),
      nom: champ.nom.trim(),
      sexe: champ.sexe as "F" | "M",
      classe_id: champ.classe_id ? Number(champ.classe_id) : null,
      tuteur_nom: champ.tuteur_nom.trim(),
      tuteur_telephone: canonique ?? "",
      tuteur_second: canoniseTelephone(second) ?? "",
      tuteur_lien: champ.tuteur_lien,
      quartier: champ.quartier,
      note: champ.note.trim(),
    };
    try {
      const eleve = await ecrire<Eleve>("/eleves", { method: "POST", body: corps });
      routeur.push(`/app/eleves/${eleve.id}`);
      routeur.refresh();
    } catch (erreur) {
      setMessage(
        erreur instanceof ErreurCaisse ? erreur.message : "La caisse ne répond pas.",
      );
      setCreer(false);
    }
  }

  return (
    <form className="sheet sheet--offset bloc" onSubmit={inscrire}>
      <div className="section-head">
        <h2>Nouvelle inscription</h2>
        <span className="section-head__aside">{annee}</span>
      </div>

      {message ? (
        <p className="notice notice--error" role="alert" style={{ marginTop: "1rem" }}>
          {message}
        </p>
      ) : null}

      <div className="form-grid" style={{ marginTop: "1.2rem" }}>
        <div className="field">
          <label htmlFor="prenoms">Prénoms</label>
          <input
            id="prenoms"
            value={champ.prenoms}
            onChange={change("prenoms")}
            minLength={2}
            maxLength={120}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="nom">Nom</label>
          <input
            id="nom"
            value={champ.nom}
            onChange={change("nom")}
            minLength={2}
            maxLength={120}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="sexe">Sexe</label>
          <select id="sexe" value={champ.sexe} onChange={change("sexe")}>
            <option value="F">Fille</option>
            <option value="M">Garçon</option>
          </select>
        </div>
      </div>

      <div className="form-grid form-grid--pair" style={{ marginTop: "1rem" }}>
        <div className="field">
          <label htmlFor="classe">Classe</label>
          <select id="classe" value={champ.classe_id} onChange={change("classe_id")}>
            {classes.length === 0 ? <option value="">Aucune classe ouverte</option> : null}
            {classes.map((une) => (
              <option key={une.id} value={String(une.id)}>
                {une.label} · {fcfaInline(une.total)}
              </option>
            ))}
          </select>
          <span className="field__aide">
            Avec une classe, l&apos;ardoise de l&apos;année se pose toute seule au
            barème de la classe.
          </span>
        </div>
        <div className="field">
          <label htmlFor="quartier">Quartier</label>
          <select id="quartier" value={champ.quartier} onChange={change("quartier")}>
            {QUARTIERS.map((quartier) => (
              <option key={quartier} value={quartier}>
                {quartier}
              </option>
            ))}
          </select>
        </div>
      </div>

      <hr className="divider divider--ink" style={{ marginBlock: "1.4rem" }} />

      <div className="form-grid form-grid--pair">
        <div className="field">
          <label htmlFor="tuteur">Parent ou tuteur</label>
          <input
            id="tuteur"
            value={champ.tuteur_nom}
            onChange={change("tuteur_nom")}
            placeholder="madame Njoya"
            maxLength={140}
          />
        </div>
        <div className="field">
          <label htmlFor="lien">Lien</label>
          <select id="lien" value={champ.tuteur_lien} onChange={change("tuteur_lien")}>
            {["mère", "père", "tuteur", "oncle", "grand-mère", "frère", "sœur"].map((lien) => (
              <option key={lien} value={lien}>
                {lien}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-grid form-grid--pair" style={{ marginTop: "1rem" }}>
        <ChampTelephone
          id="premier"
          label="Premier numéro"
          value={premier}
          onChange={setPremier}
          requis
          aide={
            erreurTelephone
              ? undefined
              : "C'est ce numéro qui reçoit le reçu et les relances."
          }
        />
        <ChampTelephone
          id="second"
          label="Second numéro"
          value={second}
          onChange={setSecond}
          aide="Optionnel : le parent de secours."
        />
      </div>

      <div className="field" style={{ marginTop: "1rem" }}>
        <label htmlFor="note">Observation</label>
        <textarea
          id="note"
          value={champ.note}
          onChange={change("note")}
          placeholder="Fratrie déjà inscrite, payer au guichet le samedi…"
          maxLength={600}
        />
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn--ink"
          disabled={creer || erreurTelephone || champ.prenoms.length < 2 || champ.nom.length < 2}
        >
          {creer ? "Inscription…" : "Inscrire l'élève"}
        </button>
        <Link href="/app/eleves" className="btn btn--quiet">
          Annuler
        </Link>
      </div>

      <MentionDemo texte="Démo : l'élève est écrit dans une école fictive. Aucun parent n'est notifié à l'inscription." />
    </form>
  );
}

function fcfaInline(value: number): string {
  return `${value.toLocaleString("fr-FR")} F`;
}
