export type Role = "responsable" | "agent";

export type Organisation = {
  id: number;
  nom: string;
  ville: string;
  quartier: string;
  telephone: string;
  telephone_display: string;
};

export type Utilisateur = {
  id: number;
  nom: string;
  email: string;
  role: Role;
};

export type Seance = {
  user: Utilisateur;
  organisation: Organisation;
  expires_in_hours: number;
};

export type Connexion = Seance;

export type StatutLivraison = "commandee" | "en_route" | "livree" | "annulee";
export type TypeClient = "particulier" | "revendeur" | "restaurant" | "chantier";

export type Client = {
  id: number;
  nom: string;
  telephone: string;
  telephone_display: string;
  telephone_joignable: boolean;
  operateur: string;
  quartier: string;
  type: TypeClient | string;
  note: string;
  cree_le: string;
};

export type Livraison = {
  id: number;
  client_id: number;
  client: string;
  quantite: number;
  montant: number;
  statut: StatutLivraison | string;
  date_commande: string | null;
  date_livraison: string | null;
  adresse: string;
  note: string;
  cree_le: string;
  prix_unitaire?: number;
  telephone?: string;
  quartier?: string;
};

export type Depot = {
  depot: Organisation | null;
  lien?: string;
};

export type Etat = {
  jour: string;
  periode: string;
  livraisons: number;
  en_cours: number;
  commandees: number;
  en_route: number;
  du_jour: number;
  livrees_mois: number;
  bonbonnes_mois: number;
  montant_mois: number;
  clients: number;
};

export type Recap = {
  periode: string;
  livraisons: number;
  livrees_mois: number;
  bonbonnes_mois: number;
  montant_mois: number;
  commandees_mois: number;
  en_cours: number;
  par_statut: Record<string, number>;
  par_quartier: { quartier: string; bonbonnes: number }[];
  par_type: { type: string; bonbonnes: number }[];
};

export type ListeLivraisons = {
  total: number;
  en_cours: number;
  livrees: number;
  livraisons: Livraison[];
};
export type ListeClients = { total: number; clients: Client[] };

export type OrganisationEntree = {
  nom: string;
  ville: string;
  quartier: string;
  telephone: string;
};

export type CompteEntree = {
  nom: string;
  email: string;
  mot_de_passe: string;
  role: Role;
};

export type Compte = Utilisateur;

export type LivraisonEntree = {
  client_id: number;
  quantite?: number;
  prix_unitaire?: number;
  date_commande?: string | null;
  adresse?: string;
  note?: string;
};

export type LivraisonCorrection = Partial<LivraisonEntree> & {
  statut?: string;
  date_livraison?: string | null;
};

export type ClientEntree = {
  nom: string;
  telephone?: string;
  quartier?: string;
  type?: string;
  note?: string;
};

export type ClientCorrection = Partial<ClientEntree>;

export type CommandeEntree = {
  nom: string;
  telephone: string;
  quartier?: string;
  quantite?: number;
};
