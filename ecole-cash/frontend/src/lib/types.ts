export type Mode = "especes" | "momo_mtn" | "momo_orange" | "cheque" | "virement";

export type Canal = "whatsapp" | "sms";

export type Role = "directrice" | "comptable" | "surveillante";

export type StatutEleve = "suivi" | "suspendu" | "parti";

export type StatutEcheance = "solde" | "a_venir" | "aujourdhui" | "retard";

export type StatutRecu = "envoye" | "file" | "coupé" | "annule";

export interface Ecole {
  id: number;
  nom: string;
  sigle: string;
  genre: string;
  ville: string;
  quartier: string;
  direction: string;
  comptable: string;
  telephone: string;
  telephone_display: string;
  date_rentree: string;
  fin_annee: string;
  annee: string;
  relance_avance: number;
  tolerance_retard: number;
  ton: "courtois" | "ferme";
  mention_recu: string;
  abonnement: number;
  abonnement_label: string;
  whatsapp_actif: boolean;
  sms_actif: boolean;
  especes_actifs: boolean;
  momo_actif: boolean;
  orange_actif: boolean;
}

export interface Membre {
  id: number;
  nom: string;
  email: string;
  role: Role;
  role_label: string;
}

export interface Seance {
  user: Membre;
  ecole: Ecole;
  annee: string;
}

export interface Connexion {
  user: Membre;
  ecole: Ecole;
  expires_in_hours: number;
}

export interface Recu {
  id: number;
  numero: string;
  jeton: string;
  paiement_id: number;
  eleve: string;
  eleve_id: number;
  classe: string;
  montant: number;
  montant_label: string;
  mode: Mode;
  mode_label: string;
  emission: string;
  day: string;
  clock: string;
  ago: string;
  canal: Canal;
  canal_label: string;
  statut: StatutRecu;
  statut_label: string;
  reference: string;
  destinataire: string;
  destinataire_display: string;
  corps: string;
  verif_url: string;
}

export interface Echeance {
  id: number;
  rang: number;
  libelle: string;
  due: string;
  due_label: string;
  due_court: string;
  montant: number;
  montant_label: string;
  impute: number;
  reste: number;
  reste_label: string;
  statut: StatutEcheance;
  statut_label: string;
}

export interface Imputation {
  echeance_id: number;
  libelle: string;
  due_label: string;
  montant: number;
  montant_label: string;
}

export interface Paiement {
  id: number;
  eleve_id: number;
  eleve: string;
  matricule: string;
  classe: string;
  montant: number;
  montant_label: string;
  mode: Mode;
  mode_label: string;
  reference: string;
  encaisse_par: string;
  note: string;
  moment: string;
  day: string;
  clock: string;
  ago: string;
  annule: boolean;
  motif_annulation: string;
  recu: Recu | null;
  imputations: Imputation[];
}

export interface Eleve {
  id: number;
  matricule: string;
  prenom: string;
  nom: string;
  nom_complet: string;
  sexe: "F" | "M";
  classe_id: number | null;
  classe: string;
  tuteur_nom: string;
  tuteur_telephone: string;
  tuteur_telephone_display: string;
  tuteur_second: string;
  tuteur_second_display: string;
  tuteur_lien: string;
  quartier: string;
  statut: StatutEleve;
  statut_label: string;
  motif_statut: string;
  note: string;
  date_entree: string;
  contactable: boolean;
  engagement_id: number | null;
  annee: string;
  du: number;
  du_label: string;
  rentre: number;
  rentre_label: string;
  reste: number;
  reste_label: string;
  remise: number;
  motif_remise: string;
  en_retard: boolean;
  retard_montant: number;
  retard_montant_label: string;
  jours_retard: number;
  prochaine: Echeance | null;
  echeances: Echeance[];
}

export interface ListeEleves {
  annee: string;
  total: number;
  eleves: Eleve[];
  attendu: number;
  rentre: number;
  reste: number;
  retards: number;
}

export interface FicheEleve {
  eleve: Eleve;
  paiements: Paiement[];
  annee: string;
  tuteur_telephones: string[];
}

export interface Classe {
  id: number;
  label: string;
  niveau: number;
  salle: string;
  titulaire: string;
  effectif_max: number;
  effectif: number;
  annee: string;
  scolarite: number;
  cantine: number;
  transport: number;
  autres: number;
  tranches: number;
  total: number;
  total_label: string;
  rentre: number;
  attendu: number;
  part: number;
}

export interface Relance {
  id: number;
  eleve_id: number;
  eleve: string;
  classe: string;
  tuteur: string;
  telephone_display: string;
  echeance_id: number;
  libelle: string;
  due_label: string;
  programme: string;
  programme_label: string;
  canal: Canal;
  canal_label: string;
  corps: string;
  reference: string;
  envoyee: boolean;
  annulee: boolean;
  statut_label: "programmée" | "envoyée" | "annulée";
  envoyee_le: string | null;
}

export interface Journee {
  jour: string;
  jour_label: string;
  fond: number;
  fond_label: string;
  comptage: number;
  comptage_label: string;
  attendu: number;
  attendu_label: string;
  ecart: number | null;
  ecart_label: string;
  declaree: boolean;
  tenu_par: string;
  note: string;
  total: number;
  total_label: string;
  nb_entries: number;
}

export interface JourneeDeclaree extends Journee {
  message: string;
}

export interface EtatCaisse {
  jour: string;
  nb_entries: number;
  total: number;
  especes: number;
  hors_especes: number;
  par_mode: Record<string, number>;
  fond: number;
  attendu: number;
  comptage: number | null;
  ecart: number | null;
  declaree: boolean;
  tenu_par: string;
}

