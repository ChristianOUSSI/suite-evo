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

export type StatutArticle = "en_stock" | "vendu" | "epuise";
export type TypeClient = "particulier" | "revendeur" | "evenement";
export type Categorie = "pagne" | "robe" | "chemise" | "pantalon" | "ensemble" | "chaussure" | "accessoire" | "autre";

export type Client = {
  id: number;
  nom: string;
  telephone: string;
  telephone_display: string;
  telephone_joignable: boolean;
  operateur: string;
  type: TypeClient | string;
  note: string;
  cree_le: string;
};

export type Article = {
  id: number;
  reference: string;
  nom: string;
  categorie: Categorie | string;
  taille: string;
  couleur: string;
  stock: number;
  prix_vente: number;
  statut: StatutArticle | string;
  quantite_vendue: number;
  note: string;
  cree_le: string;
  prix_achat?: number;
  client_id?: number | null;
  client?: string;
  date_vente?: string | null;
};

export type Catalogue = {
  boutique: Organisation | null;
  articles: Article[];
  lien?: string;
};

export type Etat = {
  jour: string;
  periode: string;
  articles: number;
  en_stock: number;
  epuisees: number;
  unites_stock: number;
  clients: number;
  vendus_mois: number;
  quantite_vendue_mois: number;
  valeur_stock: number;
  encaisse_mois: number;
};

export type Recap = {
  periode: string;
  articles: number;
  en_stock: number;
  vendus_mois: number;
  quantite_vendue_mois: number;
  encaisse_mois: number;
  valeur_stock: number;
  unites_stock: number;
  par_statut: Record<string, number>;
  par_categorie: { categorie: string; articles: number }[];
  par_couleur: { couleur: string; quantite: number }[];
};

export type ListeArticles = { total: number; en_stock: number; vendus: number; articles: Article[] };
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

export type ArticleEntree = {
  nom: string;
  categorie?: string;
  taille?: string;
  couleur?: string;
  stock?: number;
  prix_achat?: number;
  prix_vente: number;
  note?: string;
};

export type ArticleCorrection = Partial<ArticleEntree> & {
  statut?: string;
  quantite_vendue?: number;
  client_id?: number | null;
  date_vente?: string | null;
};

export type ClientEntree = {
  nom: string;
  telephone?: string;
  type?: string;
  note?: string;
};

export type StatutDemande = "demande" | "confirmee" | "annulee";

export type Demande = {
  id: number;
  article_id: number | null;
  article: string;
  reference: string;
  client_nom: string;
  client_telephone: string;
  telephone_display: string;
  note: string;
  statut: StatutDemande | string;
  cree_le: string;
  traite_le: string | null;
};

export type ListeDemandes = { en_attente: number; total: number; demandes: Demande[] };
