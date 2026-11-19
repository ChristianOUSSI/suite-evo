"use client";

import { useState } from "react";

import { formats } from "@/lib/format";
import { traduire } from "@/lib/langue";
import type {
  DisponibilitePublique,
  ReservationEnvoyee,
  TypeChambre,
} from "@/lib/types";

type Props = { langue: string };

function texteErreur(payload: unknown, langue: string, repli: string): string {
  const detail = (payload as { detail?: unknown })?.detail;
  if (detail && typeof detail === "object") {
    const corps = detail as { fr?: string; en?: string };
    return corps[langue === "en" ? "en" : "fr"] ?? corps.fr ?? repli;
  }
  return typeof detail === "string" ? detail : repli;
}

/**
 * La réservation publique : le visiteur choisit ses dates, on lui montre
 * les types de chambre libres, il laisse son nom et son numéro. La demande
 * dort en « demande » jusqu'à ce que la réception la confirme.
 */
export function FormulaireReservation({ langue }: Props) {
  const t = traduire(langue).t;
  const f = formats(langue);
  const [arrivee, setArrivee] = useState("");
  const [depart, setDepart] = useState("");
  const [dispo, setDispo] = useState<DisponibilitePublique | null>(null);
  const [typeChoisi, setTypeChoisi] = useState<TypeChambre | "">("");
  const [form, setForm] = useState({ nom: "", telephone: "", note: "" });
  const [envoye, setEnvoye] = useState<ReservationEnvoyee | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function chercher(evenement: React.FormEvent) {
    evenement.preventDefault();
    setEnCours(true);
    setErreur(null);
    setDispo(null);
    setEnvoye(null);
    try {
      const reponse = await fetch(
        `/api/public/disponibilite?arrivee=${arrivee}&depart=${depart}`,
      );
      const payload = await reponse.json().catch(() => null);
      if (!reponse.ok) {
        throw new Error(
          texteErreur(payload, langue, t("reserver.erreur-dispo")),
        );
      }
      setDispo(payload as DisponibilitePublique);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : t("commun.horsLigne"));
    } finally {
      setEnCours(false);
    }
  }

  async function envoyer(evenement: React.FormEvent) {
    evenement.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      const corps = {
        arrivee,
        depart,
        type_chambre: typeChoisi,
        client_nom: form.nom,
        client_telephone: form.telephone,
        note: form.note,
      };
      const reponse = await fetch("/api/public/reservations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(corps),
      });
      const payload = await reponse.json().catch(() => null);
      if (!reponse.ok) {
        throw new Error(
          texteErreur(
            payload,
            langue,
            langue === "en"
              ? "The hotel did not accept this request."
              : "L'hôtel n'a pas accepté cette demande.",
          ),
        );
      }
      setEnvoye(payload as ReservationEnvoyee);
      setDispo(null);
      setForm({ nom: "", telephone: "", note: "" });
    } catch (e) {
      setErreur(e instanceof Error ? e.message : t("commun.horsLigne"));
    } finally {
      setEnCours(false);
    }
  }

  if (envoye) {
    const telephone = envoye.hotel.telephone_display || envoye.hotel.telephone;
    const prix = f.fcfa(envoye.prix_par_nuit * envoye.nuits);
    return (
      <div className="cadc-carte cadc-pile">
        <p className="cadc-note cadc-note--acier" role="status">
          {t("reserver.ok-titre")}
        </p>
        <p className="cadc-note">
          {telephone
            ? t("reserver.ok-texte", {
                reference: envoye.reference,
                type: t(`type.${envoye.chambre_type}`),
                nuits: envoye.nuits,
                prix,
                telephone,
              })
            : t("reserver.ok-sans-tel", {
                reference: envoye.reference,
                type: t(`type.${envoye.chambre_type}`),
                nuits: envoye.nuits,
                prix,
              })}
        </p>
        <p className="cadc-note">{t("reserver.aide")}</p>
        <div className="cadc-acts">
          <button
            type="button"
            className="cadc-bouton cadc-bouton--premier"
            onClick={() => {
              setEnvoye(null);
              setTypeChoisi("");
            }}
          >
            {t("reserver.encore")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cadc-pile">
      <form className="cadc-carte cadc-pile" onSubmit={chercher}>
        <div className="cadc-grille">
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("reserver.arrivee")}</span>
            <input
              type="date"
              value={arrivee}
              onChange={(e) => setArrivee(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              required
            />
          </label>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("reserver.depart")}</span>
            <input
              type="date"
              value={depart}
              onChange={(e) => setDepart(e.target.value)}
              min={arrivee || new Date().toISOString().slice(0, 10)}
              required
            />
          </label>
        </div>
        {erreur && !dispo ? (
          <p className="cadc-note cadc-note--rouge" role="alert">
            {erreur}
          </p>
        ) : null}
        <button
          type="submit"
          className="cadc-bouton cadc-bouton--premier"
          disabled={enCours || !arrivee || !depart}
        >
          {enCours ? t("reserver.envoi") : t("reserver.voir")}
        </button>
      </form>

      {dispo ? (
        <div className="cadc-carte cadc-pile">
          <div className="cadc-tete">
            <h2>{t("reserver.dispo-titre")}</h2>
          </div>
          {dispo.types.length === 0 ? (
            <p className="cadc-note">{t("reserver.dispo-vide")}</p>
          ) : (
            <fieldset className="cadc-ensemble">
              <legend>{t("reserver.type")}</legend>
              <ul className="cadc-liste">
                {dispo.types.map((un) => (
                  <li key={un.type}>
                    <label className="cadc-choix">
                      <input
                        type="radio"
                        name="type_chambre"
                        checked={typeChoisi === un.type}
                        onChange={() => setTypeChoisi(un.type)}
                      />
                      <span className="cadc-choix__boite" aria-hidden />
                      <span className="cadc-choix__texte">
                        {t(`type.${un.type}`)}
                        <small>
                          {un.prix_min === un.prix_max
                            ? f.fcfa(un.prix_min)
                            : `${t("reserver.depuis")} ${f.fcfa(un.prix_min)}`}
                          {" · "}
                          {un.nuits} {t("reserver.nuits")} · {un.capacite_max}{" "}
                          {t("reserver.personnes")}
                        </small>
                      </span>
                    </label>
                  </li>
                ))}
                <li>
                  <label className="cadc-choix">
                    <input
                      type="radio"
                      name="type_chambre"
                      checked={typeChoisi === ""}
                      onChange={() => setTypeChoisi("")}
                    />
                    <span className="cadc-choix__boite" aria-hidden />
                    <span className="cadc-choix__texte">
                      {t("reserver.type-tout")}
                    </span>
                  </label>
                </li>
              </ul>
            </fieldset>
          )}

          {dispo.types.length > 0 ? (
            <form className="cadc-pile" onSubmit={envoyer}>
              <div className="cadc-grille">
                <label className="cadc-champ">
                  <span className="cadc-champ__titre">{t("reserver.nom")}</span>
                  <input
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    maxLength={160}
                    autoComplete="name"
                    required
                  />
                </label>
                <label className="cadc-champ">
                  <span className="cadc-champ__titre">
                    {t("reserver.telephone")}
                  </span>
                  <input
                    value={form.telephone}
                    onChange={(e) =>
                      setForm({ ...form, telephone: e.target.value })
                    }
                    inputMode="tel"
                    placeholder="6 77 12 34 56"
                    autoComplete="tel"
                  />
                </label>
              </div>
              <label className="cadc-champ">
                <span className="cadc-champ__titre">{t("reserver.note")}</span>
                <input
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  maxLength={600}
                />
              </label>
              {erreur ? (
                <p className="cadc-note cadc-note--rouge" role="alert">
                  {erreur}
                </p>
              ) : null}
              <button
                type="submit"
                className="cadc-bouton cadc-bouton--grand cadc-bouton--premier"
                disabled={enCours}
              >
                {enCours ? t("reserver.envoi") : t("reserver.envoyer")}
              </button>
              <p className="cadc-note">{t("reserver.aide")}</p>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
