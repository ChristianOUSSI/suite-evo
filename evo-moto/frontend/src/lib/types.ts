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

export type StatutMoto = "en_vente" | "reserve" | "vendu" | "retire";
export type StatutReparation = "recue" | "en_cours" | "terminee" | "livree";
export type TypeClient = "particulier" | "entreprise" | "livreur";

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

export type Moto = {
  id: number;
  marque: string;
  modele: string;
  annee: number;
  kilometrage: number;
  couleur: string;
  prix: number;
  statut: StatutMoto | string;
  client_id: number | null;
  client: string;
  date_vente: string | null;
  note: string;
  cree_le: string;
};

export type Reparation = {
  id: number;
  client_id: number;
  client: string;
  moto_id: number | null;
  moto: string;
  immatriculation: string;
  panne: string;
  travaux: string;
  cout_main_oeuvre: number;
  cout_pieces: number;
  cout_total: number;
  statut: StatutReparation | string;
  date_reception: string | null;
  date_livraison: string | null;
  note: string;
  cree_le: string;
};

export type Catalogue = {
  garage: Organisation | null;
  motos: Moto[];
  lien?: string;
};

export type Etat = {
  jour: string;
  periode: string;
  motos: number;
  en_vente: number;
  reserve: number;
  vendues: number;
  retirees: number;
  clients: number;
  vendues_mois: number;
  reparations: number;
  reparations_cours: number;
  livrees_mois: number;
  valeur_stock: number;
  valeur_vendue_mois: number;
  encaisse_atelier_mois: number;
};

export type Recap = {
  periode: string;
  motos: number;
  en_vente: number;
  vendues_mois: number;
  valeur_vendue_mois: number;
  valeur_stock: number;
  reparations: number;
  reparations_mois: number;
  encaisse_atelier_mois: number;
  par_statut_moto: Record<string, number>;
  par_statut_rep: Record<string, number>;
  par_marque: { marque: string; motos: number }[];
};

export type ListeMotos = { total: number; en_vente: number; vendues: number; motos: Moto[] };
export type ListeClients = { total: number; clients: Client[] };
export type ListeReparations = { total: number; en_cours: number; livrees: number; reparations: Reparation[] };

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

export type MotoEntree = {
  marque: string;
  modele: string;
  annee: number;
  kilometrage?: number;
  couleur?: string;
  prix: number;
  note?: string;
};

export type MotoCorrection = Partial<MotoEntree> & {
  statut?: string;
  client_id?: number | null;
  date_vente?: string | null;
};

export type ReparationEntree = {
  client_id: number;
  moto_id?: number | null;
  immatriculation?: string;
  panne: string;
  travaux?: string;
  cout_main_oeuvre?: number;
  cout_pieces?: number;
  date_reception?: string | null;
  note?: string;
};

export type ReparationCorrection = Partial<Omit<ReparationEntree, "client_id">> & {
  panne?: string;
  statut?: string;
  date_livraison?: string | null;
};

export type ClientEntree = {
  nom: string;
  telephone?: string;
  type?: string;
  note?: string;
};

export type TypeDemande = "moto" | "reparation";
export type StatutDemande = "demande" | "confirmee" | "annulee";

export type Demande = {
  id: number;
  type: TypeDemande;
  moto: string;
  moto_id: number | null;
  client_nom: string;
  client_telephone: string;
  description: string;
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
  type: TypeDemande;
  moto_id: number | null;
  client_nom: string;
  client_telephone: string;
  description: string;
  note: string;
};
