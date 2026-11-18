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

export type Intention = "rappel" | "message" | "note" | "recherche" | "alerte" | "autre";
export type StatutCommande = "recue" | "interpretee" | "executee" | "echec" | "annulee";

export type Commande = {
  id: number;
  transcription: string;
  intention: Intention | "" | string;
  statut: StatutCommande | string;
  resultat: string;
  auteur: string;
  cree_le: string;
  maj_le: string | null;
};

export type Etat = {
  jour: string;
  periode: string;
  commandes: number;
  recues: number;
  interpretees: number;
  executees: number;
  echecs: number;
  annulees: number;
  executees_mois: number;
  sans_intention: number;
};

export type Recap = {
  periode: string;
  commandes: number;
  recues_mois: number;
  executees_mois: number;
  echecs_mois: number;
  en_attente: number;
  par_statut: Record<string, number>;
  par_intention: { intention: string; commandes: number }[];
};

export type ListeCommandes = {
  total: number;
  recues: number;
  interpretees: number;
  executees: number;
  commandes: Commande[];
};

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

export type CommandeEntree = {
  transcription: string;
};

export type CommandeCorrection = {
  transcription?: string;
  intention?: string;
  statut?: string;
};
