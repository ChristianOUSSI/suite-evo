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

export type Patient = {
  id: number;
  nom: string;
  telephone: string;
  telephone_display: string;
  telephone_joignable: boolean;
  telephone_operateur: string | null;
  naissance: string;
  sexe: string;
  groupe: string;
  allergies: string;
  note: string;
  actif: boolean;
  dus: number;
  actes: number;
  paiements: number;
  actes_liste?: Acte[];
  paiements_liste?: Paiement[];
};

export type Acte = {
  id: number;
  patient_id: number;
  patient: string;
  date: string;
  motif: string;
  diagnostic: string;
  traitement: string;
  montant: number;
  annule: boolean;
  cree_par: string;
  cree_le: string;
};

export type Paiement = {
  id: number;
  patient_id: number;
  patient: string;
  acte_id: number | null;
  acte?: string;
  montant: number;
  moyen: string;
  date: string;
  note: string;
  recu: string;
  annule: boolean;
  cree_par: string;
  cree_le: string;
};

export type Etat = {
  jour: string;
  periode: string;
  patients: number;
  actes_mois: number;
  encaisses: number;
  ca_mois: number;
  ca_total: number;
  dus_total: number;
};

export type Recap = {
  periode: string;
  actes: number;
  montant_actes: number;
  paiements: number;
  encaisses: number;
  dus_total: number;
  par_motif: { motif: string; actes: number; montant: number }[];
  par_patient: { patient_id: number; nom: string; dus: number }[];
};

export type ListePatients = { total: number; actifs: number; patients: Patient[] };
export type ListeActes = { actes: Acte[] };
export type ListePaiements = { paiements: Paiement[] };

export type Moyen =
  | "especes"
  | "mtn_money"
  | "orange_money"
  | "nexttel_money"
  | "virement"
  | "assurance"
  | "autre";

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

export type Compte = Utilisateur & { actif?: boolean };

export type PatientEntree = {
  nom: string;
  telephone?: string;
  naissance?: string | null;
  sexe?: string;
  groupe?: string;
  allergies?: string;
  note?: string;
};

export type ActeEntree = {
  patient_id: number;
  date?: string | null;
  motif?: string;
  diagnostic?: string;
  traitement?: string;
  montant?: number;
};

export type PaiementEntree = {
  patient_id: number;
  acte_id?: number | null;
  montant: number;
  moyen?: string;
  date?: string | null;
  note?: string;
};

export type RecuPublic = {
  valide: boolean;
  recu?: string;
  clinique?: string;
  ville?: string;
  quartier?: string;
  patient?: string;
  telephone?: string;
  montant?: number;
  moyen?: string;
  date?: string;
  note?: string;
  acte?: string;
  code?: string;
};

export type RendezVousStatut = "demande" | "confirme" | "refuse" | "fait";

export type RendezVous = {
  id: number;
  nom: string;
  telephone: string;
  telephone_display: string;
  motif: string;
  jour: string;
  heure: string;
  note: string;
  statut: RendezVousStatut;
  patient: string;
  cree_le: string;
  traite_le: string | null;
};

export type ListeRendezVous = {
  total: number;
  demandes: number;
  rendez_vous: RendezVous[];
};

export type RendezVousEntree = {
  nom: string;
  telephone: string;
  motif: string;
  jour: string;
  heure: string;
  note: string;
};