export interface SerieJour {
  day: string;
  total: number;
  especes: number;
  entries: number;
}

export interface EcheanceASurveiller extends Echeance {
  eleve: string;
  classe: string;
}

export interface Tableau {
  day: string;
  annee: string;
  ecole: Ecole;
  caisse: EtatCaisse;
  serie: SerieJour[];
  recouvrement: {
    attendu: number;
    rentre: number;
    reste: number;
    part: number;
  };
  effectif: number;
  en_retard: number;
  suspendus: number;
  relances_dues: number;
  classes: Classe[];
  derniers_recus: Recu[];
  fiches_en_retard: Eleve[];
  prochaines_echeances: EcheanceASurveiller[];
}

export interface ListePaiements {
  jours: number;
  total: number;
  somme: number;
  paiements: Paiement[];
}

export interface Encaissement {
  paiement: Paiement;
  recu: Recu;
  eleve: Eleve;
}

export interface Annulation {
  paiement: Paiement;
  recu: Recu | null;
  reste: number;
}

export interface ListeRecus {
  jours: number;
  total: number;
  recus: Recu[];
}

export interface ListeRelances {
  total: number;
  a_envoyer: number;
  relances: Relance[];
}

export interface Reglages {
  ecole: Ecole;
  membres: Membre[];
  classes: Classe[];
  compteurs: {
    eleves: number;
    recus: number;
    attendu: number;
    rentre: number;
  };
  demo: boolean;
  devise: string;
}

// PUT /settings attend le modèle complet de l'école : aucun champ ne peut manquer.
export interface EcoleEntree {
  nom: string;
  sigle: string;
  genre: string;
  ville: string;
  quartier: string;
  direction: string;
  comptable: string;
  telephone: string;
  date_rentree: string;
  fin_annee: string;
  relance_avance: number;
  tolerance_retard: number;
  ton: "courtois" | "ferme";
  mention_recu: string;
  whatsapp_actif: boolean;
  sms_actif: boolean;
  especes_actifs: boolean;
  momo_actif: boolean;
  orange_actif: boolean;
}

export interface MembreEntree {
  nom: string;
  email: string;
  mot_de_passe: string;
  role: Role;
}

export interface Recapitulatif {
  annee: string;
  familles: number;
  attendu: number;
  rentre: number;
  reste: number;
  part: number;
  familles_payeuses: number;
}

export interface EngagementPose {
  classe: string;
  annee: string;
  creees: number;
  deja_posees: number;
  eleves: number;
  relances_programmees: number;
}

export interface EcheancesPosees {
  eleve: string;
  termes: number;
  reste: number;
}

export interface RelancesProgrammees {
  annee: string;
  posees: number;
}

export interface RelancesLancees {
  envoyees: number;
  annulees: number;
  suspendus: number;
  jour: string;
  canal: Canal;
}

// POST /paiements/apercu : le champ texte du body est ignoré par le backend.
export interface EnvoiTest {
  eleve: string;
  reste: number;
  message: string;
}

export interface EnteteEcole {
  nom: string;
  sigle: string;
  genre: string;
  ville: string;
  quartier: string;
  direction: string;
  comptable: string;
  telephone: string;
  date_rentree: string;
  fin_annee: string;
  relance_avance: number;
  tolerance_retard: number;
  ton: "courtois" | "ferme";
  mention_recu: string;
  whatsapp_actif: boolean;
  sms_actif: boolean;
  especes_actifs: boolean;
  momo_actif: boolean;
  orange_actif: boolean;
}

export interface EnteteClasse {
  label: string;
  niveau: number;
  salle: string;
  titulaire: string;
  effectif_max: number;
  annee: string;
  scolarite: number;
  cantine: number;
  transport: number;
  autres: number;
  tranches: number;
}

export interface EnteteEleve {
  prenoms: string;
  nom: string;
  sexe: "F" | "M";
  classe_id: number | null;
  tuteur_nom: string;
  tuteur_telephone: string;
  tuteur_second: string;
  tuteur_lien: string;
  quartier: string;
  note: string;
}

export interface CorrectionEleve {
  classe_id?: number | null;
  tuteur_nom?: string;
  tuteur_telephone?: string;
  tuteur_second?: string;
  tuteur_lien?: string;
  quartier?: string;
  statut?: StatutEleve;
  motif_statut?: string;
  note?: string;
}

export interface EnteteEngagement {
  eleve_id: number;
  annee: string;
  scolarite: number;
  cantine: number;
  transport: number;
  autres: number;
  remise: number;
  motif_remise: string;
  tranches: number;
  premiere_echeance: string | null;
}

export interface EntetePaiement {
  eleve_id: number;
  montant: number;
  mode: Mode;
  reference: string;
  note: string;
}

export interface EnteteJournee {
  jour: string;
  fond: number;
  comptage: number;
  tenu_par: string;
  note: string;
}

export interface EnteteRelance {
  eleve_id: number;
  palier: number;
  canal: Canal;
  corps: string;
}

export interface EnteteMembre {
  nom: string;
  email: string;
  mot_de_passe: string;
  role: Role;
}

// GET /public/recus/{jeton} : mode y est le LABEL, contrairement au Recu
// où mode est la clé brute. Deux formes, deux types.
export interface RecuPublic {
  valide: boolean;
  numero: string;
  statut: string;
  statut_label: string;
  ecole: string;
  eleve: string;
  classe: string;
  montant: number;
  montant_label: string;
  mode: string;
  emission: string;
  jour: string;
}
