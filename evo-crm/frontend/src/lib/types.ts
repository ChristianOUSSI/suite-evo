export type Langue = "fr" | "en";

export type Segment = "particulier" | "revendeur" | "grossiste" | "institution";

export type TypeEchange =
  | "appel"
  | "whatsapp"
  | "visite"
  | "sms"
  | "devis"
  | "commande"
  | "reclamation"
  | "formulaire";

export type Role = "responsable" | "vendeur";

export type StatutRelance = "a_faire" | "faite";

export interface Entreprise {
  id: number;
  nom: string;
  ville: string;
  quartier: string;
  secteur: string;
  telephone: string;
  telephone_display: string;
  silence_jours: number;
  rappel_jours: number;
  abonnement_mensuel: number;
}

export interface Compte {
  id: number;
  nom: string;
  email: string;
  role: Role;
}

export interface Seance {
  user: Compte;
  entreprise: Entreprise;
  demo: boolean;
}

export interface Connexion {
  user: Compte;
  entreprise: Entreprise;
  expires_in_hours: number;
}

export interface Relance {
  id: number;
  client_id: number;
  client: string;
  telephone: string;
  motif: string;
  origine: "manuel" | "devis" | string;
  due_le: string;
  statut: StatutRelance;
  faite_le: string | null;
  retard: number;
  note: string;
}

export interface Client {
  id: number;
  nom: string;
  telephone: string;
  telephone_display: string;
  operateur: string;
  joignable: boolean;
  email: string;
  quartier: string;
  segment: Segment;
  note: string;
  actif: boolean;
  cree_le: string;
  echanges: number;
  dernier_type: TypeEchange | null;
  dernier_moment: string | null;
  derniers_jours: number | null;
  relance: Relance | null;
}

export interface Echange {
  id: number;
  client_id: number;
  type: TypeEchange;
  note: string;
  moment: string;
  jour: string;
  montant: number;
  par: string;
}

export interface Fiche extends Client {
  historique: Echange[];
  relances: Relance[];
}

export interface ListeClients {
  total: number;
  actifs: number;
  clients: Client[];
}

export interface SansNouvelles {
  seuil: number;
  total: number;
  clients: Client[];
}

export interface FileDeRelances {
  du_jour: Relance[];
  en_retard: Relance[];
  a_venir: Relance[];
}

export interface Etat {
  entreprise_id: number;
  jour: string;
  clients: number;
  actifs: number;
  joignables: number;
  echanges_30j: number;
  devis_30j: number;
  commandes_30j: number;
  relances_dues: number;
  relances_en_retard: number;
  silence_seuil: number;
  silencie: number;
  segments: Record<Segment, number>;
  dernier_echange: string | null;
}

/** Les corps envoyés au backend. */
export interface ClientEntree {
  nom: string;
  telephone: string;
  email: string;
  quartier: string;
  segment: Segment;
  note: string;
}

export interface EchangeEntree {
  type: TypeEchange;
  note: string;
  montant: number;
  jour: string | null;
}

export interface RelanceEntree {
  motif: string;
  due_le: string | null;
  note: string;
}

export interface EntrepriseEntree {
  nom: string;
  ville: string;
  quartier: string;
  secteur: string;
  telephone: string;
  silence_jours: number;
  rappel_jours: number;
}

export interface CompteEntree {
  nom: string;
  email: string;
  mot_de_passe: string;
  role: Role;
}

export interface EntreprisePublique {
  nom: string;
  ville: string;
  quartier: string;
  secteur: string;
  telephone: string;
  telephone_display: string;
}

export interface PageContact {
  entreprise: EntreprisePublique | null;
  lien?: string;
}

export interface ContactEnvoye {
  ok: boolean;
  reference: number;
  entreprise: EntreprisePublique;
}
