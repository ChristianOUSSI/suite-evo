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

export type Matiere = "or" | "argent" | "plaque_or" | "acier" | "perle" | "autre";
export type StatutPiece = "en_vitrine" | "reserve" | "vendu" | "retire";
export type TypeClient = "particulier" | "entreprise" | "collectionneur";

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

export type Piece = {
  id: number;
  reference: string;
  nom: string;
  matiere: Matiere | string;
  poids_grammes: number;
  carat: number | null;
  prix_achat?: number;
  prix_vente: number;
  statut: StatutPiece | string;
  client_id: number | null;
  client: string;
  date_vente: string | null;
  fournisseur: string;
  note: string;
  cree_le: string;
};

export type Catalogue = {
  bijouterie: Organisation | null;
  pieces: Piece[];
  lien?: string;
};

export type Etat = {
  jour: string;
  periode: string;
  pieces: number;
  en_vitrine: number;
  reserve: number;
  vendues: number;
  retirees: number;
  clients: number;
  vendues_mois: number;
  valeur_stock: number;
  valeur_vendue_mois: number;
};

export type Recap = {
  periode: string;
  pieces: number;
  en_vitrine: number;
  vendues_mois: number;
  valeur_vendue_mois: number;
  marge_mois: number;
  valeur_stock: number;
  par_statut: Record<string, number>;
  par_matiere: { matiere: string; pieces: number }[];
  par_matiere_vendue: { matiere: string; pieces: number }[];
};

export type ListePieces = { total: number; en_vitrine: number; vendues: number; pieces: Piece[] };
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

export type PieceEntree = {
  nom: string;
  matiere?: string;
  poids_grammes?: number;
  carat?: number | null;
  prix_achat?: number;
  prix_vente?: number;
  fournisseur?: string;
  note?: string;
};

export type PieceCorrection = Partial<PieceEntree> & {
  statut?: string;
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
  piece: string;
  piece_id: number | null;
  reference: string;
  client_nom: string;
  client_telephone: string;
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
  piece_id: number | null;
  client_nom: string;
  client_telephone: string;
  note: string;
};
