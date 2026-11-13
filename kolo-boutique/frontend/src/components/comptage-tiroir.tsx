"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icone } from "./icone";
import { MentionDemo } from "./mention-demo";
import { ecrire } from "@/lib/client-api";
import { ErreurComptoir } from "@/lib/errors";
import { fcfa } from "@/lib/format";
import type { Caisse, Comptage } from "@/lib/types";

function chiffre(valeur: string): number {
  return Number.parseInt(valeur.replace(/\D/g, ""), 10) || 0;
}

export function ComptageTiroir({ caisse }: { caisse: Caisse }) {
  const routeur = useRouter();
  const [fond, setFond] = useState(
    String(caisse.comptage?.fond ?? 5_000),
  );
  const [compte, setCompte] = useState(
    caisse.comptage ? String(caisse.comptage.compte) : "",
  );
  const [touche, setTouche] = useState(caisse.comptage !== null);
  const [note, setNote] = useState(caisse.comptage?.note ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [incident, setIncident] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  // Le fond se saisit, l'attendu vient du cahier : on ne laisse pas le
  // tenancier recalculer son tiroir à la main.
  const attendu = caisse.attendu;
  const saisi = chiffre(compte);
  const ecart = saisi - attendu;

  async function declarer() {
    setEnCours(true);
    setMessage(null);
    setIncident(null);
    try {
      const rendu = await ecrire<Comptage>("/caisse/declarer", {
        body: { fond: chiffre(fond), compte: chiffre(compte), note },
      });
      setMessage(
        rendu.tenu
          ? "Tiroir tenu au franc près."
          : `Tiroir déclaré, écart de ${fcfa(rendu.ecart)} écrit au journal.`,
      );
      routeur.refresh();
    } catch (erreur) {
      setIncident(
        erreur instanceof ErreurComptoir
          ? erreur.message
          : "Le comptage n'est pas passé au cahier.",
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="pile-champs">
      <div className="grille-champs">
        <div className="champ">
          <label htmlFor="tiroir-fond">Fond du matin</label>
          <input
            id="tiroir-fond"
            inputMode="numeric"
            value={fond}
            onChange={(e) => setFond(e.target.value)}
          />
        </div>
        <div className="champ">
          <label htmlFor="tiroir-attendu">Attendu au soir</label>
          <input id="tiroir-attendu" value={caisse.attendu_label} readOnly />
          <span className="champ__aide">
            fond + {fcfa(caisse.especes)} d&apos;espèces − {fcfa(caisse.depenses)}{" "}
            de sorties
          </span>
        </div>
        <div className="champ">
          <label htmlFor="tiroir-compte">Compté dans le tiroir</label>
          <input
            id="tiroir-compte"
            inputMode="numeric"
            value={compte}
            onChange={(e) => {
              setCompte(e.target.value);
              setTouche(true);
            }}
            placeholder="0"
          />
        </div>
      </div>

      <div
        className={`compteur ${
          !touche ? "" : ecart === 0 ? "compteur--tenu" : "compteur--tard"
        }`}
      >
        <span className="compteur__legende">Écart</span>
        <span className="compteur__valeur">
          {!touche
            ? "à compter"
            : ecart === 0
              ? "au franc près"
              : `${ecart > 0 ? "+" : "-"}${fcfa(Math.abs(ecart))}`}
        </span>
        <span className="compteur__aide">
          {caisse.comptage
            ? `dernier comptage tenu par ${caisse.comptage.tenu_par}`
            : "le tiroir attend ton comptage"}
        </span>
      </div>

      <div className="champ">
        <label htmlFor="tiroir-note">Ce qui explique l’écart</label>
        <textarea
          id="tiroir-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={400}
          placeholder="une monnaie rendue sur une vente de 500, notée ici"
        />
      </div>

      <div className="acts">
        <button
          type="button"
          className="bouton bouton--encre"
          onClick={declarer}
          disabled={enCours || compte === ""}
        >
          {enCours ? "Comptage" : "Déclarer le tiroir"}
          <span className="bouton__fleche">
            <Icone nom="tiroir" taille={15} />
          </span>
        </button>
      </div>

      {message ? (
        <p className="note-bas note-bas--tenu" role="status">
          {message}
        </p>
      ) : null}
      {incident ? (
        <p className="note-bas note-bas--tard" role="alert">
          {incident}
        </p>
      ) : null}

      <MentionDemo texte="Démo : le comptage s'écrit dans le journal. Le tiroir reste virtuel." />
    </div>
  );
}
