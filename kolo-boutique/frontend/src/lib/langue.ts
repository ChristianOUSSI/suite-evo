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

  // Les réglages.
  "reglages.meta": { fr: "Le comptoir", en: "The counter" },
  "reglages.titre": { fr: "Les réglages du comptoir", en: "Counter settings" },
  "reglages.chapo": {
    fr: "Les mots de la boutique, ses rails de caisse et les mains qui tiennent le cahier. Changer un texte ne change aucune écriture déjà consignée.",
    en: "The shop's words, its payment rails and the hands keeping the notebook. Changing a text alters no recorded entry.",
  },
  "reglages.demo": { fr: "Démo · {abonnement} / semaine", en: "Demo · {abonnement} / week" },
  "reglages.aria-nav": { fr: "Sections des réglages", en: "Settings sections" },
  "reglages.nav-comptoir": { fr: "Le comptoir", en: "The counter" },
  "reglages.nav-rails": { fr: "Les rails", en: "The rails" },
  "reglages.nav-mains": { fr: "Les mains", en: "The hands" },
  "reglages.nav-bilan": { fr: "Le bilan", en: "The balance" },
  "reglages.bilan-aria": { fr: "Ce que le cahier tient déjà", en: "What the notebook already holds" },
  "reglages.bilan-titre": { fr: "Ce que le cahier tient déjà", en: "What the notebook already holds" },
  "reglages.bilan-cote": { fr: "à ne pas effacer", en: "not to be erased" },
  "reglages.lignes-rayon": { fr: "Lignes du rayon", en: "Shelf lines" },
  "reglages.reserve": { fr: "Valeur dormante en réserve", en: "Dormant reserve value" },
  "reglages.chiffre-jour": { fr: "Chiffre d'aujourd'hui", en: "Today's revenue" },
  "reglages.depenses-30": { fr: "Dépenses sur 30 jours", en: "Expenses over 30 days" },
  "reglages.sous-alerte": { fr: "Articles sous l'alerte", en: "Items below alert" },
  "reglages.exporter": { fr: "Emporter les feuilles CSV", en: "Take the CSV sheets" },
  "reglages.retour": { fr: "Revenir à la journée", en: "Back to the day" },

  // Les ventes.
  "sorties.meta": { fr: "Les ventes", en: "Sales" },
  "sorties.derniers-jours": { fr: "{jours} derniers jours", en: "Last {jours} days" },
  "sorties.titre": { fr: "Les ventes du comptoir", en: "Counter sales" },
  "sorties.chapo": {
    fr: "{ventes} vente(s) tenue(s) pour {chiffre} de chiffre et {marge} de marge. {rayees} ligne(s) rayée(s), la marchandise est revenue en réserve.",
    en: "{ventes} sale(s) kept for {chiffre} in revenue and {marge} margin. {rayees} line(s) crossed out, the stock returned to reserve.",
  },
  "sorties.exporter": { fr: "Feuille des ventes", en: "Sales sheet" },
  "sorties.aria-periode": { fr: "Période", en: "Period" },
  "sorties.jour": { fr: "{n} jour(s)", en: "{n} day(s)" },
  "sorties.aria-journal": { fr: "Le journal des ventes", en: "The sales journal" },
  "sorties.journal-titre": { fr: "Le journal", en: "The journal" },
  "sorties.journal-cote": { fr: "du plus récent", en: "newest first" },
  "sorties.vide-titre": { fr: "Rien sur cette période.", en: "Nothing in this period." },
  "sorties.vide-texte": {
    fr: "Une vente naît d'une dictée ou du comptoir, jamais d'un import.",
    en: "A sale is born from dictation or the counter, never from an import.",
  },
  "sorties.rayee": { fr: "rayée", en: "crossed out" },
  "sorties.rayee-motif": { fr: "rayée : {motif}", en: "crossed out: {motif}" },
  "sorties.aria-vendre": { fr: "Vendre au comptoir", en: "Sell at the counter" },
  "sorties.vendre-titre": { fr: "Vendre sans dicter", en: "Sell without dictating" },
  "sorties.vendre-cote": { fr: "la même écriture", en: "the same entry" },
  "sorties.aria-depenses": { fr: "Les dépenses", en: "Expenses" },
  "sorties.depenses-titre": { fr: "Les sorties d'argent", en: "Money out" },
  "sorties.depenses-vide": { fr: "Aucune dépense sur {jours} jours.", en: "No expense over {jours} days." },
  "sorties.sortie": { fr: "sortie", en: "outflow" },

  // Le tiroir.
  "tiroir.meta": { fr: "Le tiroir", en: "The drawer" },
  "tiroir.titre": { fr: "Le tiroir du soir", en: "The evening drawer" },
  "tiroir.chapo": {
    fr: "{ecritures} écriture(s) au cahier aujourd'hui, {chiffre} de chiffre à {marge} de marge. Le tiroir doit contenir {attendu}.",
    en: "{ecritures} entry(ies) in the notebook today, {chiffre} in revenue at {marge} margin. The drawer should hold {attendu}.",
  },
  "tiroir.aria-compter": { fr: "Compter le tiroir", en: "Count the drawer" },
  "tiroir.compter": { fr: "Compter", en: "Count" },
  "tiroir.deja-declare": { fr: "déjà déclaré", en: "already declared" },
  "tiroir.rien-declare": { fr: "rien déclaré", en: "nothing declared" },
  "tiroir.aria-journee": { fr: "Ce que la journée a rendu", en: "What the day returned" },
  "tiroir.journee-titre": { fr: "La journée en chiffres", en: "The day in figures" },
  "tiroir.journee-cote": { fr: "lu au cahier", en: "read from the notebook" },
  "tiroir.chiffre-jour": { fr: "Chiffre du jour", en: "Day's revenue" },
  "tiroir.especes": { fr: "dont espèces", en: "of which cash" },
  "tiroir.brut": { fr: "Bénéfice brut", en: "Gross profit" },
  "tiroir.depenses-jour": { fr: "Dépenses du jour", en: "Day's expenses" },
  "tiroir.net": { fr: "Bénéfice net", en: "Net profit" },
  "tiroir.attendu": { fr: "Attendu au tiroir", en: "Expected in drawer" },
  "tiroir.compte-note": { fr: "Compté {compte} par {par} · écart {ecart}", en: "Counted {compte} by {par} · gap {ecart}" },
  "tiroir.au-franc": { fr: " (au franc près)", en: " (to the franc)" },
  "tiroir.aria-14j": { fr: "Les quatorze derniers jours", en: "The last fourteen days" },
  "tiroir.14j-titre": { fr: "Quatorze jours", en: "Fourteen days" },
  "tiroir.14j-cote": { fr: "du plus récent", en: "newest first" },
  "tiroir.ventes-petites": { fr: "{n} vente(s)", en: "{n} sale(s)" },
  "tiroir.ticket": { fr: "{montant} de ticket", en: "{montant} average ticket" },
  "tiroir.net-tag": { fr: "{montant} net", en: "{montant} net" },
  "tiroir.aria-feuilles": { fr: "Les feuilles à emporter", en: "The sheets to take away" },
  "tiroir.feuilles-titre": { fr: "Les feuilles à emporter", en: "The sheets to take away" },
  "tiroir.feuilles-cote": { fr: "quatre exports", en: "four exports" },
  "tiroir.feuilles-aide": {
    fr: "Chaque feuille s'ouvre dans Excel ou LibreOffice, séparée par des points-virgules. Rien ne quitte cette machine.",
    en: "Each sheet opens in Excel or LibreOffice, semicolon-separated. Nothing leaves this machine.",
  },
  "feuille.ventes-titre": { fr: "Les ventes", en: "Sales" },
  "feuille.ventes-texte": { fr: "Chaque ligne : article, quantité, prix cédé, coût, bénéfice, rail.", en: "Each line: item, quantity, sale price, cost, profit, rail." },
  "feuille.rayon-titre": { fr: "Le rayon", en: "The shelf" },
  "feuille.rayon-texte": { fr: "Coût moyen, prix vendu, stock, seuil d'alerte et valeur dormante.", en: "Average cost, sale price, stock, alert threshold and dormant value." },
  "feuille.journees-titre": { fr: "Les journées", en: "The days" },
  "feuille.journees-texte": { fr: "Un jour par ligne : chiffre, coût, bénéfice net, marge, espèces.", en: "One day per line: revenue, cost, net profit, margin, cash." },
  "feuille.sorties-titre": { fr: "Les sorties", en: "Outflows" },
  "feuille.sorties-texte": { fr: "Transport, loyer, salaire, facture, avec leur date.", en: "Transport, rent, salary, bill, with their date." },
  "tiroir.retour": { fr: "Revenir à la journée", en: "Back to the day" },

  // La connexion.
  "connexion.meta-titre": { fr: "Ouvrir le comptoir", en: "Open the counter" },
  "connexion.meta-desc": {
    fr: "Reprendre le cahier de la boutique : la journée en cours, la dictée du rayon et le tiroir du soir.",
    en: "Resume the shop notebook: the current day, shelf dictation and the evening drawer.",
  },
  "connexion.nav-retour": { fr: "Retour", en: "Back" },
  "connexion.nav-presentation": { fr: "La présentation", en: "The presentation" },
  "connexion.edition": { fr: "Édition de démonstration", en: "Demo edition" },
  "connexion.titre": { fr: "Le comptoir ouvre pour douze heures.", en: "The counter opens for twelve hours." },
  "connexion.chapo": {
    fr: "Une adresse suffit. Le cahier retrouve la journée en cours, le rayon, les dictées déjà écrites et le tiroir compté la veille.",
    en: "One address is enough. The notebook finds the current day, the shelf, the dictations already written and yesterday's counted drawer.",
  },
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
