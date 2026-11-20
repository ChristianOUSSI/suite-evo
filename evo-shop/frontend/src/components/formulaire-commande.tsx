"use client";

import { useMemo, useState } from "react";

import { formats } from "@/lib/format";
import { traduire } from "@/lib/langue";
import type { CommandeEnvoyee, ProduitPublic } from "@/lib/types";

type Props = { langue: string; produits: ProduitPublic[] };

type Ligne = { produit_id: number; quantite: number };

function texteErreur(payload: unknown, langue: string, repli: string): string {
  const detail = (payload as { detail?: unknown })?.detail;
  if (detail && typeof detail === "object") {
    const corps = detail as { fr?: string; en?: string };
    return corps[langue === "en" ? "en" : "fr"] ?? corps.fr ?? repli;
  }
  return typeof detail === "string" ? detail : repli;
}

/**
 * La commande publique : le client remplit son panier, laisse son nom et
 * son numéro. La boutique rappelle pour encaisser et retirer - le stock
 * ne descend qu'à la validation par la caisse.
 */
export function FormulaireCommande({ langue, produits }: Props) {
  const t = traduire(langue).t;
  const f = formats(langue);
  const [panier, setPanier] = useState<Ligne[]>([]);
  const [form, setForm] = useState({ nom: "", telephone: "", note: "" });
  const [envoye, setEnvoye] = useState<CommandeEnvoyee | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const parId = useMemo(
    () => new Map(produits.map((un) => [un.id, un])),
    [produits],
  );
  const total = panier.reduce((somme, ligne) => {
    const produit = parId.get(ligne.produit_id);
    return somme + (produit ? ligne.quantite * produit.prix_vente : 0);
  }, 0);

  function ajouter(produit: ProduitPublic) {
    setPanier((actuelles) => {
      const deja = actuelles.find((un) => un.produit_id === produit.id);
      const quantite = (deja?.quantite ?? 0) + 1;
      if (quantite > produit.stock) return actuelles;
      if (deja) {
        return actuelles.map((un) =>
          un.produit_id === produit.id ? { ...un, quantite } : un,
        );
      }
      return [...actuelles, { produit_id: produit.id, quantite: 1 }];
    });
  }

  function ajuster(produit_id: number, quantite: number, stock: number) {
    setPanier((actuelles) =>
      actuelles
        .map((un) =>
          un.produit_id === produit_id
            ? { ...un, quantite: Math.min(quantite, stock) }
            : un,
        )
        .filter((un) => un.quantite > 0),
    );
  }

  async function envoyer(evenement: React.FormEvent) {
    evenement.preventDefault();
    if (panier.length === 0) return;
    setEnCours(true);
    setErreur(null);
    try {
      const reponse = await fetch("/api/public/commandes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          client_nom: form.nom,
          client_telephone: form.telephone,
          lignes: panier,
          note: form.note,
        }),
      });
      const payload = await reponse.json().catch(() => null);
      if (!reponse.ok) {
        throw new Error(
          texteErreur(
            payload,
            langue,
            langue === "en"
              ? "The shop did not accept this order."
              : "La boutique n'a pas accepté cette commande.",
          ),
        );
      }
      setEnvoye(payload as CommandeEnvoyee);
      setPanier([]);
      setForm({ nom: "", telephone: "", note: "" });
    } catch (e) {
      setErreur(e instanceof Error ? e.message : t("commun.horsLigne"));
    } finally {
      setEnCours(false);
    }
  }

  if (envoye) {
    return (
      <div className="cadc-carte cadc-pile">
        <p className="cadc-note cadc-note--acier" role="status">
          {t("commander.ok-titre")}
        </p>
        <p className="cadc-note">
          {t("commander.ok-texte", {
            reference: envoye.reference,
            total: f.fcfa(envoye.total),
          })}
        </p>
        <p className="cadc-note">{t("commander.aide")}</p>
        <div className="cadc-acts">
          <button
            type="button"
            className="cadc-bouton cadc-bouton--premier"
            onClick={() => setEnvoye(null)}
          >
            {t("commander.encore")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="cadc-pile" onSubmit={envoyer}>
      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {produits.map((produit) => {
          const ligne = panier.find((un) => un.produit_id === produit.id);
          const quantite = ligne?.quantite ?? 0;
          return (
            <li className="cadc-ligne" key={produit.id}>
              <span className="cadc-ligne__nom">
                {produit.nom}
                <small>
                  {f.fcfa(produit.prix_vente)} · {t(`unite.${produit.unite}`)} ·{" "}
                  {t("commander.stock", { nombre: produit.stock })}
                </small>
              </span>
              <span className="cadc-ligne__valeur">
                <span className="cadc-acts" style={{ justifyContent: "flex-end" }}>
                  {quantite > 0 ? (
                    <>
                      <button
                        type="button"
                        className="cadc-bouton cadc-bouton--petit cadc-bouton--doux"
                        onClick={() => ajuster(produit.id, quantite - 1, produit.stock)}
                      >
                        −
                      </button>
                      <strong>{quantite}</strong>
                    </>
                  ) : null}
                  <button
                    type="button"
                    className="cadc-bouton cadc-bouton--petit"
                    onClick={() => ajouter(produit)}
                    disabled={quantite >= produit.stock}
                  >
                    +
                  </button>
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      {panier.length > 0 ? (
        <div className="cadc-carte cadc-pile">
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("commander.nom")}</span>
              <input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                maxLength={160}
                autoComplete="name"
                required
              />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("commander.telephone")}</span>
              <input
                value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                inputMode="tel"
                placeholder="6 77 12 34 56"
                autoComplete="tel"
              />
            </label>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("commander.note")}</span>
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
            {enCours
              ? t("commander.envoi")
              : t("commander.envoyer", { total: f.fcfa(total) })}
          </button>
          <p className="cadc-note">{t("commander.aide")}</p>
        </div>
      ) : (
        <p className="cadc-note">{t("commander.vide-panier")}</p>
      )}
    </form>
  );
}
