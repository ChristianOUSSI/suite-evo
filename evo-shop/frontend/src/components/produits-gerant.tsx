"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { formats } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import type { Produit, ProduitEntree, Unite } from "@/lib/types";

type Props = { produits: Produit[]; langue: string; responsable: boolean };

const UNITES: Unite[] = ["piece", "sac", "kg", "litre", "carton", "paquet"];
const VIDE = { nom: "", unite: "piece" as Unite, prix_achat: 0, prix_vente: 0, stock: 0, seuil_alerte: 0, note: "" };

/**
 * Les articles de la boutique. Prix, stock et fiche : le responsable seul.
 * Le stock ne se règle pas ici - il bouge à la vente, à l'annulation et au
 * réapprovisionnement, qui laisse sa trace dans la note.
 */
export function ProduitsGerant({ produits, langue, responsable }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const f = formats(langue);
  const [ajout, setAjout] = useState(VIDE);
  const [ouvert, setOuvert] = useState(false);
  const [erreurs, setErreurs] = useState<Record<number, string>>({});
  const [erreurAjout, setErreurAjout] = useState<string | null>(null);
  const [reassort, setReassort] = useState<Record<number, string>>({});
  const [enCours, setEnCours] = useState<number | "ajout" | null>(null);

  async function ajouter() {
    setEnCours("ajout");
    setErreurAjout(null);
    try {
      const corps: ProduitEntree = {
        nom: ajout.nom.trim(),
        unite: ajout.unite,
        prix_achat: ajout.prix_achat,
        prix_vente: ajout.prix_vente,
        stock: ajout.stock,
        seuil_alerte: ajout.seuil_alerte,
        note: ajout.note,
      };
      await ecrire<Produit>("/produits", { body: corps, langue });
      setAjout(VIDE);
      setOuvert(false);
      routeur.refresh();
    } catch (e) {
      setErreurAjout(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  async function corriger(produit: Produit, patch: Record<string, unknown>) {
    setEnCours(produit.id);
    setErreurs((actuelles) => ({ ...actuelles, [produit.id]: "" }));
    try {
      await ecrire<Produit>(`/produits/${produit.id}`, { method: "PATCH", body: patch, langue });
      routeur.refresh();
    } catch (e) {
      setErreurs((actuelles) => ({
        ...actuelles,
        [produit.id]: e instanceof ErreurChantier ? e.message : t("commun.horsLigne"),
      }));
      setEnCours(null);
    }
  }

  async function reapprovisionner(produit: Produit) {
    const brut = (reassort[produit.id] ?? "").trim();
    const quantite = Number(brut);
    if (!Number.isInteger(quantite) || quantite <= 0) return;
    setEnCours(produit.id);
    try {
      await ecrire<Produit>(`/produits/${produit.id}/stock`, {
        body: { quantite, note: "" },
        langue,
      });
      setReassort((actuelles) => ({ ...actuelles, [produit.id]: "" }));
      routeur.refresh();
    } catch (e) {
      setErreurs((actuelles) => ({
        ...actuelles,
        [produit.id]: e instanceof ErreurChantier ? e.message : t("commun.horsLigne"),
      }));
      setEnCours(null);
    }
  }

  return (
    <div className="cadc-pile">
      {responsable ? (
        <div className="cadc-acts">
          <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={() => setOuvert((v) => !v)}>
            {ouvert ? t("commun.fermer") : t("produits.nouveau")}
          </button>
        </div>
      ) : null}

      {ouvert ? (
        <div className="cadc-carte cadc-pile">
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("produits.nom")}</span>
              <input value={ajout.nom} onChange={(e) => setAjout({ ...ajout, nom: e.target.value })} maxLength={160} autoComplete="off" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("produits.unite")}</span>
              <select value={ajout.unite} onChange={(e) => setAjout({ ...ajout, unite: e.target.value as Unite })}>
                {UNITES.map((un) => (
                  <option key={un} value={un}>{t(`unite.${un}`)}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("produits.prix-achat")}</span>
              <input type="number" min={0} step={100} value={ajout.prix_achat} onChange={(e) => setAjout({ ...ajout, prix_achat: Number(e.target.value) })} />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("produits.prix-vente")}</span>
              <input type="number" min={0} step={100} value={ajout.prix_vente} onChange={(e) => setAjout({ ...ajout, prix_vente: Number(e.target.value) })} />
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("produits.stock")}</span>
              <input type="number" min={0} value={ajout.stock} onChange={(e) => setAjout({ ...ajout, stock: Number(e.target.value) })} />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("produits.seuil")}</span>
              <input type="number" min={0} value={ajout.seuil_alerte} onChange={(e) => setAjout({ ...ajout, seuil_alerte: Number(e.target.value) })} />
            </label>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("clients.note")}</span>
            <input value={ajout.note} onChange={(e) => setAjout({ ...ajout, note: e.target.value })} maxLength={600} autoComplete="off" />
          </label>
          {erreurAjout ? <p className="cadc-note cadc-note--rouge" role="alert">{erreurAjout}</p> : null}
          <div className="cadc-acts">
            <button type="button" className="cadc-bouton cadc-bouton--premier" disabled={enCours !== null || ajout.nom.trim().length < 2} onClick={ajouter}>
              {enCours === "ajout" ? t("commun.ecriture") : t("produits.nouveau")}
            </button>
          </div>
        </div>
      ) : null}

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {produits.map((produit) => {
          const marge = produit.prix_vente - produit.prix_achat;
          const classe = !produit.actif ? " ouvrier--sorti" : produit.stock === 0 ? " produit--rupture" : produit.stock <= produit.seuil_alerte ? " produit--alerte" : "";
          return (
            <li className={`cadc-ligne${classe}`} key={produit.id}>
              <span className="cadc-ligne__nom">
                {produit.nom}
                <small>
                  {t(`unite.${produit.unite}`)} · {f.fcfa(produit.prix_achat)} → {f.fcfa(produit.prix_vente)}
                  {produit.note ? ` · ${produit.note}` : ""}
                </small>
                {responsable ? (
                  <span className="cadc-acts" style={{ marginTop: 6 }}>
                    <input
                      type="number"
                      min={1}
                      placeholder={t("produits.reassort")}
                      value={reassort[produit.id] ?? ""}
                      onChange={(e) => setReassort((actuelles) => ({ ...actuelles, [produit.id]: e.target.value }))}
                      style={{ width: 72 }}
                    />
                    <button type="button" className="cadc-bouton cadc-bouton--petit cadc-bouton--doux" disabled={enCours === produit.id || !(Number(reassort[produit.id]) > 0)} onClick={() => reapprovisionner(produit)}>
                      {t("produits.reassort")}
                    </button>
                  </span>
                ) : null}
              </span>
              <span className="cadc-ligne__valeur">
                <strong>{produit.stock}</strong>
                <br />
                <small>{f.fcfa(marge)} {t("produits.marge").toLowerCase()}</small>
                <br />
                <button
                  type="button"
                  className="cadc-bouton cadc-bouton--petit cadc-bouton--doux"
                  disabled={enCours === produit.id || !responsable}
                  onClick={() => corriger(produit, { actif: !produit.actif })}
                >
                  {produit.actif ? t("chambres.sortir") : t("chambres.reprendre")}
                </button>
                {erreurs[produit.id] ? (
                  <span className="cadc-note cadc-note--rouge" role="status">{erreurs[produit.id]}</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
