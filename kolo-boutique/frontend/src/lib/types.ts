export type Mode = "especes" | "momo_mtn" | "momo_orange" | "credit";

export type Role = "tenancier" | "vendeur" | "livreur";

export interface Boutique {
  id: number;
  nom: string;
  enseigne: string;
  quartier: string;
  ville: string;
  tenancier: string;
  telephone: string;
  telephone_display: string;
  abonnement_hebdo: number;
  abonnement_hebdo_label: string;
  devise: string;
  especes_actifs: boolean;
  momo_actif: boolean;
  orange_actif: boolean;
  credit_accorde: boolean;
  note: string;
}

export interface Main {
  id: number;
  nom: string;
  email: string;
  role: Role;
  role_label: string;
}

export interface Seance {
  user: Main;
  boutique: Boutique;
  demo: boolean;
}

export interface Connexion {
  user: Main;
  boutique: Boutique;
  expires_in_hours: number;
}

export interface Produit {
  id: number;
  nom: string;
  categorie: string;
  unite: string;
  prix_achat: number;
  prix_achat_label: string;
  prix_vente: number;
  prix_vente_label: string;
  marge: number;
  marge_label: string;
  stock: number;
  alerte_stock: number;
  en_alerte: boolean;
  mots_cles: string;
  actif: boolean;
}

export interface Cahier {
  total: number;
  en_alerte: number;
  reserve: number;
  produits: Produit[];
}

export interface Vente {
  id: number;
  produit: string;
  produit_id: number;
  categorie: string;
  quantite: number;
  unite: string;
  prix_cede: number;
  prix_cede_label: string;
  cout_unitaire: number;
  chiffre: number;
  chiffre_label: string;
  benefice: number;
  benefice_label: string;
  mode: Mode;
  mode_label: string;
  jour: string;
  jour_label: string;
  jour_court: string;
  moment: string;
  heure: string;
  ago: string;
  reference: string;
  dictee: boolean;
  brut: string;
  annule: boolean;
  motif_annulation: string;
  tenu_par: string;
}

export interface JournalVentes {
  jours: number;
  total: number;
  chiffre: number;
  chiffre_label: string;
  benefice: number;
  benefice_label: string;
  ventes: Vente[];
}

export interface Entree {
  id: number;
  produit: string;
  produit_id: number;
  quantite: number;
  unite: string;
  cout_unitaire: number;
  cout_unitaire_label: string;
  total: number;
  total_label: string;
  jour: string;
  jour_label: string;
  fournisseur: string;
  note: string;
  dictee: boolean;
  brut: string;
  tenu_par: string;
}

export interface JournalEntrees {
  jours: number;
  total: number;
  debourse: number;
  debourse_label: string;
  entrees: Entree[];
}

export interface Depense {
  id: number;
  libelle: string;
  categorie: string;
  montant: number;
  montant_label: string;
  jour: string;
  jour_label: string;
  note: string;
}

export interface JournalDepenses {
  jours: number;
  total: number;
  total_label: string;
  depenses: Depense[];
}

export interface MeilleureVente {
  produit: string;
  unite: string;
  quantite: number;
  chiffre: number;
  benefice: number;
}

export interface Semaine {
  jour: string;
  chiffre: number;
  chiffre_label: string;
  benefice: number;
  benefice_label: string;
  depenses: number;
  benefice_net: number;
  benefice_net_label: string;
  ventes: number;
}

export interface BrancheJour {
  jour: string;
  chiffre: number;
  chiffre_label: string;
  benefice: number;
  benefice_label: string;
  ventes: number;
}

export interface Tableau {
  jour: string;
  jour_label: string;
  chiffre: number;
  benefice: number;
  benefice_net: number;
  marge: number;
  ventes: number;
  article_alerte: number;
  reserve: number;
  a_racheter: string[];
  semaine: Semaine;
  serie: BrancheJour[];
  meilleures: MeilleureVente[];
}

export interface FeuilleJour {
  jour: string;
  chiffre: number;
  chiffre_label: string;
  cout: number;
  benefice: number;
  benefice_label: string;
  depenses: number;
  benefice_net: number;
  benefice_net_label: string;
  ventes: number;
  marge: number;
  ticket_moyen: number;
  ticket_moyen_label: string;
}

export interface Journees {
  jours: number;
  journees: FeuilleJour[];
}

export interface Comptage {
  id: number;
  jour: string;
  jour_label: string;
  fond: number;
  fond_label: string;
  attendu: number;
  attendu_label: string;
  compte: number;
  compte_label: string;
  ecart: number;
  ecart_label: string;
  tenu: boolean;
  note: string;
  tenu_par: string;
}

export interface Caisse {
  jour: string;
  jour_label: string;
  ventes: number;
  chiffre: number;
  chiffre_label: string;
  especes: number;
  especes_label: string;
  depenses: number;
  depenses_label: string;
  benefice: number;
  benefice_label: string;
  benefice_net: number;
  benefice_net_label: string;
  marge: number;
  attendu: number;
  attendu_label: string;
  comptage: Comptage | null;
}

export interface EcritureTracee {
  ecriture: string;
  id: number;
}

export interface DicteeRendue {
  ecrite: boolean;
  verbe: "vente" | "entree" | "depense";
  produit: Produit | null;
  quantite: number;
  prix: number | null;
  prix_label: string;
  mode: string;
  libelle: string;
  categorie: string;
  brut: string;
  doute: string | null;
  ecriture?: EcritureTracee;
}

// PUT /boutique attend le modèle complet : aucun champ ne peut manquer.
export interface BoutiqueEntree {
  nom: string;
  enseigne: string;
  quartier: string;
  ville: string;
  tenancier: string;
  telephone: string;
  abonnement_hebdo: number;
  especes_actifs: boolean;
  momo_actif: boolean;
  orange_actif: boolean;
  credit_accorde: boolean;
  note: string;
}

export interface MainEntree {
  nom: string;
  email: string;
  mot_de_passe: string;
  role: Role;
}

export interface ProduitEntree {
  nom: string;
  categorie: string;
  unite: string;
  prix_achat: number;
  prix_vente: number;
  stock: number;
  alerte_stock: number;
  mots_cles: string;
}
