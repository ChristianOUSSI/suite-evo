export type Langue = "fr" | "en";

export type Rythme = "hebdo" | "quinzaine" | "mensuel";

export type StatutTour = "a_venir" | "en_cours" | "tire" | "remis";

export type Role = "responsable" | "tresorier" | "membre";

export type Rail = "especes" | "momo_mtn" | "momo_orange";

export interface Groupe {
  id: number;
  nom: string;
  ville: string;
  quartier: string;
  frequence: Rythme;
  jour_ancre: number;
  cotisation: number;
  penalite: number;
  telephone: string;
  telephone_display: string;
  mot_du_groupe: string;
  abonnement_mensuel: number;
  momo_actif: boolean;
  orange_actif: boolean;
  especes_actifs: boolean;
}

export interface Compte {
  id: number;
  nom: string;
  email: string;
  role: Role;
}

export interface Seance {
  user: Compte;
  groupe: Groupe;
  demo: boolean;
}

export interface Connexion {
  user: Compte;
  groupe: Groupe;
  expires_in_hours: number;
}

export interface Membre {
  id: number;
  nom: string;
  telephone: string;
  telephone_display: string;
  operateur: string;
  joignable: boolean;
  part: number;
  actif: boolean;
  entree_le: string;
  note: string;
  du: number;
  paye: number;
  reste: number;
  penalite: number;
  payee_le: string | null;
  mode: string;
  reference: string;
}

export interface Cercle {
  total: number;
  actifs: number;
  parts: number;
  pot: number;
  tour: Tour | null;
  membres: Membre[];
}

export interface Tour {
  id: number;
  numero: number;
  date_prevue: string;
  date_tirage: string | null;
  statut: StatutTour;
  pot: number;
  du: number;
  rentre: number;
  restant: number;
  gagnant: string | null;
  gagnant_id: number | null;
  graine: string;
  note: string;
  remis: boolean;
}

export interface Remise {
  id: number;
  tour_id: number;
  numero_tour: number;
  membre: string;
  membre_id: number;
  montant: number;
  moment: string;
  jour: string;
  jeton: string;
  temoin: string;
  mode: string;
  note: string;
}

export interface TourFiche extends Tour {
  cotisations: Membre[];
  remise: Remise | null;
}

/** Le tour, tel que le rend le point de tirage : le calcul est refait à la lecture. */
export interface Tirage extends Tour {
  taille: number;
  verifier: {
    graine: string;
    index: number;
    nom: string | null;
  } | null;
}

export interface Etat {
  groupe_id: number;
  jour: string;
  membres: number;
  tours: number;
  pot_attendu: number;
  pot_rentre: number;
  pot_restant: number;
  penalites: number;
  en_retard: string[];
  total_remis: number;
  tour_courant: Tour | null;
  dernier: (Tour & { remise: Remise | null }) | null;
  prochain: {
    numero: number;
    date_prevue: string;
    montant_pot: number;
    statut: StatutTour;
  } | null;
}

export interface ListeTours {
  total: number;
  remis: number;
  tours: Tour[];
}

export interface Paiement {
  cotisation: Membre;
  tour: Tour;
}

/** Le reçu public, rendu sans compte. */
export interface RecuPublic {
  valide: boolean;
  groupe: string;
  ville: string;
  quartier: string;
  numero_tour: number;
  jour: string;
  jour_label: string;
  membre: string;
  montant: number;
  montant_label: string;
  mode: string;
  temoin: string;
  note: string;
  moment: string;
  abonnement: number;
}

/** Les corps envoyés au backend. PUT /groupe attend le modèle complet. */
export interface GroupeEntree {
  nom: string;
  ville: string;
  quartier: string;
  frequence: Rythme;
  jour_ancre: number;
  cotisation: number;
  penalite: number;
  telephone: string;
  mot_du_groupe: string;
  momo_actif: boolean;
  orange_actif: boolean;
  especes_actifs: boolean;
}

export interface CompteEntree {
  nom: string;
  email: string;
  mot_de_passe: string;
  role: Role;
}

export interface MembreEntree {
  nom: string;
  telephone: string;
  part: number;
  note: string;
}
