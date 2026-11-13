"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import type { Client, ClientEntree } from "@/lib/types";

type Props = { clients: Client[]; langue: string };

const VIDE = { nom: "", telephone: "", piece: "", note: "" };

/**
 * Les clients de l'hôtel. La fiche naît aussi à la réception, mais ici on
 * la prépare : le client régulier a déjà son numéro le soir de son arrivée.
 */
export function ClientsGerant({ clients, langue }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const [ajout, setAjout] = useState(VIDE);
  const [erreurAjout, setErreurAjout] = useState<string | null>(null);
  const [erreurs, setErreurs] = useState<Record<number, string>>({});
  const [enCours, setEnCours] = useState<number | "ajout" | null>(null);

  async function ajouter() {
    setEnCours("ajout");
    setErreurAjout(null);
    try {
      const corps: ClientEntree = {
        nom: ajout.nom,
        telephone: ajout.telephone ? `+237${ajout.telephone}` : "",
        piece: ajout.piece,
        note: ajout.note,
      };
      await ecrire<Client>("/clients", { body: corps, langue });
      setAjout(VIDE);
      routeur.refresh();
    } catch (e) {
      setErreurAjout(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  async function corriger(client: Client, patch: Record<string, unknown>) {
    setEnCours(client.id);
    setErreurs((actuelles) => ({ ...actuelles, [client.id]: "" }));
    try {
      await ecrire<Client>(`/clients/${client.id}`, { method: "PATCH", body: patch, langue });
      routeur.refresh();
    } catch (e) {
      setErreurs((actuelles) => ({
        ...actuelles,
        [client.id]: e instanceof ErreurChantier ? e.message : t("commun.horsLigne"),
      }));
      setEnCours(null);
    }
  }

  return (
    <div className="cadc-pile">
      <div className="cadc-grille">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("clients.nom")}</span>
          <input value={ajout.nom} onChange={(e) => setAjout({ ...ajout, nom: e.target.value })} maxLength={160} autoComplete="off" />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("clients.telephone")}</span>
          <span className="cadc-champ__prefixe">
            <span>+237</span>
            <input
              value={ajout.telephone}
              onChange={(e) => setAjout({ ...ajout, telephone: e.target.value.replace(/[^0-9]/g, "").slice(0, 9) })}
              inputMode="tel"
              placeholder="6 XX XX XX XX"
            />
          </span>
          <span className="cadc-champ__aide">{t("clients.telephone-aide")}</span>
        </label>
      </div>

      <div className="cadc-grille">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("clients.piece")}</span>
          <input value={ajout.piece} onChange={(e) => setAjout({ ...ajout, piece: e.target.value })} maxLength={120} autoComplete="off" />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("clients.note")}</span>
          <input value={ajout.note} onChange={(e) => setAjout({ ...ajout, note: e.target.value })} maxLength={600} autoComplete="off" />
        </label>
      </div>

      <div className="cadc-acts">
        <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={ajouter} disabled={enCours !== null || ajout.nom.trim().length < 2}>
          {enCours === "ajout" ? t("commun.ecriture") : t("clients.nouveau")}
        </button>
        {erreurAjout ? <span className="cadc-note cadc-note--rouge" role="status">{erreurAjout}</span> : null}
      </div>

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {clients.map((client) => (
          <li className={`cadc-ligne${client.actif ? "" : " ouvrier--sorti"}`} key={client.id}>
            <span className="cadc-ligne__nom">
              {client.nom}
              <small>
                {client.telephone_display || t("clients.sans_numero")}
                {client.piece ? ` · ${client.piece}` : ""}
                {client.note ? ` · ${client.note}` : ""}
              </small>
              <small>
                {client.sejours > 0 ? `${client.sejours} ${t("clients.sejours")}` : t("clients.jamais")}
                {!client.actif ? ` · —` : ""}
              </small>
            </span>
            <span className="cadc-ligne__valeur">
              <button
                type="button"
                className="cadc-bouton cadc-bouton--petit cadc-bouton--doux"
                disabled={enCours === client.id}
                onClick={() => corriger(client, { actif: !client.actif })}
              >
                {client.actif ? t("chambres.sortir") : t("chambres.reprendre")}
              </button>
              {erreurs[client.id] ? (
                <span className="cadc-note cadc-note--rouge" role="status">{erreurs[client.id]}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
