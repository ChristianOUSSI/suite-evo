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

export type StatutVoiture = "en_vente" | "reserve" | "vendu" | "retire";
export type StatutPiece = "en_stock" | "vendu" | "epuise";
export type TypeClient = "particulier" | "entreprise" | "garage";
export type Carburant = "essence" | "diesel" | "hybride" | "electrique";
export type Boite = "manuelle" | "automatique";

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

export type Voiture = {
  id: number;
  marque: string;
  modele: string;
  annee: number;
  kilometrage: number;
  carburant: Carburant | string;
  boite: Boite | string;
  prix: number;
  statut: StatutVoiture | string;
  client_id: number | null;
  client: string;
  date_vente: string | null;
  note: string;
  cree_le: string;
};

export type Piece = {
  id: number;
  reference: string;
  designation: string;
  compatibilite: string;
  stock: number;
  prix_vente: number;
  statut: StatutPiece | string;
  quantite_vendue: number;
  note: string;
  cree_le: string;
  prix_achat?: number;
  client_id?: number | null;
  client?: string;
  date_vente?: string | null;
};

export type Catalogue = {
  garage: Organisation | null;
  voitures: Voiture[];
  pieces: Piece[];
  lien?: string;
};

export type Etat = {
  jour: string;
  periode: string;
  voitures: number;
  en_vente: number;
  reserve: number;
  vendues: number;
  retirees: number;
  pieces: number;
  en_stock: number;
  epuisees: number;
  clients: number;
  vendues_mois: number;
  pieces_vendues_mois: number;
  valeur_stock: number;
  valeur_pieces: number;
  valeur_vendue_mois: number;
  encaisse_pieces_mois: number;
};

export type Recap = {
  periode: string;
  voitures: number;
  en_vente: number;
  vendues_mois: number;
  valeur_vendue_mois: number;
  valeur_stock: number;
  pieces: number;
  en_stock: number;
  pieces_vendues_mois: number;
  quantite_vendue_mois: number;
  encaisse_pieces_mois: number;
  valeur_pieces: number;
  par_statut_voiture: Record<string, number>;
  par_statut_piece: Record<string, number>;
  par_marque: { marque: string; voitures: number }[];
};

export type ListeVoitures = { total: number; en_vente: number; vendues: number; voitures: Voiture[] };
export type ListePieces = { total: number; en_stock: number; epuisees: number; pieces: Piece[] };
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

export type VoitureEntree = {
  marque: string;
  modele: string;
  annee: number;
  kilometrage?: number;
  carburant?: string;
  boite?: string;
  prix: number;
  note?: string;
};

export type VoitureCorrection = Partial<VoitureEntree> & {
  statut?: string;
  client_id?: number | null;
  date_vente?: string | null;
};

export type PieceEntree = {
  designation: string;
  compatibilite?: string;
  stock?: number;
  prix_achat?: number;
  prix_vente: number;
  note?: string;
};

export type PieceCorrection = Partial<PieceEntree> & {
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

export type TypeDemande = "voiture" | "piece";
export type StatutDemande = "demande" | "confirmee" | "annulee";

export type Demande = {
  id: number;
  type: TypeDemande;
  voiture: string;
  piece: string;
  voiture_id: number | null;
  piece_id: number | null;
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
  type: TypeDemande;
  voiture_id: number | null;
  piece_id: number | null;
  client_nom: string;
  client_telephone: string;
  note: string;
};
