"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icone } from "./icone";
import { MentionDemo } from "./mention-demo";
import { ecrire } from "@/lib/client-api";
import { ErreurComptoir } from "@/lib/errors";
import { fcfa } from "@/lib/format";
import { t, LANGUE_DEFAUT, type Langue } from "@/lib/langue";
import type { Caisse, Comptage } from "@/lib/types";

function chiffre(valeur: string): number {
  return Number.parseInt(valeur.replace(/\D/g, ""), 10) || 0;
}

export function ComptageTiroir({
  caisse,
  langue = LANGUE_DEFAUT,
}: {
  caisse: Caisse;
  langue?: Langue;
}) {
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
          ? t("comptage.tenu", langue)
          : t("comptage.declare", langue, { ecart: fcfa(rendu.ecart) }),
      );
      routeur.refresh();
    } catch (erreur) {
      setIncident(
        erreur instanceof ErreurComptoir
          ? erreur.message
          : t("comptage.incident", langue),
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="pile-champs">
      <div className="grille-champs">
        <div className="champ">
          <label htmlFor="tiroir-fond">{t("comptage.fond", langue)}</label>
          <input
            id="tiroir-fond"
            inputMode="numeric"
            value={fond}
            onChange={(e) => setFond(e.target.value)}
          />
        </div>
        <div className="champ">
          <label htmlFor="tiroir-attendu">{t("comptage.attendu-soir", langue)}</label>
          <input id="tiroir-attendu" value={caisse.attendu_label} readOnly />
          <span className="champ__aide">
            {t("comptage.formule", langue, {
              especes: fcfa(caisse.especes),
              depenses: fcfa(caisse.depenses),
            })}
          </span>
        </div>
        <div className="champ">
          <label htmlFor="tiroir-compte">{t("comptage.compte", langue)}</label>
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
        <span className="compteur__legende">{t("comptage.ecart", langue)}</span>
        <span className="compteur__valeur">
          {!touche
            ? t("comptage.a-compter", langue)
            : ecart === 0
              ? t("comptage.au-franc", langue)
              : `${ecart > 0 ? "+" : "-"}${fcfa(Math.abs(ecart))}`}
        </span>
        <span className="compteur__aide">
          {caisse.comptage
            ? t("comptage.dernier", langue, { par: caisse.comptage.tenu_par })
            : t("comptage.attend", langue)}
        </span>
      </div>

      <div className="champ">
        <label htmlFor="tiroir-note">{t("comptage.note-label", langue)}</label>
        <textarea
          id="tiroir-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={400}
          placeholder={t("comptage.note-ph", langue)}
        />
      </div>

      <div className="acts">
        <button
          type="button"
          className="bouton bouton--encre"
          onClick={declarer}
          disabled={enCours || compte === ""}
        >
          {enCours ? t("comptage.encours", langue) : t("comptage.bouton", langue)}
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

      <MentionDemo texte={t("comptage.demo", langue)} langue={langue} />
    </div>
  );
}
