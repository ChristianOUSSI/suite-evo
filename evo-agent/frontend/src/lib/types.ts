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

export type TypeTache = "recherche" | "redaction" | "resume" | "analyse" | "automatisation" | "autre";
export type Priorite = "basse" | "normale" | "haute";
export type StatutTache = "en_attente" | "en_cours" | "terminee" | "echec" | "annulee";

export type Tache = {
  id: number;
  titre: string;
  consigne: string;
  type: TypeTache | string;
  priorite: Priorite | string;
  statut: StatutTache | string;
  resultat: string;
  erreur: string;
  cree_par: string;
  executions: number;
  cree_le: string;
  maj_le: string | null;
};

export type Execution = {
  id: number;
  tache_id: number;
  tache: string;
  statut: "terminee" | "echec" | string;
  debut_le: string | null;
  fin_le: string | null;
  duree_secondes: number;
  resultat: string;
  details: string;
};

export type Etat = {
  jour: string;
  periode: string;
  taches: number;
  en_attente: number;
  en_cours: number;
  terminees: number;
  echecs: number;
  annulees: number;
  executions: number;
  executions_mois: number;
  haute_priorite: number;
};

export type Recap = {
  periode: string;
  taches: number;
  creees_mois: number;
  terminees_mois: number;
  echecs_mois: number;
  executions_mois: number;
  secondes_mois: number;
  en_cours: number;
  par_statut: Record<string, number>;
  par_type: { type: string; taches: number }[];
};

export type ListeTaches = {
  total: number;
  en_attente: number;
  en_cours: number;
  terminees: number;
  taches: Tache[];
};
export type ListeExecutions = { total: number; executions: Execution[] };

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

export type TacheEntree = {
  titre: string;
  consigne?: string;
  type?: string;
  priorite?: string;
};

export type TacheCorrection = Partial<TacheEntree> & {
  statut?: string;
  resultat?: string;
};

export type CompletionEntree = {
  resultat?: string;
  erreur?: string;
};
