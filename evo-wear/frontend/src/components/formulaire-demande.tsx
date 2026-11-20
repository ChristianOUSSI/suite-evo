"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { traduire } from "@/lib/langue";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";

type Props = { langue: string };

/** La demande d'article : nom, numéro camerounais, note. Sans compte. */
export function FormulaireDemande({ langue }: Props) {
  const t = traduire(langue).t;
  const routeur = useRouter();
  const params = useSearchParams();
  const articleId = Number(params.get("article") ?? "0") || null;
  const [nom, setNom] = useState("");
  const [tel, setTel] = useState("");
  const [note, setNote] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [ok, setOk] = useState(false);
  const [erreur, setErreur] = useState("");

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setErreur("");
    try {
      await ecrire("/public/demandes", { method: "POST", body: {
        article_id: articleId,
        client_nom: nom,
        client_telephone: tel,
        note,
      } });
      setOk(true);
      routeur.refresh();
    } catch (err) {
      setErreur(err instanceof ErreurChantier ? err.message : t("commun.horsLigne"));
    } finally {
      setEnCours(false);
    }
  }

  if (ok) {
    return (
      <div className="cadc-carte">
        <p className="cadc-ok">{t("demande.ok")}</p>
      </div>
    );
  }

  return (
    <form className="cadc-carte" onSubmit={envoyer}>
      <label>
        {t("demande.nomme")}
        <input value={nom} onChange={(e) => setNom(e.target.value)} required minLength={2} />
      </label>
      <label>
        {t("demande.tel")}
        <input
          value={tel}
          onChange={(e) => setTel(e.target.value)}
          required
          inputMode="tel"
          placeholder="690 12 34 56"
        />
      </label>
      <label>
        {t("demande.note")}
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
      </label>
      {erreur ? <p className="cadc-erreur">{erreur}</p> : null}
      <button className="cadc-bouton" type="submit" disabled={enCours}>
        {t("demande.envoyer")}
      </button>
    </form>
  );
}
