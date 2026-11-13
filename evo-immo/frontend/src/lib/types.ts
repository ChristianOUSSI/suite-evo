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

export type TypeBien = "maison" | "appartement" | "chambre" | "terrain" | "bureau" | "commercial";
export type StatutBien = "disponible" | "negociation" | "loue" | "vendu" | "retire";
export type Canal = "telephone" | "whatsapp" | "visite" | "panneau" | "bouche_a_oreille" | "autre";
export type StatutDemande = "nouvelle" | "contactee" | "visite" | "convertie" | "perdue";
export type IssueVisite = "a_venir" | "ok" | "absent" | "refusee";

export type Bien = {
  id: number;
  type: TypeBien;
  titre: string;
  ville: string;
  quartier: string;
  prix: number;
  surface_m2: number;
  chambres: number;
  description: string;
  statut: StatutBien;
  proprietaire_nom: string;
  proprietaire_telephone: string;
  proprietaire_telephone_display: string;
  proprietaire_joignable: boolean;
  proprietaire_operateur: string | null;
  agent_id: number;
  agent: string;
  note: string;
  visites: number;
  demandes: number;
  cree_le: string;
};

export type Demande = {
  id: number;
  bien_id: number | null;
  bien: string;
  client_nom: string;
  client_telephone: string;
  client_telephone_display: string;
  client_joignable: boolean;
  client_operateur: string | null;
  canal: Canal;
  message: string;
  statut: StatutDemande;
  note: string;
  date: string;
  cree_par: string;
  cree_le: string;
};

export type Visite = {
  id: number;
  bien_id: number;
  bien: string;
  type: TypeBien;
  quartier: string;
  date: string;
  heure: string;
  client_nom: string;
  client_telephone: string;
  client_telephone_display: string;
  client_joignable: boolean;
  issue: IssueVisite;
  note: string;
  cree_par: string;
  cree_le: string;
};

export type Etat = {
  jour: string;
  periode: string;
  biens: number;
  disponibles: number;
  negociations: number;
  vendus_loues: number;
  demandes_neuves: number;
  visites_aujourdhui: number;
  visites_mois: number;
  demandes_mois: number;
  ventes_mois: number;
};

export type Recap = {
  periode: string;
  biens: number;
  disponibles: number;
  visites: number;
  demandes: number;
  par_issue: Record<string, number>;
  par_type: { type: string; biens: number; valeur: number }[];
  par_quartier: { quartier: string; demandes: number }[];
  ventes_total: number;
  ventes_mois: number;
};

export type Annonce = {
  id: number;
  type: TypeBien;
  titre: string;
  ville: string;
  quartier: string;
  prix: number;
  surface_m2: number;
  chambres: number;
  description: string;
  statut: StatutBien;
};

export type AnnoncesPubliques = {
  agence: Organisation;
  annonces: Annonce[];
};

export type ListeBiens = { total: number; disponibles: number; biens: Bien[] };
export type ListeDemandes = { demandes: Demande[] };
export type ListeVisites = { visites: Visite[] };

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

export type BienEntree = {
  type: TypeBien;
  titre?: string;
  ville: string;
  quartier?: string;
  prix: number;
  surface_m2?: number;
  chambres?: number;
  description?: string;
  proprietaire_nom: string;
  proprietaire_telephone?: string;
  agent_id?: number | null;
  note?: string;
};

export type DemandeEntree = {
  bien_id?: number | null;
  client_nom: string;
  client_telephone?: string;
  canal?: Canal;
  message?: string;
  statut?: StatutDemande;
  date?: string | null;
};

export type VisiteEntree = {
  bien_id: number;
  date?: string | null;
  heure?: string;
  client_nom?: string;
  client_telephone?: string;
  issue?: IssueVisite;
  note?: string;
};
