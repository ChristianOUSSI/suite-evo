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

export type GenreColis = "document" | "colis" | "valise" | "electromenager" | "palette" | "autre";
export type StatutColis = "recu" | "en_transit" | "arrive" | "distribue" | "retourne" | "annule";
export type Moyen = "especes" | "mtn_money" | "orange_money" | "nexttel_money" | "virement" | "a_payer" | "autre";

export type Colis = {
  id: number;
  numero: string;
  genre: GenreColis;
  description: string;
  poids_kg: number;
  expediteur_nom: string;
  expediteur_telephone: string;
  expediteur_telephone_display: string;
  destinataire_nom: string;
  destinataire_telephone: string;
  destinataire_telephone_display: string;
  destinataire_joignable: boolean;
  destinataire_operateur: string | null;
  depart: string;
  arrivee: string;
  frais: number;
  moyen: Moyen;
  statut: StatutColis;
  date_depot: string;
  date_livraison: string | null;
  note: string;
  agent: string;
  cree_par: string;
  cree_le: string;
};

export type SuiviPublic = {
  numero: string;
  genre: GenreColis;
  description: string;
  depart: string;
  arrivee: string;
  statut: StatutColis;
  date_depot: string;
  date_livraison: string | null;
  transporteur: string;
  ville: string;
  telephone: string;
  telephone_display: string;
};

export type SuiviReponse = {
  colis: SuiviPublic;
  lien?: string;
};

export type Etat = {
  jour: string;
  periode: string;
  colis: number;
  en_transit: number;
  arrives: number;
  distribues_mois: number;
  deposes_mois: number;
  frais_mois: number;
  a_percevoir: number;
  par_statut: Record<string, number>;
};

export type Recap = {
  periode: string;
  colis: number;
  deposes: number;
  par_statut: Record<string, number>;
  par_trajet: { trajet: string; colis: number; frais: number }[];
  par_genre: { genre: string; colis: number }[];
  frais_mois: number;
  a_percevoir: number;
  poids_mois: number;
};

export type ListeColis = { total: number; en_transit: number; colis: Colis[] };

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

export type ColisEntree = {
  genre?: GenreColis;
  description?: string;
  poids_kg?: number;
  expediteur_nom?: string;
  expediteur_telephone?: string;
  destinataire_nom?: string;
  destinataire_telephone?: string;
  depart?: string;
  arrivee?: string;
  frais?: number;
  moyen?: Moyen;
  date_depot?: string | null;
  note?: string;
};

export type Villes = string[];
