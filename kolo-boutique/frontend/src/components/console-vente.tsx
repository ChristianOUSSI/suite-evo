"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icone } from "./icone";
import { MentionDemo } from "./mention-demo";
import { ecrire } from "@/lib/client-api";
import { ErreurComptoir } from "@/lib/errors";
import { t, LANGUE_DEFAUT, type Langue } from "@/lib/langue";
import type { Cahier } from "@/lib/types";

const RAILS = [
  { cle: "especes", cleLabel: "vente.rail-especes" },
  { cle: "momo_mtn", cleLabel: null },
  { cle: "momo_orange", cleLabel: null },
  { cle: "credit", cleLabel: "vente.rail-credit" },
];

const LABEL_RAIL: Record<string, string> = {
  momo_mtn: "MTN MoMo",
  momo_orange: "Orange Money",
};

export function ConsoleVente({
  cahier,
  boutique,
  langue = LANGUE_DEFAUT,
}: {
  cahier: Cahier;
  boutique: { especes_actifs: boolean; momo_actif: boolean; orange_actif: boolean; credit_accorde: boolean };
  langue?: Langue;
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
      setIncident(t("vente.incident-choix", langue));
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
        t("vente.message", langue, {
          quantite: nombre,
          unite: produit.unite,
          produit: produit.nom,
          chiffre: rendu.vente.chiffre_label,
          benefice: rendu.vente.benefice_label,
          stock: rendu.produit.stock,
          unite2: rendu.produit.unite,
        }),
      );
      routeur.refresh();
    } catch (erreur) {
      setIncident(
        erreur instanceof ErreurComptoir
          ? erreur.message
          : t("vente.incident-echec", langue),
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="pile-champs">
      <div className="champ">
        <label htmlFor="vente-produit">{t("vente.article", langue)}</label>
        <select
          id="vente-produit"
          value={produitId}
          onChange={(e) => setProduitId(e.target.value)}
        >
          <option value="">{t("vente.choisir", langue)}</option>
          {cahier.produits.map((un) => (
            <option key={un.id} value={un.id}>
              {un.nom} · {un.prix_vente_label} · {t("vente.reste", langue, { stock: un.stock })}
            </option>
          ))}
        </select>
      </div>

      <div className="grille-champs">
        <div className="champ">
          <label htmlFor="vente-quantite">{t("vente.quantite", langue)}</label>
          <input
            id="vente-quantite"
            inputMode="numeric"
            value={quantite}
            onChange={(e) => setQuantite(e.target.value)}
          />
        </div>
        <div className="champ">
          <label htmlFor="vente-prix">{t("vente.prix-cede", langue)}</label>
          <input
            id="vente-prix"
            value={produit ? produit.prix_vente_label : t("vente.prix-rayon", langue)}
            readOnly
          />
        </div>
        <div className="champ">
          <label htmlFor="vente-total">{t("vente.total", langue)}</label>
          <input
            id="vente-total"
            value={
              produit && nombre > 0
                ? `${(produit.prix_vente * nombre).toLocaleString("fr-FR")} FCFA`
                : t("vente.rien", langue)
            }
            readOnly
          />
        </div>
      </div>

      <div className="champ">
        <span className="champ__titre">{t("vente.rail", langue)}</span>
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
              {rail.cleLabel ? t(rail.cleLabel, langue) : LABEL_RAIL[rail.cle]}
            </button>
          ))}
          {railsOuverts.length === 0 ? (
            <span className="champ__aide">{t("vente.rails-coupes", langue)}</span>
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
          {t("vente.ecrire", langue)}
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

      <MentionDemo texte={t("vente.demo", langue)} langue={langue} />
    </div>
  );
}
