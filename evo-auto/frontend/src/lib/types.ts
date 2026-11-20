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

export type Carburant = "essence" | "diesel" | "hybride" | "electrique";
export type Boite = "manuelle" | "automatique";
export type StatutVehicule = "en_vente" | "reserve" | "vendu" | "retire";
export type TypeClient = "particulier" | "entreprise" | "garage";

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

export type Vehicule = {
  id: number;
  marque: string;
  modele: string;
  annee: number;
  kilometrage: number;
  carburant: Carburant | string;
  boite: Boite | string;
  prix: number;
  statut: StatutVehicule | string;
  client_id: number | null;
  client: string;
  date_vente: string | null;
  note: string;
  cree_le: string;
};

export type VehiculePublic = {
  id: number;
  marque: string;
  modele: string;
  annee: number;
  kilometrage: number;
  carburant: Carburant | string;
  boite: Boite | string;
  prix: number;
  statut?: string;
  note: string;
};

export type Catalogue = {
  concessionnaire: Organisation | null;
  vehicules: VehiculePublic[];
  lien?: string;
};

export type Etat = {
  jour: string;
  periode: string;
  vehicules: number;
  en_vente: number;
  reserve: number;
  vendus: number;
  retirés: number;
  clients: number;
  vendus_mois: number;
  valeur_stock: number;
  valeur_vendue_mois: number;
};

export type Recap = {
  periode: string;
  vehicules: number;
  en_vente: number;
  vendus_mois: number;
  valeur_vendue_mois: number;
  valeur_stock: number;
  par_statut: Record<string, number>;
  par_marque: { marque: string; vehicules: number }[];
  par_carburant: { carburant: string; vehicules: number }[];
};

export type ListeVehicules = { total: number; en_vente: number; vendus: number; vehicules: Vehicule[] };
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

export type VehiculeEntree = {
  marque: string;
  modele: string;
  annee: number;
  kilometrage?: number;
  carburant?: string;
  boite?: string;
  prix: number;
  note?: string;
};

export type ClientEntree = {
  nom: string;
  telephone?: string;
  type?: string;
  note?: string;
};
