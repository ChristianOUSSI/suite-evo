"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icone } from "@/components/icone";
import { MentionDemo } from "@/components/mention-demo";
import { ecrire } from "@/lib/client-api";
import { ErreurCaisse } from "@/lib/errors";
import { fcfa } from "@/lib/format";
import type { EnteteJournee, EtatCaisse, JourneeDeclaree } from "@/lib/types";

export function Comptage({
  caisse,
  tenuPar,
  jour,
}: {
  caisse: EtatCaisse;
  tenuPar: string;
  jour: string;
}) {
  const routeur = useRouter();
  const [fond, setFond] = useState(String(caisse.fond));
  const [comptage, setComptage] = useState(
    caisse.comptage === null ? String(caisse.attendu) : String(caisse.comptage),
  );
  const [note, setNote] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [declaree, setDeclaree] = useState(caisse.declaree);

  const valeurFond = Number.parseInt(fond.replace(/\D/g, ""), 10) || 0;
  const valeurComptage = Number.parseInt(comptage.replace(/\D/g, ""), 10) || 0;
  const ecart = valeurComptage - (valeurFond + caisse.especes);

  async function declarer() {
    setEnCours(true);
    setMessage(null);
    const corps: EnteteJournee = {
      jour,
      fond: valeurFond,
      comptage: valeurComptage,
      tenu_par: tenuPar,
      note: note.trim(),
    };
    try {
      const rendu = await ecrire<JourneeDeclaree>("/cash/declarer", {
        method: "POST",
        body: corps,
      });
      setMessage(rendu.message);
      setDeclaree(true);
      routeur.refresh();
    } catch (erreur) {
      setMessage(
        erreur instanceof ErreurCaisse ? erreur.message : "Le comptage n'a pas été retenu.",
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <section className="sheet bloc" aria-label="Comptage du tiroir">
      <div className="section-head">
        <h2>Compter le tiroir</h2>
        <span className="section-head__aside">
          {declaree ? "journée comptée" : "journée ouverte"}
        </span>
      </div>

      <div className="comptage" style={{ marginTop: "1.1rem" }}>
        <div className="comptage__resume">
          <dl>
            <div>
              <dt>Espèces rentrées aujourd&apos;hui</dt>
              <dd className="money">{fcfa(caisse.especes)}</dd>
            </div>
            <div>
              <dt>Hors espèces</dt>
              <dd className="money">{fcfa(caisse.hors_especes)}</dd>
            </div>
            <div>
              <dt>Le tiroir doit rendre</dt>
              <dd className="money">{fcfa(valeurFond + caisse.especes)}</dd>
            </div>
          </dl>
        </div>

        {message ? (
          <p className={`notice${declaree ? " notice--success" : " notice--error"}`} role="status">
            {message}
          </p>
        ) : null}

        <div className="form-grid form-grid--pair">
          <div className="field aide-chiffre">
            <label htmlFor="fond">Fond du tiroir</label>
            <input
              id="fond"
              className="money"
              type="text"
              inputMode="numeric"
              value={fond}
              onChange={(e) => setFond(e.target.value)}
            />
            <span className="aide-chiffre__unite">FCFA</span>
            <span className="field__aide">
              Ce qui dormait dans le tiroir ce matin, la monnaie.
            </span>
          </div>
          <div className="field aide-chiffre">
            <label htmlFor="comptage">Comptage réel</label>
            <input
              id="comptage"
              className="money"
              type="text"
              inputMode="numeric"
              value={comptage}
              onChange={(e) => setComptage(e.target.value)}
            />
            <span className="aide-chiffre__unite">FCFA</span>
            <span className="field__aide">
              Billets et pièces dans le tiroir, comptés à la main.
            </span>
          </div>
        </div>

        <p
          className={`tiroir__ecart${ecart === 0 ? " tiroir__ecart--net" : ""}`}
          style={{ marginTop: 0 }}
        >
          {ecart === 0
            ? "Aucun écart annoncé."
            : `Écart annoncé : ${fcfa(Math.abs(ecart))} ${ecart > 0 ? "en trop" : "manquant"}.`}
        </p>

        <div className="field">
          <label htmlFor="note-comptage">Explication de l&apos;écart</label>
          <textarea
            id="note-comptage"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Un billet de 5 000 manqué au comptage, le tiroir a été rouvert deux fois."
            maxLength={400}
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn--ink"
            onClick={declarer}
            disabled={enCours}
          >
            <Icone nom="journal" taille={15} />
            {enCours ? "Écriture…" : declaree ? "Recoucher le comptage" : "Compter la journée"}
          </button>
        </div>

        <MentionDemo texte={`Tenu par ${tenuPar}. Démo : aucun transfert bancaire, aucun retrait d'agent.`} />
      </div>
    </section>
  );
}
