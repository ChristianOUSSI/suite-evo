"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icone } from "./icone";
import { MentionDemo } from "./mention-demo";
import { ecrire } from "@/lib/client-api";
import { ErreurComptoir } from "@/lib/errors";
import type { Cahier } from "@/lib/types";

const RAILS = [
  { cle: "especes", label: "Espèces" },
  { cle: "momo_mtn", label: "MTN MoMo" },
  { cle: "momo_orange", label: "Orange Money" },
  { cle: "credit", label: "À crédit" },
];

export function ConsoleVente({
  cahier,
  boutique,
}: {
  cahier: Cahier;
  boutique: { especes_actifs: boolean; momo_actif: boolean; orange_actif: boolean; credit_accorde: boolean };
}) {
  const routeur = useRouter();
  const [produitId, setProduitId] = useState<string>("");
  const [quantite, setQuantite] = useState("1");
  const [mode, setMode] = useState("especes");
  const [message, setMessage] = useState<string | null>(null);
  const [incident, setIncident] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const produit = cahier.produits.find((un) => un.id === Number(produitId)) ?? null;
  const nombre = Number.parseInt(quantite.replace(/\D/g, ""), 10) || 0;
  const assez = produit !== null && nombre > 0;

  const railsOuverts = RAILS.filter((rail) => {
    if (rail.cle === "especes") return boutique.especes_actifs;
    if (rail.cle === "momo_mtn") return boutique.momo_actif;
    if (rail.cle === "momo_orange") return boutique.orange_actif;
    return boutique.credit_accorde;
  });

  async function vendre() {
    if (!produit || nombre <= 0) {
      setIncident("Choisis un article et une quantité.");
      return;
    }
    setEnCours(true);
    setMessage(null);
    setIncident(null);
    try {
      const rendu = await ecrire<{
        vente: { id: number; chiffre_label: string; benefice_label: string };
        produit: { stock: number; unite: string };
      }>("/ventes", {
        body: { produit_id: produit.id, quantite: nombre, mode },
      });
      setMessage(
        `${nombre} ${produit.unite} de ${produit.nom} · ${rendu.vente.chiffre_label}, bénéfice ${rendu.vente.benefice_label}. Il reste ${rendu.produit.stock} ${rendu.produit.unite}.`,
      );
      routeur.refresh();
    } catch (erreur) {
      setIncident(
        erreur instanceof ErreurComptoir
          ? erreur.message
          : "La vente n'est pas entrée au cahier.",
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="pile-champs">
      <div className="champ">
        <label htmlFor="vente-produit">Article</label>
        <select
          id="vente-produit"
          value={produitId}
          onChange={(e) => setProduitId(e.target.value)}
        >
          <option value="">Choisir au rayon</option>
          {cahier.produits.map((un) => (
            <option key={un.id} value={un.id}>
              {un.nom} · {un.prix_vente_label} · reste {un.stock}
            </option>
          ))}
        </select>
      </div>

      <div className="grille-champs">
        <div className="champ">
          <label htmlFor="vente-quantite">Quantité</label>
          <input
            id="vente-quantite"
            inputMode="numeric"
            value={quantite}
            onChange={(e) => setQuantite(e.target.value)}
          />
        </div>
        <div className="champ">
          <label htmlFor="vente-prix">Prix cédé</label>
          <input
            id="vente-prix"
            value={produit ? produit.prix_vente_label : "prix du rayon"}
            readOnly
          />
        </div>
        <div className="champ">
          <label htmlFor="vente-total">Total</label>
          <input
            id="vente-total"
            value={
              produit && nombre > 0
                ? `${(produit.prix_vente * nombre).toLocaleString("fr-FR")} FCFA`
                : "rien encore choisi"
            }
            readOnly
          />
        </div>
      </div>

      <div className="champ">
        <span className="champ__titre">Rail</span>
        <div className="dictee__exemples">
          {railsOuverts.map((rail) => (
            <button
              type="button"
              key={rail.cle}
              className="dictee__exemple"
              style={
                mode === rail.cle
                  ? { borderColor: "var(--encre)", color: "var(--encre)" }
                  : undefined
              }
              onClick={() => setMode(rail.cle)}
            >
              {rail.label}
            </button>
          ))}
          {railsOuverts.length === 0 ? (
            <span className="champ__aide">
              Tous les rails sont coupés au comptoir. Ouvre-en un dans les
              réglages.
            </span>
          ) : null}
        </div>
      </div>

      <div className="acts">
        <button
          type="button"
          className="bouton bouton--brique"
          onClick={vendre}
          disabled={enCours || !assez}
        >
          Écrire la vente
          <span className="bouton__fleche">
            <Icone nom="vente" taille={15} />
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

      <MentionDemo texte="Démo : la vente est consignée et le stock bouge. Aucun débit n'est demandé à un opérateur." />
    </div>
  );
}
