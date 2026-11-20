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

export type Categorie =
  | "alimentation"
  | "vetements"
  | "electronique"
  | "maison"
  | "beaute"
  | "telephone"
  | "auto"
  | "autre";

export type StatutAnnonce = "en_ligne" | "vendu" | "retire";
export type StatutCommande = "nouvelle" | "confirmee" | "livree" | "annulee";
export type Moyen = "especes" | "mtn_money" | "orange_money" | "nexttel_money" | "virement" | "autre";

export type Annonce = {
  id: number;
  titre: string;
  categorie: Categorie | string;
  description: string;
  prix: number;
  stock: number;
  ville: string;
  quartier: string;
  statut: StatutAnnonce;
  vendeur_nom: string;
  vendeur_telephone: string;
  vendeur_telephone_display: string;
  vendeur_joignable: boolean;
  vendeur_operateur: string | null;
  note: string;
  commandes: number;
  vendu: number;
  cree_le: string;
};

export type AnnonceDetail = Annonce & { commandes_liste: Commande[] };

export type AnnoncePublique = {
  id: number;
  titre: string;
  categorie: string;
  description: string;
  prix: number;
  stock: number;
  ville: string;
  quartier: string;
};

export type BoutiquePublique = {
  boutique: Organisation | null;
  annonces: AnnoncePublique[];
  lien?: string;
};

export type Commande = {
  id: number;
  annonce_id: number;
  annonce: string;
  categorie: string;
  prix_unitaire: number;
  quantite: number;
  montant: number;
  acheteur_nom: string;
  acheteur_telephone: string;
  acheteur_telephone_display: string;
  acheteur_joignable: boolean;
  acheteur_operateur: string | null;
  moyen: Moyen | string;
  statut: StatutCommande;
  date: string;
  note: string;
  cree_par: string;
  cree_le: string;
};

export type Etat = {
  jour: string;
  periode: string;
  annonces: number;
  en_ligne: number;
  ruptures: number;
  commandes_neuves: number;
  commandes_mois: number;
  ventes_mois: number;
  ventes_total: number;
  stock_total: number;
};

export type Recap = {
  periode: string;
  annonces: number;
  en_ligne: number;
  commandes: number;
  par_statut: Record<string, number>;
  par_categorie: { categorie: string; ventes: number; montant: number }[];
  ventes_mois: number;
  ventes_total: number;
  quantites_mois: number;
};

export type ListeAnnonces = { total: number; en_ligne: number; annonces: Annonce[] };
export type ListeCommandes = { commandes: Commande[] };

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

export type AnnonceEntree = {
  titre: string;
  categorie?: Categorie | string;
  description?: string;
  prix?: number;
  stock?: number;
  ville?: string;
  quartier?: string;
  vendeur_nom?: string;
  vendeur_telephone?: string;
  note?: string;
};

export type CommandeEntree = {
  annonce_id: number;
  quantite?: number;
  acheteur_nom?: string;
  acheteur_telephone?: string;
  moyen?: Moyen | string;
  date?: string | null;
  note?: string;
};

export type StatutDemande = "demande" | "confirmee" | "annulee";

export type Demande = {
  id: number;
  annonce: string;
  annonce_id: number | null;
  quantite: number;
  acheteur_nom: string;
  acheteur_telephone: string;
  note: string;
  statut: StatutDemande;
  cree_le: string;
  traite_le: string | null;
};

export type ListeDemandes = {
  total: number;
  en_attente: number;
  demandes: Demande[];
};

export type DemandeEntree = {
  annonce_id: number | null;
  quantite: number;
  acheteur_nom: string;
  acheteur_telephone: string;
  note: string;
};
