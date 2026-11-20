export type Langue = "fr" | "en";

export type StatutPresence = "present" | "retard" | "absent";

export type Role = "responsable" | "agent";

export interface Organisation {
  id: number;
  nom: string;
  ville: string;
  quartier: string;
  telephone: string;
  telephone_display: string;
}

export interface Compte {
  id: number;
  nom: string;
  email: string;
  role: Role;
}

export interface Seance {
  user: Compte;
  organisation: Organisation;
  demo: boolean;
}

export interface Connexion {
  user: Compte;
  organisation: Organisation;
  expires_in_hours: number;
}

export interface Employe {
  id: number;
  nom: string;
  telephone: string;
  telephone_display: string;
  operateur: string;
  joignable: boolean;
  service: string;
  actif: boolean;
  entree_le: string;
  note: string;
  pointages: number;
  code_pointage: string;
}

export interface ListeEmployes {
  total: number;
  actifs: number;
  employes: Employe[];
}

export interface Place {
  employe_id: number;
  nom: string;
  service: string;
  telephone: string;
  pointe: boolean;
  id: number | null;
  statut: StatutPresence | null;
  arrivee: string;
  depart: string;
  note: string;
}

export interface Equipe {
  jour: string;
  equipe: Place[];
}

export interface Presence {
  id: number;
  employe_id: number;
  employe: string;
  service: string;
  jour: string;
  statut: StatutPresence;
  arrivee: string;
  depart: string;
  note: string;
  pointe_par: number | null;
  pointe_le: string;
  par: string;
}

export interface Journal {
  jours: number;
  lignes: Presence[];
}

export interface LigneRecap {
  employe_id: number;
  nom: string;
  service: string;
  telephone: string;
  presents: number;
  retards: number;
  absents: number;
  jours: number;
  heures: number;
  code: string;
}

export interface Recap {
  organisation_id: number;
  periode: string;
  lignes: LigneRecap[];
  effectif: number;
  total_heures: number;
  total_presents: number;
  total_retards: number;
  total_absents: number;
}

export interface Etat {
  jour: string;
  periode: string;
  effectif: number;
  pointes: number;
  a_pointer: number;
  par_statut: Record<StatutPresence, number>;
}

/** Le bulletin public, vérifiable sans compte. */
export interface Bulletin {
  valide: boolean;
  code: string;
  entreprise: string;
  ville: string;
  quartier: string;
  employe_id: number;
  nom: string;
  service: string;
  telephone: string;
  periode: string;
  presents: number;
  retards: number;
  absents: number;
  jours: number;
  heures: number;
  code_controle: string;
  jours_detailles: {
    jour: string;
    statut: StatutPresence;
    arrivee: string;
    depart: string;
    note: string;
  }[];
}

/** Les corps envoyés au backend. */
export interface EmployeEntree {
  nom: string;
  telephone: string;
  service: string;
  note: string;
}

export interface PresenceEntree {
  employe_id: number;
  jour: string;
  statut: StatutPresence;
  arrivee: string;
  depart: string;
  note: string;
}

export interface OrganisationEntree {
  nom: string;
  ville: string;
  quartier: string;
  telephone: string;
}

export interface CompteEntree {
  nom: string;
  email: string;
  mot_de_passe: string;
  role: Role;
}

export interface EcranPointage {
  entreprise: { nom: string; ville: string; quartier: string } | null;
}

export interface PointageEnvoye {
  ok: boolean;
  employe: string;
  jour: string;
  statut: string;
  arrivee: string;
  depart: string;
}
