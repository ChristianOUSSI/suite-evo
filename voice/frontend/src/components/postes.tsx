"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErreurApi, patcher, poster, supprimer } from "@/lib/client-api";
import type { Ligne } from "@/lib/types";

interface Reglage {
  label: string;
  number: string;
  position: number;
  answered_by_human: boolean;
}

const VIDE: Reglage = { label: "", number: "", position: 1, answered_by_human: true };

export function Postes({
  lignes,
  active,
  detail,
}: {
  lignes: Ligne[];
  active: number;
  detail: Ligne | null;
}) {
  const route = useRouter();
  const [mode, setMode] = useState("");
  const [reglage, setReglage] = useState<Reglage>(VIDE);
  const [panne, setPanne] = useState("");
  const [enCours, setEnCours] = useState(false);

  function ouvrirNouveau() {
    const prochain = Math.min(
      12,
      lignes.reduce((max, ligne) => Math.max(max, ligne.position), 0) + 1
    );
    setReglage({ ...VIDE, position: prochain });
    setPanne("");
    setMode("nouveau");
  }

  function regler() {
    if (!detail) return;
    setReglage({
      label: detail.label,
      number: detail.number,
      position: detail.position,
      answered_by_human: detail.answered_by_human,
    });
    setPanne("");
    setMode("modifier");
  }

  async function enregistrer() {
    setEnCours(true);
    setPanne("");
    const corps = {
      label: reglage.label.trim(),
      number: reglage.number.trim(),
      position: reglage.position,
      answered_by_human: reglage.answered_by_human,
    };
    try {
      const ecrit =
        mode === "nouveau"
          ? await poster<Ligne>("/lines", corps)
          : await patcher<Ligne>(`/lines/${active}`, corps);
      setMode("");
      route.push(`/standard?poste=${ecrit.id}`, { scroll: false });
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
      await supprimer(`/lines/${active}`);
      setMode("");
      route.push("/standard", { scroll: false });
      route.refresh();
    } catch (erreur) {
      setPanne(texte(erreur));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <section className="panneau">
      <h2>Les postes décrochés</h2>

      <div className="postes">
        {lignes.map((ligne) => (
          <div key={ligne.id} className={ligne.id === active ? "poste actif" : "poste"}>
            <Link href={`/standard?poste=${ligne.id}`}>
              <span className="nom">{ligne.label}</span>
              <span className="numero">{ligne.number_display || "sans numéro dit"}</span>
              <span className="touchees">
                {ligne.menu_size
                  ? `${ligne.menu_size} touche${ligne.menu_size > 1 ? "s" : ""} réglée${ligne.menu_size > 1 ? "s" : ""}`
                  : "aucune touche"}
              </span>
            </Link>
            <span className={ligne.answered_by_human ? "tient humain" : "tient voix"}>
              {ligne.answered_by_human ? "une personne peut tenir" : "tenu par la voix"}
            </span>
          </div>
        ))}
      </div>

      {mode === "" && (
        <div className="ligne-action">
          <button className="bouton sobre" type="button" onClick={ouvrirNouveau}>
            Ajouter un poste
          </button>
          {detail && (
            <button className="bouton sobre" type="button" onClick={regler}>
              Régler « {detail.label} »
            </button>
          )}
        </div>
      )}

      {mode !== "" && (
        <div className="reglage-poste">
          <p className="sous">
            {mode === "nouveau" ? "Le poste qui manque" : `Ce que devient « ${detail?.label} »`}
          </p>

          <label className="champ-ligne">
            <span>Nom du poste</span>
            <input
              value={reglage.label}
              onChange={(e) => setReglage({ ...reglage, label: e.target.value })}
              placeholder="Scolarité, année 2"
            />
          </label>

          <div className="deux-champs">
            <label className="champ-ligne">
              <span>Numéro décroché</span>
              <input
                value={reglage.number}
                onChange={(e) => setReglage({ ...reglage, number: e.target.value })}
                placeholder="233 42 55 18"
              />
            </label>
            <label className="champ-ligne">
              <span>Rang dans le menu</span>
              <select
                value={reglage.position}
                onChange={(e) =>
                  setReglage({ ...reglage, position: Number(e.target.value) })
                }
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map((rang) => (
                  <option key={rang} value={String(rang)}>
                    {rang}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="case">
            <input
              type="checkbox"
              checked={reglage.answered_by_human}
              onChange={(e) =>
                setReglage({ ...reglage, answered_by_human: e.target.checked })
              }
            />
            Une personne peut encore décrocher sur ce poste
          </label>
          <p className="attention">
            Décoché, la voix tient seule : la touche 0 écrit un message au lieu
            de faire sonner un bureau.
          </p>

          {panne && <p className="message-erreur">{panne}</p>}

          <div className="ligne-action">
            <button
              className="bouton"
              type="button"
              onClick={enregistrer}
              disabled={enCours || reglage.label.trim().length < 2}
            >
              {mode === "nouveau" ? "Ouvrir le poste" : "Enregistrer"}
            </button>
            {mode === "modifier" && (
              <button
                className="bouton sobre"
                type="button"
                onClick={retirer}
                disabled={enCours}
              >
                Retirer ce poste
              </button>
            )}
            <button className="bouton sobre" type="button" onClick={() => setMode("")}>
              Finalement non
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function texte(erreur: unknown): string {
  return erreur instanceof ErreurApi
    ? erreur.message
    : "Le standard n'a pas répondu. Vérifiez que l'API tourne.";
}
