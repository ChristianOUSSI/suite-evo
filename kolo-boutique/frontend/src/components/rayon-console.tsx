"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icone } from "./icone";
import { MentionDemo } from "./mention-demo";
import { ecrire } from "@/lib/client-api";
import { ErreurComptoir } from "@/lib/errors";
import type { Cahier, Produit, ProduitEntree } from "@/lib/types";

const VIDE: ProduitEntree = {
  nom: "",
  categorie: "épicerie",
  unite: "pièce",
  prix_achat: 0,
  prix_vente: 0,
  stock: 0,
  alerte_stock: 5,
  mots_cles: "",
};

const CATEGORIES = [
  "épicerie",
  "boisson",
  "ménage",
  "courant",
  "service",
  "fourre-tout",
];

const UNITES = ["pièce", "kg", "litre", "sac", "carte", "boîte", "bouteille", "unité"];

export function RayonConsole({ cahier }: { cahier: Cahier }) {
  const routeur = useRouter();
  const [choisie, setChoisie] = useState<number | null>(null);
  const [nouveau, setNouveau] = useState(false);
  const [champ, setChamp] = useState<ProduitEntree>(VIDE);
  const [entree, setEntree] = useState<{ quantite: string; cout: string }>({
    quantite: "",
    cout: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [incident, setIncident] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const ligne = choisie === null ? null : cahier.produits.find((un) => un.id === choisie) ?? null;

  function choisir(produit: Produit) {
    setChoisie(produit.id);
    setNouveau(false);
    setMessage(null);
    setIncident(null);
    setChamp({
      nom: produit.nom,
      categorie: produit.categorie,
      unite: produit.unite,
      prix_achat: produit.prix_achat,
      prix_vente: produit.prix_vente,
      stock: produit.stock,
      alerte_stock: produit.alerte_stock,
      mots_cles: produit.mots_cles,
    });
  }

  function creer() {
    setNouveau(true);
    setChoisie(null);
    setMessage(null);
    setIncident(null);
    setChamp(VIDE);
  }

  function nombre(cle: "prix_achat" | "prix_vente" | "alerte_stock") {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setChamp((actuel) => ({
        ...actuel,
        [cle]: Number.parseInt(e.target.value.replace(/\D/g, ""), 10) || 0,
      }));
  }

  async function enregistrer(evenement: React.FormEvent) {
    evenement.preventDefault();
    if (champ.nom.trim().length < 1 || champ.prix_vente <= 0) {
      setIncident("Un article demande un nom et un prix de vente.");
      return;
    }
    setEnCours(true);
    setMessage(null);
    setIncident(null);
    try {
      if (nouveau || choisie === null) {
        await ecrire<Produit>("/produits", { body: champ });
        setMessage(`${champ.nom} entre au rayon.`);
      } else {
        await ecrire<Produit>(`/produits/${choisie}`, { method: "PATCH", body: champ });
        setMessage(`Rayon de ${champ.nom} recouché.`);
      }
      routeur.refresh();
    } catch (erreur) {
      setIncident(
        erreur instanceof ErreurComptoir
          ? erreur.message
          : "Le rayon n'a pas accepté cette fiche.",
      );
    } finally {
      setEnCours(false);
    }
  }

  async function racheter() {
    if (ligne === null) {
      return;
    }
    const quantite = Number.parseInt(entree.quantite.replace(/\D/g, ""), 10) || 0;
    const cout = Number.parseInt(entree.cout.replace(/\D/g, ""), 10) || 0;
    if (quantite <= 0 || cout < 0) {
      setIncident("Un rachat demande une quantité et un coût par unité.");
      return;
    }
    setEnCours(true);
    setMessage(null);
    setIncident(null);
    try {
      await ecrire<{ entree: { total_label: string }; produit: Produit }>("/entrees", {
        body: { produit_id: ligne.id, quantite, cout_unitaire: cout },
      });
      setMessage(
        `${quantite} ${ligne.unite} de ${ligne.nom} en réserve pour ${cout * quantite} FCFA.`,
      );
      setEntree({ quantite: "", cout: "" });
      routeur.refresh();
    } catch (erreur) {
      setIncident(
        erreur instanceof ErreurComptoir
          ? erreur.message
          : "Le rachat n'est pas passé au cahier.",
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="pilees-deux">
      <section className="feuille bloc" aria-label="Le rayon">
        <div className="tete-feuille">
          <h2>Le rayon</h2>
          <span className="tete-feuille__cote">
            {cahier.total} lignes · {cahier.en_alerte} en alerte
          </span>
        </div>

        <table className="rayon-table">
          <thead>
            <tr>
              <th>Article</th>
              <th className="droite">Stock</th>
              <th className="droite">Coût</th>
              <th className="droite">Vendu</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {cahier.produits.map((produit) => (
              <tr key={produit.id}>
                <td>
                  <span className="rayon-table__nom">
                    {produit.nom}
                    <small>
                      {produit.categorie} · {produit.mots_cles || "sans mot dicté"}
                    </small>
                  </span>
                </td>
                <td className="droite">
                  <span
                    className={`stock-boite${
                      produit.en_alerte ? " stock-boite--alerte" : ""
                    }`}
                  >
                    {produit.stock}
                    <small>{produit.unite}</small>
                  </span>
                </td>
                <td className="droite">{produit.prix_achat_label}</td>
                <td className="droite">{produit.prix_vente_label}</td>
                <td className="droite">
                  <button
                    type="button"
                    className="bouton bouton--petit bouton--doux"
                    onClick={() => choisir(produit)}
                  >
                    Ouvrir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {cahier.produits.length === 0 ? (
          <p className="champ__aide">
            Le rayon est vide. Ajoute la première ligne, ou dicte-lui un article
            que tu connais déjà.
          </p>
        ) : null}
      </section>

      <section className="feuille bloc" aria-label="Fiche de l’article">
        {nouveau || ligne !== null ? (
          <form onSubmit={enregistrer}>
            <div className="tete-feuille">
              <h2>{nouveau ? "Nouvelle ligne" : (ligne?.nom ?? "Article")}</h2>
              <span className="tete-feuille__cote">
                {ligne ? `réservé : ${ligne.stock} ${ligne.unite}` : "rien encore écrit"}
              </span>
            </div>

            <div className="pile-champs" style={{ marginTop: "1rem" }}>
              <div className="champ">
                <label htmlFor="rayon-nom">Nom de l’article</label>
                <input
                  id="rayon-nom"
                  value={champ.nom}
                  onChange={(e) =>
                    setChamp((actuel) => ({ ...actuel, nom: e.target.value }))
                  }
                  maxLength={120}
                  required
                />
              </div>

              <div className="grille-champs">
                <div className="champ">
                  <label htmlFor="rayon-cat">Catégorie</label>
                  <select
                    id="rayon-cat"
                    value={
                      CATEGORIES.includes(champ.categorie)
                        ? champ.categorie
                        : "fourre-tout"
                    }
                    onChange={(e) =>
                      setChamp((actuel) => ({ ...actuel, categorie: e.target.value }))
                    }
                  >
                    {CATEGORIES.map((un) => (
                      <option key={un} value={un}>
                        {un}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="champ">
                  <label htmlFor="rayon-unite">Unité</label>
                  <select
                    id="rayon-unite"
                    value={UNITES.includes(champ.unite) ? champ.unite : "pièce"}
                    onChange={(e) =>
                      setChamp((actuel) => ({ ...actuel, unite: e.target.value }))
                    }
                  >
                    {UNITES.map((un) => (
                      <option key={un} value={un}>
                        {un}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="champ">
                  <label htmlFor="rayon-alerte">Seuil d’alerte</label>
                  <input
                    id="rayon-alerte"
                    inputMode="numeric"
                    value={champ.alerte_stock}
                    onChange={nombre("alerte_stock")}
                  />
                </div>
                <div className="champ">
                  <label htmlFor="rayon-achat">Coût moyen (FCFA)</label>
                  <input
                    id="rayon-achat"
                    inputMode="numeric"
                    value={champ.prix_achat}
                    onChange={nombre("prix_achat")}
                    disabled={ligne !== null && ligne.stock > 0}
                  />
                  {ligne !== null && ligne.stock > 0 ? (
                    <span className="champ__aide">
                      Il reste du stock : le coût se reprend par un rachat.
                    </span>
                  ) : null}
                </div>
                <div className="champ">
                  <label htmlFor="rayon-vente">Prix vendu (FCFA)</label>
                  <input
                    id="rayon-vente"
                    inputMode="numeric"
                    value={champ.prix_vente}
                    onChange={nombre("prix_vente")}
                    required
                  />
                </div>
                <div className="champ">
                  <label htmlFor="rayon-stock">Stock au comptoir</label>
                  <input
                    id="rayon-stock"
                    className="champ--lecture"
                    value={ligne ? ligne.stock : champ.stock}
                    readOnly
                  />
                </div>
              </div>

              <div className="champ">
                <label htmlFor="rayon-mots">Mots dictés</label>
                <input
                  id="rayon-mots"
                  value={champ.mots_cles}
                  onChange={(e) =>
                    setChamp((actuel) => ({ ...actuel, mots_cles: e.target.value }))
                  }
                  maxLength={240}
                  placeholder="fanta soda"
                />
                <span className="champ__aide">
                  Ce que la voix dit vraiment, séparé par des espaces.
                </span>
              </div>

              <div className="acts">
                <button type="submit" className="bouton bouton--encre" disabled={enCours}>
                  {enCours ? "Écriture" : "Tenir la ligne"}
                  <span className="bouton__fleche">
                    <Icone nom="check" taille={15} />
                  </span>
                </button>
                <button
                  type="button"
                  className="bouton bouton--doux"
                  onClick={() => {
                    setChoisie(null);
                    setNouveau(false);
                    setMessage(null);
                    setIncident(null);
                  }}
                >
                  Fermer
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="vide">
            <h3>Aucune ligne ouverte.</h3>
            <p>
              Choisis un article dans le rayon pour corriger son prix, son seuil
              ou ses mots dictés.
            </p>
            <button type="button" className="bouton bouton--encre" onClick={creer}>
              Ajouter une ligne
            </button>
          </div>
        )}

        {ligne !== null ? (
          <div className="pile-champs" style={{ marginTop: "1.2rem" }}>
            <div className="tete-feuille">
              <h2>Un rachat</h2>
              <span className="tete-feuille__cote">
                coût moyen {ligne.prix_achat_label}
              </span>
            </div>
            <div className="grille-champs">
              <div className="champ">
                <label htmlFor="rachat-quantite">Quantité</label>
                <input
                  id="rachat-quantite"
                  inputMode="numeric"
                  value={entree.quantite}
                  onChange={(e) =>
                    setEntree((actuel) => ({ ...actuel, quantite: e.target.value }))
                  }
                  placeholder="10"
                />
              </div>
              <div className="champ">
                <label htmlFor="rachat-cout">Coût par unité</label>
                <input
                  id="rachat-cout"
                  inputMode="numeric"
                  value={entree.cout}
                  onChange={(e) =>
                    setEntree((actuel) => ({ ...actuel, cout: e.target.value }))
                  }
                  placeholder={String(ligne.prix_achat)}
                />
              </div>
              <div className="acts" style={{ marginTop: "1.6rem" }}>
                <button
                  type="button"
                  className="bouton bouton--brique"
                  onClick={racheter}
                  disabled={enCours}
                >
                  Faire entrer
                </button>
              </div>
            </div>
            <MentionDemo />
          </div>
        ) : null}

        {message ? (
          <p className="note-bas note-bas--tenu" role="status" style={{ marginTop: "1rem" }}>
            {message}
          </p>
        ) : null}
        {incident ? (
          <p className="note-bas note-bas--tard" role="alert" style={{ marginTop: "1rem" }}>
            {incident}
          </p>
        ) : null}

        {nouveau === false && ligne === null ? (
          <button type="button" className="bouton bouton--petit" style={{ marginTop: "1rem" }} onClick={creer}>
            Ajouter une ligne au rayon
          </button>
        ) : null}
      </section>
    </div>
  );
}
