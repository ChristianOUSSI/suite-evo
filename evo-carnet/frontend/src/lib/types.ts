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

export type Categorie = "perso" | "travail" | "courses" | "idees" | "sante" | "argent" | "autre";

export type Note = {
  id: number;
  titre: string;
  contenu: string;
  categorie: Categorie | string;
  epinglee: boolean;
  archivee: boolean;
  mots: number;
  cree_le: string;
  maj_le: string | null;
  code_partage?: string;
  lien?: string;
};

export type Carnet = {
  carnet: Organisation | null;
};

export type NotePartagee = {
  note: Omit<Note, "code_partage" | "lien">;
  carnet: Organisation;
  lien?: string;
};

export type Etat = {
  jour: string;
  notes: number;
  archivees: number;
  epinglees: number;
  mots: number;
  categories: number;
};

export type Recap = {
  periode: string;
  notes: number;
  archivees: number;
  epinglees: number;
  ecrites_mois: number;
  mots_mois: number;
  par_categorie: { categorie: string; notes: number }[];
};

export type ListeNotes = { total: number; notes: Note[] };

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

export type NoteEntree = {
  titre: string;
  contenu?: string;
  categorie?: string;
};

export type NoteCorrection = Partial<NoteEntree> & {
  epinglee?: boolean;
  archivee?: boolean;
  nouveau_code?: boolean;
};
