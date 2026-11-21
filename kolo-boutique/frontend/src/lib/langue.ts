/**
 * Bilinguisme français / anglais pour le comptoir.
 * Le français reste la langue du comptoir ; l'anglais sert le personnel
 * des régions anglophones. Choix gardé dans un cookie, lu côté serveur
 * pour que la première page soit déjà dans la bonne langue.
 */

export const LANGUES = ["fr", "en"] as const;
export type Langue = (typeof LANGUES)[number];
export const LANGUE_DEFAUT: Langue = "fr";
export const NOM_COOKIE = "kolo_langue";

export function normaliserLangue(valeur: string | null | undefined): Langue {
  return valeur === "en" ? "en" : LANGUE_DEFAUT;
}

type Entree = { fr: string; en: string } | string;

const D: Record<string, Entree> = {
  // Le bandeau du haut, vu sur chaque écran du comptoir.
  "dateau.ouvert": { fr: "crédit ouvert", en: "credit open" },
  "dateau.comptant": { fr: "comptant seul", en: "cash only" },
  "pied.abonnement": { fr: "abonnement par semaine", en: "weekly subscription" },
  "pied.numero": { fr: "numéro non noté", en: "number not noted" },
  "pied.demo": { fr: "Démo : aucun vocal reçu, aucun débit MoMo", en: "Demo: no voice note received, no MoMo debit" },

  // La connexion.
  "entree.titre": { fr: "Le cahier de la boutique", en: "The shop notebook" },
  "entree.ouvrir": { fr: "Ouvrir le comptoir", en: "Open the counter" },

  // Le tableau de bord du jour.
  "jour.titre": { fr: "La journée", en: "The day" },
  "jour.meta": { fr: "La journée", en: "The day" },
  "jour.aria-journee": { fr: "Ce que la journée a rapporté", en: "What the day brought in" },
  "jour.aria-ventes": { fr: "Ce qui s'est vendu aujourd'hui", en: "What sold today" },
  "jour.aria-rayon": { fr: "Le rayon qui baisse", en: "The shelf running low" },
  "jour.aria-meilleures": { fr: "Ce qui part le mieux", en: "What sells best" },
  "jour.chapo": {
    fr: "{ventes} vente(s) consignées aujourd'hui, {chiffre} de chiffre et {marge} de marge. La réserve vaut {reserve} de marchandise.",
    en: "{ventes} sale(s) recorded today, {chiffre} in sales and {marge} margin. The reserve holds {reserve} of stock.",
  },
  "jour.ouvrir-dictee": { fr: "Dicter une écriture", en: "Dictate an entry" },
  "jour.ecritures": { fr: "écritures", en: "entries" },
  "jour.chiffre": { fr: "Chiffre d'affaires", en: "Revenue" },
  "jour.par-vente": { fr: "{montant} par vente", en: "{montant} per sale" },
  "jour.rien-vendu": { fr: "rien vendu pour l'instant", en: "nothing sold yet" },
  "jour.benefice": { fr: "Bénéfice net", en: "Net profit" },
  "jour.marge-apres": { fr: "{marge} de marge, après {depenses} de dépenses", en: "{marge} margin, after {depenses} of expenses" },
  "jour.a-racheter": { fr: "À racheter", en: "To restock" },
  "jour.seuil-rayon": { fr: "sous le seuil du rayon", en: "below the shelf threshold" },
  "jour.semaine-aide": {
    fr: "Sept jours d'affilée, la semaine en cours à {chiffre} de chiffre et {benefice} nets.",
    en: "Seven days straight, the current week at {chiffre} in sales and {benefice} net.",
  },
  "jour.ventes-titre": { fr: "Les dernières ventes", en: "Latest sales" },
  "jour.tout-journal": { fr: "tout le journal", en: "full journal" },
  "jour.vide-titre": { fr: "Rien au cahier aujourd'hui.", en: "Nothing in the notebook today." },
  "jour.vide-texte": { fr: "Une phrase de cinq secondes suffit : « 2 fanta 900 ».", en: "A five-second sentence is enough: \"2 fanta 900\"." },
  "jour.dicter": { fr: "Dicter", en: "Dictate" },
  "jour.dictation": { fr: "dictée", en: "dictated" },
  "jour.lignes": { fr: "ligne(s)", en: "line(s)" },
  "jour.tout-au-dessus": { fr: "Tout le rayon est au-dessus de son seuil. Rien à commander demain matin.", en: "The whole shelf is above its threshold. Nothing to order tomorrow morning." },
  "jour.seuil-reste": { fr: "seuil {seuil} · reste {reste} {unite}", en: "threshold {seuil} · {reste} {unite} left" },
  "jour.alerte": { fr: "alerte", en: "alert" },
  "jour.ouvrir-rayon": { fr: "Ouvrir le rayon", en: "Open the shelf" },
  "jour.meilleures-titre": { fr: "Les articles qui tirent la journée", en: "The items driving the day" },
  "jour.par-chiffre": { fr: "par chiffre", en: "by revenue" },
  "jour.meilleures-vide": { fr: "Pas encore de vente aujourd'hui. Le classement se fait tout seul dès la première.", en: "No sales yet today. The ranking builds itself from the first one." },

  // La dictée.
  "dictee.meta": { fr: "Dicter", en: "Dictate" },
  "dictee.titre": { fr: "Dicter au lieu d'écrire", en: "Dictate instead of writing" },
  "dictee.chapo": {
    fr: "La promesse du produit tient dans un champ de texte : une phrase courte, écoutée, relue avant d'entrer au cahier. Rien n'est écrit sans que l'article, la quantité et le prix soient affichés d'abord.",
    en: "The product's promise fits in a text field: a short sentence, heard, reviewed before entering the notebook. Nothing is written until the item, quantity and price are shown first.",
  },
  "dictee.etat-rayee": { fr: "rayée", en: "crossed out" },
  "dictee.etat-sortie": { fr: "sortie", en: "outflow" },
  "dictee.etat-rachat": { fr: "rachat", en: "restock" },
  "dictee.etat-depense": { fr: "dépense", en: "expense" },
  "comptoir.defaut": { fr: "Le comptoir", en: "The counter" },

  // Le rayon.
  "rayon.meta": { fr: "Le rayon", en: "The shelf" },
  "rayon.lignes-tenues": { fr: "ligne(s) tenue(s)", en: "line(s) kept" },
  "rayon.titre": { fr: "Le rayon", en: "The shelf" },
  "rayon.chapo": {
    fr: "La réserve vaut {reserve} de marchandise au coût moyen. {alertes} ligne(s) sous le seuil d'alerte.",
    en: "The reserve holds {reserve} of stock at average cost. {alertes} line(s) below the alert threshold.",
  },
  "rayon.exporter": { fr: "Feuille du rayon", en: "Shelf sheet" },
  "rayon.chercher": { fr: "Chercher un article", en: "Search an item" },
  "rayon.categorie": { fr: "Catégorie", en: "Category" },
  "rayon.ph-cat": { fr: "épicerie", en: "grocery" },
  "rayon.seulement-baisse": { fr: "Seulement ce qui baisse", en: "Only what's running low" },
  "rayon.sous-seuil": { fr: "sous le seuil d'alerte de la ligne", en: "below the line's alert threshold" },
  "rayon.filtrer": { fr: "Filtrer", en: "Filter" },
  "rayon.tout-revoir": { fr: "Tout revoir", en: "Review all" },
  "rayon.rachats-titre": { fr: "Les derniers rachats", en: "Latest restocks" },
  "rayon.rachats-cote": { fr: "{montant} déboursés sur {jours} jours", en: "{montant} spent over {jours} days" },
  "rayon.rachats-vide": {
    fr: "Aucun rachat consigné. Le rayon se garnit par la dictée ou par la fiche d'un article.",
    en: "No restock recorded. The shelf fills through dictation or an item's sheet.",
  },
  "rayon.fournisseur-inconnu": { fr: "fournisseur non noté", en: "supplier not noted" },
};

export function t(
  cle: string,
  langue: Langue = LANGUE_DEFAUT,
  variables?: Record<string, string | number>,
): string {
  const entree = D[cle];
  let texte: string;
  if (typeof entree === "string") texte = entree;
  else if (entree) texte = entree[langue] ?? entree.fr;
  else texte = cle;
  if (!variables) return texte;
  return texte.replace(/\{([a-zA-Z0-9_]+)\}/g, (mot, nom) =>
    Object.prototype.hasOwnProperty.call(variables, nom) ? String(variables[nom]) : mot,
  );
}
