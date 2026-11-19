"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { formats } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import type { Produit, Unite, Vente, VenteEntree } from "@/lib/types";

type Props = { ventes: Vente[]; produits: Produit[]; langue: string };

type LignePanier = { produit_id: number; quantite: number };

/**
 * La caisse : le ticket se compose ligne à ligne, le total se calcule,
 * le stock descend à la validation. Annuler rend le stock, jamais l'oubli.
 */
export function CaisseGerant({ ventes, produits, langue }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const f = formats(langue);
  const [panier, setPanier] = useState<LignePanier[]>([]);
  const [client, setClient] = useState("");
  const [ouvert, setOuvert] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<number | "vente" | null>(null);
  const [ticketFait, setTicketFait] = useState<number | null>(null);

  const disponibles = produits.filter((un) => un.actif && un.stock > 0);

  const total = panier.reduce((somme, ligne) => {
    const produit = produits.find((un) => un.id === ligne.produit_id);
    return somme + (produit ? ligne.quantite * produit.prix_vente : 0);
  }, 0);

  function ajouter(produit: Produit) {
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

  function ajuster(produit_id: number, quantite: number) {
    setPanier((actuelles) =>
      actuelles
        .map((un) => (un.produit_id === produit_id ? { ...un, quantite } : un))
        .filter((un) => un.quantite > 0),
    );
  }

  async function encaisser() {
    setEnCours("vente");
    setErreur(null);
    try {
      const corps: VenteEntree = {
        lignes: panier,
        client_nom: client,
        note: "",
      };
      const vente = await ecrire<Vente>("/ventes", { body: corps, langue });
      setTicketFait(vente.id);
      setPanier([]);
      setClient("");
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
    } finally {
      setEnCours(null);
    }
  }

  async function annuler(vente: Vente) {
    setEnCours(vente.id);
    setErreur(null);
    try {
      await ecrire<Vente>(`/ventes/${vente.id}`, {
        method: "PATCH",
        body: { statut: "annulee" },
        langue,
      });
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  return (
    <div className="cadc-pile">
      {ticketFait ? (
        <p className="cadc-note cadc-note--vert" role="status">
          {t("ventes.nouveau")} · #{ticketFait}
        </p>
      ) : null}

      <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={() => setOuvert((v) => !v)}>
        {ouvert ? t("commun.fermer") : t("ventes.nouveau")}
      </button>

      {ouvert ? (
        <div className="cadc-carte cadc-pile">
          <div className="cadc-grille">
            {disponibles.map((produit) => (
              <button
                key={produit.id}
                type="button"
                className={`cadc-bouton ${produit.stock <= produit.seuil_alerte ? "cadc-bouton--doux" : ""}`}
                onClick={() => ajouter(produit)}
                disabled={enCours !== null}
                style={{ textAlign: "left", justifyContent: "flex-start" }}
              >
                {produit.nom}
                <small style={{ display: "block", opacity: 0.8 }}>
                  {f.fcfa(produit.prix_vente)} · {produit.stock} {t(`unite.${produit.unite}` as `unite.${Unite}`)}
                </small>
              </button>
            ))}
          </div>

          {panier.length > 0 ? (
            <ul className="cadc-liste cadc-pile cadc-pile--serree">
              {panier.map((ligne) => {
                const produit = produits.find((un) => un.id === ligne.produit_id);
                if (!produit) return null;
                return (
                  <li className="cadc-ligne" key={ligne.produit_id}>
                    <span className="cadc-ligne__nom">
                      {produit.nom}
                      <small>{f.fcfa(produit.prix_vente)} / {t(`unite.${produit.unite}` as `unite.${Unite}`)}</small>
                    </span>
                    <span className="cadc-ligne__valeur">
                      <span className="cadc-acts">
                        <button type="button" className="cadc-bouton cadc-bouton--petit cadc-bouton--doux" onClick={() => ajuster(produit.id, ligne.quantite - 1)} disabled={enCours !== null}>−</button>
                        <strong>{ligne.quantite}</strong>
                        <button type="button" className="cadc-bouton cadc-bouton--petit cadc-bouton--doux" onClick={() => ajuster(produit.id, ligne.quantite + 1)} disabled={enCours !== null || ligne.quantite >= produit.stock}>+</button>
                      </span>
                      <small style={{ display: "block", textAlign: "right" }}>{f.fcfa(ligne.quantite * produit.prix_vente)}</small>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("ventes.client")}</span>
            <input value={client} onChange={(e) => setClient(e.target.value)} maxLength={160} autoComplete="off" />
          </label>

          <div className="cadc-acts" style={{ justifyContent: "space-between" }}>
            <strong style={{ fontFamily: "var(--cadc-mono)", fontSize: "1.2rem" }}>
              {f.fcfa(total)}
            </strong>
            <button
              type="button"
              className="cadc-bouton cadc-bouton--premier"
              disabled={enCours !== null || panier.length === 0}
              onClick={encaisser}
            >
              {enCours === "vente" ? t("commun.ecriture") : t("ventes.nouveau")}
            </button>
          </div>
          {erreur ? <p className="cadc-note cadc-note--rouge" role="alert">{erreur}</p> : null}
        </div>
      ) : null}

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {ventes.map((vente) => (
          <li className={`cadc-ligne${vente.statut === "annulee" ? " ticket--annule" : ""}`} key={vente.id}>
            <span className="cadc-ligne__nom">
              #{vente.id}
              <small>
                {f.date(vente.cree_le)} · {f.heure(vente.cree_le)} · {vente.lignes.length} {t("ventes.lignes")}
                {vente.client_nom ? ` · ${vente.client_nom}` : ""}
              </small>
            </span>
            <span className="cadc-ligne__valeur">
              {f.fcfa(vente.total)}
              <br />
              {vente.statut === "annulee" ? (
                <span className="cadc-badge cadc-badge--doux">-</span>
              ) : (
                <span className="cadc-badge cadc-badge--vert">OK</span>
              )}
              {vente.statut === "validee" ? (
                <span className="cadc-acts">
                  <button
                    type="button"
                    className="cadc-bouton cadc-bouton--petit cadc-bouton--doux"
                    disabled={enCours === vente.id}
                    onClick={() => annuler(vente)}
                  >
                    {t("ventes.annuler")}
                  </button>
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
