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
  | "facture"
  | "contrat"
  | "courrier"
  | "pv"
  | "identite"
  | "autorisation"
  | "autre";

export type StatutDocument = "actif" | "archive" | "annule";

export type Document = {
  id: number;
  reference: string;
  titre: string;
  categorie: Categorie | string;
  description: string;
  emetteur: string;
  destinataire: string;
  date_document: string;
  echeance: string | null;
  jours_restants: number | null;
  en_retard: boolean;
  statut: StatutDocument;
  note: string;
  cree_par: string;
  cree_le: string;
};

export type DocumentPublic = {
  reference: string;
  titre: string;
  categorie: string;
  date_document: string;
  statut: string;
  maison: string;
  ville: string;
};

export type MaisonPublique = {
  maison: Organisation | null;
};

export type Etat = {
  jour: string;
  periode: string;
  documents: number;
  actifs: number;
  archives: number;
  en_retard: number;
  a_venir_30j: number;
  avec_echeance: number;
  par_categorie: Record<string, number>;
};

export type Recap = {
  periode: string;
  documents: number;
  actifs: number;
  ajoutes_mois: number;
  en_retard: number;
  a_venir_30j: number;
  par_categorie: { categorie: string; documents: number }[];
  par_statut: Record<string, number>;
};

export type ListeDocuments = { total: number; actifs: number; en_retard: number; documents: Document[] };

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

export type DocumentEntree = {
  titre: string;
  categorie?: Categorie | string;
  description?: string;
  emetteur?: string;
  destinataire?: string;
  date_document?: string | null;
  echeance?: string | null;
  note?: string;
};
