export type Langue = "fr" | "en";

export type Role = "responsable" | "caissier";

export type Unite = "piece" | "sac" | "kg" | "litre" | "carton" | "paquet";

export interface Organisation {
  id: number;
  nom: string;
  ville: string;
  quartier: string;
  telephone: string;
  telephone_display: string;
}

export interface Compte {
  id: number;
  nom: string;
  email: string;
  role: Role;
}

export interface Seance {
  user: Compte;
  organisation: Organisation;
  demo: boolean;
}

export interface Connexion {
  user: Compte;
  organisation: Organisation;
  expires_in_hours: number;
}

export interface Produit {
  id: number;
  nom: string;
  unite: Unite;
  prix_achat: number;
  prix_vente: number;
  stock: number;
  seuil_alerte: number;
  alerte: boolean;
  actif: boolean;
  note: string;
  ventes: number;
}

export interface ListeProduits {
  total: number;
  actifs: number;
  produits: Produit[];
}

export interface LigneVente {
  produit_id: number;
  nom: string;
  unite: Unite;
  quantite: number;
  prix_unitaire: number;
  montant: number;
}

export interface Vente {
  id: number;
  client_nom: string;
  total: number;
  statut: "validee" | "annulee";
  note: string;
  cree_par: string;
  cree_le: string;
  lignes: LigneVente[];
}

export interface ListeVentes {
  ventes: Vente[];
}

export interface Etat {
  jour: string;
  produits: number;
  ruptures: number;
  alertes: number;
  ventes_du_jour: number;
  ca_du_jour: number;
  ca_total: number;
}

export interface Recap {
  periode: string;
  ventes: number;
  ca: number;
  marge: number;
  par_produit: {
    produit_id: number;
    nom: string;
    unite: Unite;
    quantite: number;
    montant: number;
    marge: number;
  }[];
}

export interface ProduitEntree {
  nom: string;
  unite: Unite;
  prix_achat: number;
  prix_vente: number;
  stock: number;
  seuil_alerte: number;
  note: string;
}

export interface VenteEntree {
  lignes: { produit_id: number; quantite: number }[];
  client_nom: string;
  note: string;
}

export interface OrganisationEntree {
  nom: string;
  ville: string;
  quartier: string;
  telephone: string;
}

export interface CompteEntree {
  nom: string;
  email: string;
  mot_de_passe: string;
  role: Role;
}
