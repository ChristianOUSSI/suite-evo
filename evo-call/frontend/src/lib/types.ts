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

export type Sens = "entrant" | "sortant";
export type Motif = "vente" | "sav" | "renseignement" | "plainte" | "rappel" | "prospection" | "autre";
export type StatutAppel = "en_file" | "en_cours" | "termine" | "sans_reponse" | "rappel" | "annule";

export type Appel = {
  id: number;
  client_nom: string;
  client_telephone: string;
  client_telephone_display: string;
  client_joignable: boolean;
  client_operateur: string;
  sens: Sens | string;
  motif: Motif | string;
  statut: StatutAppel | string;
  agent_id: number | null;
  agent: string;
  duree_secondes: number;
  duree_lisible: string;
  date: string;
  date_rappel: string | null;
  note: string;
  cree_par: string;
  cree_le: string;
};

export type FilePublique = {
  centre: Organisation | null;
  en_file: number;
  en_cours: number;
};

export type Etat = {
  jour: string;
  periode: string;
  appels: number;
  en_file: number;
  en_cours: number;
  rappels: number;
  du_jour: number;
  termines_jour: number;
  sans_reponse_jour: number;
  duree_moyenne_jour: number;
};

export type Recap = {
  periode: string;
  appels: number;
  appels_mois: number;
  par_statut: Record<string, number>;
  par_agent: { agent: string; appels: number; duree: number }[];
  par_motif: { motif: string; appels: number }[];
  duree_totale: number;
  duree_moyenne: number;
};

export type ListeAppels = { total: number; en_file: number; en_cours: number; appels: Appel[] };

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

export type AppelEntree = {
  client_nom?: string;
  client_telephone?: string;
  sens?: string;
  motif?: string;
  duree_secondes?: number;
  date?: string | null;
  date_rappel?: string | null;
  note?: string;
};
