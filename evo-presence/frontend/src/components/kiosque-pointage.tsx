"use client";

import { useState } from "react";

import { formats } from "@/lib/format";
import { traduire } from "@/lib/langue";
import type { PointageEnvoye } from "@/lib/types";

type Props = { langue: string };
type Geste = "arrivee" | "depart";

function texteErreur(payload: unknown, langue: string, repli: string): string {
  const detail = (payload as { detail?: unknown })?.detail;
  if (detail && typeof detail === "object") {
    const corps = detail as { fr?: string; en?: string };
    return corps[langue === "en" ? "en" : "fr"] ?? corps.fr ?? repli;
  }
  return typeof detail === "string" ? detail : repli;
}

/**
 * L'écran partagé de l'entrée : l'employé tape son code et choisit son
 * geste. Arrivée ou départ, l'heure se prend toute seule - l'écran est
 * celui de la porte, pas celui du bureau.
 */
export function KiosquePointage({ langue }: Props) {
  const t = traduire(langue).t;
  const f = formats(langue);
  const [code, setCode] = useState("");
  const [geste, setGeste] = useState<Geste>("arrivee");
  const [envoye, setEnvoye] = useState<PointageEnvoye | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function envoyer(evenement: React.FormEvent) {
    evenement.preventDefault();
    if (code.trim().length !== 8) return;
    setEnCours(true);
    setErreur(null);
    try {
      const reponse = await fetch("/api/public/pointage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase(), geste }),
      });
      const payload = await reponse.json().catch(() => null);
      if (!reponse.ok) {
        throw new Error(
          texteErreur(
            payload,
            langue,
            langue === "en"
              ? "This code does not match any employee."
              : "Ce code ne correspond à aucun employé.",
          ),
        );
      }
      setEnvoye(payload as PointageEnvoye);
      setCode("");
    } catch (e) {
      setErreur(e instanceof Error ? e.message : t("commun.horsLigne"));
    } finally {
      setEnCours(false);
    }
  }

  if (envoye) {
    const heure = geste === "depart" ? envoye.depart : envoye.arrivee;
    return (
      <div className="cadc-carte cadc-pile">
        <p className="cadc-note cadc-note--vert" role="status">
          {t("kiosque.ok-titre")}
        </p>
        <p className="cadc-note">
          {t(geste === "depart" ? "kiosque.ok-depart" : "kiosque.ok-arrivee", {
            employe: envoye.employe,
            heure: f.heure(envoye.jour + "T" + heure + ":00"),
          })}
        </p>
        <div className="cadc-acts">
          <button
            type="button"
            className="cadc-bouton cadc-bouton--premier"
            onClick={() => {
              setEnvoye(null);
              setGeste("arrivee");
            }}
          >
            {t("kiosque.reessayer")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="cadc-pile" onSubmit={envoyer}>
      <div className="cadc-grille">
        <button
          type="button"
          className={`cadc-bouton cadc-bouton--grand ${geste === "arrivee" ? "cadc-bouton--premier" : "cadc-bouton--doux"}`}
          onClick={() => setGeste("arrivee")}
        >
          {t("kiosque.arrivee")}
        </button>
        <button
          type="button"
          className={`cadc-bouton cadc-bouton--grand ${geste === "depart" ? "cadc-bouton--premier" : "cadc-bouton--doux"}`}
          onClick={() => setGeste("depart")}
        >
          {t("kiosque.depart")}
        </button>
      </div>
      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("kiosque.code")}</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={8}
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="K7X2M9PQ"
          style={{ fontFamily: "var(--cadc-mono)", letterSpacing: "0.2em", textTransform: "uppercase" }}
          required
        />
        <span className="cadc-champ__aide">{t("kiosque.code-aide")}</span>
      </label>
      {erreur ? (
        <p className="cadc-note cadc-note--rouge" role="alert">
          {erreur}
        </p>
      ) : null}
      <button
        type="submit"
        className="cadc-bouton cadc-bouton--grand cadc-bouton--premier"
        disabled={enCours || code.trim().length !== 8}
      >
        {enCours ? t("kiosque.envoi") : t("kiosque.envoyer")}
      </button>
    </form>
  );
}
