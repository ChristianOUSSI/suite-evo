"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErreurApi, patcher, poster, supprimer } from "@/lib/client-api";
import { ACTIONS_TOUCHE } from "@/lib/format";
import type { Fiche, Guichet, Ligne, Touche } from "@/lib/types";

export function Touches({
  ligne,
  fiches,
  guichets,
  postes,
}: {
  ligne: Ligne;
  fiches: Fiche[];
  guichets: Guichet[];
  postes: Ligne[];
}) {
  const route = useRouter();
  const [mode, setMode] = useState("");
  const [digit, setDigit] = useState("1");
  const [label, setLabel] = useState("");
  const [action, setAction] = useState("reponse");
  const [cible, setCible] = useState("");
  const [panne, setPanne] = useState("");
  const [enCours, setEnCours] = useState(false);

  const menu = [...(ligne.menu ?? [])].sort((a, b) => a.digit.localeCompare(b.digit));
  const entree = menu.find((item) => String(item.id) === mode);

  function nomCible(entree: Touche): string {
    if (entree.action === "reponse") {
      return (
        fiches.find((item) => item.id === entree.answer_id)?.statement ??
        "fiche sortie"
      );
    }
    if (entree.action === "rendezvous") {
      return (
        guichets.find((item) => item.id === entree.service_id)?.name ??
        "guichet fermé"
      );
    }
    if (entree.action === "transfert") {
      return (
        postes.find((item) => item.id === entree.target_line_id)?.label ??
        "poste sorti"
      );
    }
    return "prend le message";
  }

  function regler(entree: Touche) {
    setMode(String(entree.id));
    setDigit(entree.digit);
    setLabel(entree.label);
    setAction(entree.action);
    const valeur =
      entree.action === "reponse"
        ? entree.answer_id
        : entree.action === "rendezvous"
          ? entree.service_id
          : entree.action === "transfert"
            ? entree.target_line_id
            : null;
    setCible(String(valeur ?? ""));
    setPanne("");
  }

  function nouveau() {
    const libres = "123456789".split("").filter(
      (touche) => !menu.some((item) => item.digit === touche)
    );
    setMode("nouveau");
    setDigit(libres[0] ?? "9");
    setLabel("");
    setAction("reponse");
    setCible("");
    setPanne("");
  }

  async function enregistrer() {
    setEnCours(true);
    setPanne("");
    const corps = {
      digit,
      label: label.trim(),
      action,
      answer_id: action === "reponse" && cible ? Number(cible) : null,
      service_id: action === "rendezvous" && cible ? Number(cible) : null,
      target_line_id: action === "transfert" && cible ? Number(cible) : null,
    };
    try {
      if (mode === "nouveau") {
        await poster<Touche>(`/lines/${ligne.id}/menu`, corps);
      } else {
        await patcher<Touche>(`/menu/${mode}`, corps);
      }
      setMode("");
      route.refresh();
    } catch (erreur) {
      setPanne(texte(erreur));
    } finally {
      setEnCours(false);
    }
  }

  async function retirer() {
    setEnCours(true);
    setPanne("");
    try {
      await supprimer(`/menu/${mode}`);
      setMode("");
      route.refresh();
    } catch (erreur) {
      setPanne(texte(erreur));
    } finally {
      setEnCours(false);
    }
  }

  const options =
    action === "reponse"
      ? fiches.map((item) => ({ value: String(item.id), label: item.statement }))
      : action === "rendezvous"
        ? guichets.map((item) => ({ value: String(item.id), label: item.name }))
        : action === "transfert"
          ? postes
              .filter((item) => item.id !== ligne.id)
              .map((item) => ({ value: String(item.id), label: item.label }))
          : [];

  return (
    <section className="panneau">
      <h2>Les touches de « {ligne.label} »</h2>

      <div className="touche-reglee entete">
        <span>Touche</span>
        <span>Ce que dit la voix</span>
        <span>Ce qui suit</span>
        <span />
      </div>

      {menu.map((item) => (
        <div
          key={item.id}
          className={mode === String(item.id) ? "touche-reglee active" : "touche-reglee"}
        >
          <b className="doigt">{item.digit}</b>
          <span className="dit">{item.label}</span>
          <span className="apres">
            {libelleAction(item.action)}
            <span className="detail">{nomCible(item)}</span>
          </span>
          <span className="actions">
            <button
              className="bouton sobre petit"
              type="button"
              onClick={() => regler(item)}
            >
              Régler
            </button>
          </span>
        </div>
      ))}

      {menu.length === 0 && (
        <p className="vide">
          Aucune touche : l'appelant ne entend que la salutation, puis doit
          parler sans rien presser.
        </p>
      )}

      {mode === "" && (
        <div className="ligne-action">
          <button className="bouton sobre" type="button" onClick={nouveau}>
            Ajouter une touche
          </button>
        </div>
      )}

      {mode !== "" && (
        <div className="reglage-touche">
          <p className="sous">
            {mode === "nouveau" ? "La touche qui manque" : `Touche ${digit}`}
          </p>

          <div className="deux-champs">
            <label className="champ-ligne">
              <span>Doigt pressé</span>
              <select value={digit} onChange={(e) => setDigit(e.target.value)}>
                {"0123456789".split("").map((touche) => (
                  <option key={touche} value={touche}>
                    {touche}
                  </option>
                ))}
              </select>
            </label>
            <label className="champ-ligne">
              <span>Ce qu'elle fait</span>
              <select value={action} onChange={(e) => setAction(e.target.value)}>
                {ACTIONS_TOUCHE.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="champ-ligne">
            <span>Le texte dicté au téléphone</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Retirer un dossier"
            />
          </label>

          {action !== "message" && (
            <label className="champ-ligne">
              <span>Cela mène à</span>
              <select value={cible} onChange={(e) => setCible(e.target.value)}>
                <option value="">Choisir dans la liste</option>
                {options.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {digit === "0" && (
            <p className="attention">
              La touche 0 appartient à la demande d'une personne. En réglant
              autre chose dessus, on ne sait plus joindre un conseiller.
            </p>
          )}

          {panne && <p className="message-erreur">{panne}</p>}
          {entree && (
            <p className="detail">
              Réglée {libelleAction(entree.action)}, la modification garde les
              fiches déjà écrites dans le journal.
            </p>
          )}

          <div className="ligne-action">
            <button
              className="bouton"
              type="button"
              onClick={enregistrer}
              disabled={
                enCours ||
                label.trim().length < 3 ||
                (action !== "message" && cible === "")
              }
            >
              {mode === "nouveau" ? "Régler la touche" : "Enregistrer"}
            </button>
            {mode !== "nouveau" && (
              <button
                className="bouton sobre"
                type="button"
                onClick={retirer}
                disabled={enCours}
              >
                Retirer la touche
              </button>
            )}
            <button className="bouton sobre" type="button" onClick={() => setMode("")}>
              Laisser le menu tel quel
            </button>
          </div>
        </div>
      )}

      <p className="note-bas">
        Poste fermé, seules les touches qui prennent un message restent
        entendables. Les autres ne sonnent pas : l'appelant tombe sur la
        messagerie et l'heure de reprise.
      </p>
    </section>
  );
}

function libelleAction(code: string): string {
  return ACTIONS_TOUCHE.find((item) => item.code === code)?.label ?? code;
}

function texte(erreur: unknown): string {
  return erreur instanceof ErreurApi
    ? erreur.message
    : "Le standard n'a pas répondu. Vérifiez que l'API tourne.";
}
