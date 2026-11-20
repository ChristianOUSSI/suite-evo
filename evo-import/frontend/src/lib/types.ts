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

export type Mode = "maritime" | "aerien" | "terrestre" | "express";
export type StatutEnvoi = "en_attente" | "en_transit" | "en_douane" | "livre" | "bloque" | "annule";
export type TypeClient = "particulier" | "entreprise" | "revendeur";

export type LigneSuivi = {
  id: number;
  statut: StatutEnvoi | string;
  note: string;
  cree_le: string;
};

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

export type Envoi = {
  id: number;
  numero_suivi: string;
  description: string;
  mode: Mode | string;
  expéditeur_nom: string;
  expéditeur_pays: string;
  destinataire_nom: string;
  destinataire_ville: string;
  poids_kg: number;
  valeur_declaree: number;
  frais?: number;
  statut: StatutEnvoi | string;
  client_id?: number | null;
  client?: string;
  date_envoi: string;
  date_livraison: string | null;
  note: string;
  cree_le: string;
  suivi: LigneSuivi[];
  transitaire?: Organisation;
  lien?: string;
};

export type Etat = {
  jour: string;
  periode: string;
  envois: number;
  en_attente: number;
  en_transit: number;
  en_douane: number;
  bloques: number;
  livres: number;
  clients: number;
  envois_mois: number;
  frais_mois: number;
  livres_mois: number;
};

export type Recap = {
  periode: string;
  envois: number;
  envois_mois: number;
  frais_mois: number;
  valeur_mois: number;
  par_statut: Record<string, number>;
  par_mode: { mode: string; envois: number }[];
  par_ville: { ville: string; envois: number }[];
};

export type ListeEnvois = { total: number; en_attente: number; en_transit: number; envois: Envoi[] };
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

export type EnvoiEntree = {
  description: string;
  mode?: string;
  expéditeur_nom?: string;
  expéditeur_pays?: string;
  destinataire_nom?: string;
  destinataire_ville?: string;
  poids_kg?: number;
  valeur_declaree?: number;
  frais?: number;
  client_id?: number | null;
  date_envoi?: string | null;
  note?: string;
};

export type ClientEntree = {
  nom: string;
  telephone?: string;
  type?: string;
  note?: string;
};

export type StatutDemande = "demande" | "devis" | "acceptee" | "refusee";

export type Demande = {
  id: number;
  nom: string;
  telephone: string;
  description: string;
  mode: string;
  expediteur_pays: string;
  destinataire_ville: string;
  poids_kg: number;
  valeur_declaree: number;
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
  nom: string;
  telephone: string;
  description: string;
  mode: string;
  expediteur_pays: string;
  destinataire_ville: string;
  poids_kg: number;
  valeur_declaree: number;
  note: string;
};
