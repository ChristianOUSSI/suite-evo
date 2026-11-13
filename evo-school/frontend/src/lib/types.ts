export type Langue = "fr" | "en";

export type Role = "responsable" | "comptable";

export type Moyen = "especes" | "mtn_money" | "orange_money" | "nexttel_money" | "virement" | "autre";

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

export interface Classe {
  id: number;
  nom: string;
  titulaire: string;
  frais_annuels: number;
  actif: boolean;
  note: string;
  eleves: number;
}

export interface ListeClasses {
  total: number;
  actives: number;
  classes: Classe[];
}

export interface Eleve {
  id: number;
  classe_id: number;
  classe: string;
  nom: string;
  matricule: string;
  parent_nom: string;
  parent_telephone: string;
  parent_telephone_display: string;
  parent_joignable: boolean;
  parent_operateur: string;
  frais_attendu: number;
  paye: number;
  reste: number;
  solde: number;
  actif: boolean;
  note: string;
  versements: number;
}

export interface ListeEleves {
  total?: number;
  actifs?: number;
  eleves: Eleve[];
}

export interface Versement {
  id: number;
  eleve_id: number;
  eleve: string;
  classe: string;
  montant: number;
  moyen: Moyen;
  date: string;
  periode: string;
  note: string;
  recu: string;
  annule: boolean;
  cree_par: string;
  cree_le: string;
}

export interface ListeVersements {
  versements: Versement[];
}

export interface Etat {
  jour: string;
  periode: string;
  classes: number;
  eleves: number;
  encaisses: number;
  ca_mois: number;
  ca_total: number;
  reste_total: number;
}

export interface Recap {
  periode: string;
  versements: number;
  encaisses: number;
  par_classe: {
    classe_id: number;
    classe: string;
    eleves: number;
    attendu: number;
    reste: number;
  }[];
  par_eleve: {
    eleve_id: number;
    nom: string;
    classe: string;
    paye: number;
    reste: number;
    solde: number;
  }[];
}

export interface RecuPublic {
  valide: boolean;
  code?: string;
  recu?: string;
  ecole?: string;
  ville?: string;
  quartier?: string;
  eleve?: string;
  classe?: string;
  parent?: string;
  montant?: number;
  moyen?: Moyen;
  date?: string;
  periode?: string;
  note?: string;
}

export interface ClasseEntree {
  nom: string;
  titulaire: string;
  frais_annuels: number;
  note: string;
}

export interface EleveEntree {
  classe_id: number;
  nom: string;
  matricule: string;
  parent_nom: string;
  parent_telephone: string;
  frais_attendu: number | null;
  note: string;
}

export interface VersementEntree {
  eleve_id: number;
  montant: number;
  moyen: Moyen;
  periode?: string | null;
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
