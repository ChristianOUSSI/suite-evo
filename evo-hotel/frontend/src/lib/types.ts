export type Langue = "fr" | "en";

export type Role = "responsable" | "receptionniste";

export type TypeChambre = "standard" | "deluxe" | "suite" | "familiale";

export type StatutSejour = "demande" | "confirmee" | "en_cours" | "terminee" | "annulee";

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

export interface Chambre {
  id: number;
  numero: string;
  type: TypeChambre;
  prix_par_nuit: number;
  capacite: number;
  actif: boolean;
  note: string;
  sejours: number;
}

export interface ListeChambres {
  total: number;
  actives: number;
  chambres: Chambre[];
}

export interface Client {
  id: number;
  nom: string;
  telephone: string;
  telephone_display: string;
  operateur: string;
  joignable: boolean;
  piece: string;
  actif: boolean;
  note: string;
  sejours: number;
}

export interface ListeClients {
  total: number;
  actifs: number;
  clients: Client[];
}

export interface Sejour {
  id: number;
  chambre_id: number;
  chambre: string;
  chambre_type: TypeChambre;
  client_id: number;
  client: string;
  client_telephone: string;
  arrivee: string;
  depart: string;
  nuits: number;
  montant: number;
  statut: StatutSejour;
  statut_effectif?: StatutSejour;
  note: string;
  cree_par: string;
  cree_le: string;
}

export interface ListeSejours {
  sejours: Sejour[];
}

export interface Disponibilite {
  arrivee: string;
  depart: string;
  chambres: {
    id: number;
    numero: string;
    type: TypeChambre;
    prix_par_nuit: number;
    capacite: number;
    nuits: number;
    montant: number;
  }[];
}

export interface Etat {
  jour: string;
  chambres: number;
  occupees: number;
  libres: number;
  en_cours: number;
  arrivees_du_jour: number;
  departs_du_jour: number;
  a_venir: number;
  demandes: number;
}

export interface TypeDisponible {
  type: TypeChambre;
  prix_min: number;
  prix_max: number;
  capacite_max: number;
  chambres: number;
  nuits: number;
}

export interface DisponibilitePublique {
  arrivee: string;
  depart: string;
  types: TypeDisponible[];
}

export interface HotelPublique {
  hotel: Organisation;
}

export interface ReservationEnvoyee {
  ok: boolean;
  reference: number;
  chambre_type: TypeChambre;
  prix_par_nuit: number;
  nuits: number;
  arrivee: string;
  depart: string;
  hotel: Organisation;
}

export interface Recap {
  periode: string;
  chambres: number;
  jours: number;
  nuits_vendues: number;
  capacite_nuits: number;
  taux_occupation: number;
  montant: number;
  arrivees: number;
  par_chambre: {
    chambre_id: number;
    numero: string;
    type: TypeChambre;
    nuits: number;
    montant: number;
  }[];
}

export interface ChambreEntree {
  numero: string;
  type: TypeChambre;
  prix_par_nuit: number;
  capacite: number;
  note: string;
}

export interface ClientEntree {
  nom: string;
  telephone: string;
  piece: string;
  note: string;
}

export interface SejourEntree {
  chambre_id: number;
  client_id?: number | null;
  client_nom?: string;
  client_telephone?: string;
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
