// Langue du produit : français d'abord, anglais ensuite.
// Module sans dépendance serveur : importable côté client et côté serveur.

export type Langue = "fr" | "en";

export const LANGUES: readonly Langue[] = ["fr", "en"];
export const LANGUE_DEFAUT: Langue = "fr";
export const NOM_COOKIE = "ecole_langue";

export function normaliserLangue(valeur: string | null | undefined): Langue {
  return valeur === "en" ? "en" : LANGUE_DEFAUT;
}

const D: Record<string, { fr: string; en: string }> = {
  // Le chrome de l'espace.
  "dateline.annee": { fr: "{annee} · {sigle}", en: "{annee} · {sigle}" },
  "pied.abonnement": { fr: "abonnement {label}/mois", en: "subscription {label}/month" },
  "pied.demo": { fr: "Démo : aucun SMS, aucun débit MoMo", en: "Demo: no SMS, no MoMo debit" },
  "pied.edition": { fr: "édition de démonstration", en: "demo edition" },
  "sortie.ranger": { fr: "Ranger", en: "Sign out" },
  "sortie.rangement": { fr: "Rangement", en: "Signing out" },
  "marque.sous": { fr: "le cahier de l'école", en: "the school notebook" },
  "incident.ferme": { fr: "Caisse fermée", en: "Till closed" },
  "incident.titre": { fr: "La caisse de l'école ne répond pas.", en: "The school till is not responding." },
  "incident.message": { fr: "Le registre n'a pas pu être ouvert. Vérifie que l'API tourne sur le port attendu, puis repasse par ici.", en: "The register could not be opened. Check that the API is running on the expected port, then come back." },
  "incident.repasser": { fr: "Repasser", en: "Try again" },
  "incident.rouvrir": { fr: "Rouvrir la séance", en: "Reopen the session" },
  "nav.aria": { fr: "Navigation de la caisse", en: "Till navigation" },
  "nav.tableau": { fr: "Tableau", en: "Board" },
  "nav.guichet": { fr: "Guichet", en: "Counter" },
  "nav.eleves": { fr: "Élèves", en: "Students" },
  "nav.classes": { fr: "Classes", en: "Classes" },
  "nav.relances": { fr: "Relances", en: "Reminders" },
  "nav.recus": { fr: "Reçus", en: "Receipts" },
  "nav.journal": { fr: "Journal", en: "Journal" },
  "nav.reglages": { fr: "Réglages", en: "Settings" },
  "sortie.fermer": { fr: "Fermer la caisse", en: "Close the till" },
  "sortie.fermeture": { fr: "Fermeture", en: "Closing" },
  // La landing.
  "meta.accueil": { fr: "La caisse des écoles privées de 150 à 2 000 élèves : encaissement au guichet, reçu WhatsApp immédiat, relances programmées, comptage du soir.", en: "The till for private schools of 150 to 2,000 students: counter collection, instant WhatsApp receipt, scheduled reminders, evening count." },
  "landing.nav.aria": { fr: "Navigation du site", en: "Site navigation" },
  "landing.ouvrir": { fr: "Ouvrir la caisse", en: "Open the till" },
  "landing.kicker": { fr: "CODE AXIS DIGITAL CAMEROON · Douala", en: "CODE AXIS DIGITAL CAMEROON · Douala" },
  "landing.titre": { fr: "Les frais de scolarité, tenus comme un cahier.", en: "School fees, kept like a notebook." },
  "landing.intro": { fr: "ÉCOLE CASH remplace le classeur à spirale de la caisse. Il tient sur un téléphone à 25 000 F, une connexion qui coupe, et il ne demande aucune carte bancaire à personne.", en: "ÉCOLE CASH replaces the cash desk's spiral notebook. It runs on a 25,000 F phone, on a patchy connection, and asks no one's bank card." },
  "landing.demo": { fr: "Voir la caisse de démonstration", en: "See the demo till" },
  "landing.verifier": { fr: "Vérifier un reçu", en: "Verify a receipt" },
  "landing.prix": { fr: "Prix", en: "Price" },
  "landing.prix_suite": { fr: "par école et par mois, sans engagement.", en: "per school, per month, no commitment." },
  "landing.liste1": { fr: "Écoles de 150 à 2 000 élèves.", en: "Schools of 150 to 2,000 students." },
  "landing.liste2": { fr: "Directrice, comptable et surveillante sur la même caisse.", en: "Principal, accountant and supervisor on the same till." },
  "landing.liste3": { fr: "Feuilles CSV à remettre à la trésorière ou au comptable.", en: "CSV sheets for the bursar or accountant." },
  "landing.gestes_aria": { fr: "Les quatre gestes", en: "The four gestures" },
  "landing.section_titre": { fr: "Ce que la caissière fait, quatre fois par jour", en: "What the cashier does, four times a day" },
  "landing.section_aside": { fr: "Rien d'autre à apprendre", en: "Nothing else to learn" },
  "geste.encaisser.titre": { fr: "Encaisser", en: "Collect" },
  "geste.encaisser.texte": { fr: "Le montant dû est déjà coupé en tranches. On saisit l'élève, le mode, le montant : les imputations se posent du terme le plus ancien au plus récent.", en: "The amount due is already split into instalments. Enter the student, the method, the amount: payments apply from the oldest term to the newest." },
  "geste.recu.titre": { fr: "Remettre le reçu", en: "Hand over the receipt" },
  "geste.recu.texte": { fr: "Numéro, jeton de vérification et texte du message sont écrits à l'encaissement. Le parent fait vérifier son reçu depuis n'importe quel téléphone.", en: "Number, verification token and message text are written at collection. The parent verifies the receipt from any phone." },
  "geste.relancer.titre": { fr: "Relancer", en: "Remind" },
  "geste.relancer.texte": { fr: "Quatre paliers par terme : sept jours avant, le jour dit, le premier retard, le dernier avis. Le ton est courtois ou ferme, jamais improvisé.", en: "Four tiers per term: seven days before, the day itself, first overdue, last notice. The tone is polite or firm, never improvised." },
  "geste.compter.titre": { fr: "Compter le tiroir", en: "Count the drawer" },
  "geste.compter.texte": { fr: "Le soir, on note le fond et le comptage. L'écart reste ouvert à l'écran tant qu'il n'est pas expliqué.", en: "In the evening, note the float and the count. The gap stays open on screen until explained." },
  "landing.note": { fr: "Édition de démonstration : les élèves, les parents et les paiements de cette caisse sont inventés. Aucun message n'est envoyé.", en: "Demo edition: this till's students, parents and payments are invented. No message is sent." },
  "landing.adresse": { fr: "Bonabéri, Douala", en: "Bonabéri, Douala" },
  "landing.connexion": { fr: "Connexion", en: "Sign in" },
  // La connexion.
  "meta.connexion": { fr: "Ouvrir la caisse d'un groupe scolaire : encaissements, reçus WhatsApp et relances de scolarité.", en: "Open a school group's till: collections, WhatsApp receipts and fee reminders." },
  "connexion.titre": { fr: "Connexion", en: "Sign in" },
  "connexion.stamp": { fr: "Édition de démonstration", en: "Demo edition" },
  "connexion.kicker": { fr: "Année 2026/2027 · Douala", en: "Year 2026/2027 · Douala" },
  "connexion.titre_promo": { fr: "Le reçu part sur le téléphone du parent.", en: "The receipt goes straight to the parent's phone." },
  "connexion.intro": { fr: "À la caisse, on encaisse en espèces, MoMo ou Orange Money. Le reçu s'écrit dans la seconde, la relance se programme toute seule, et le soir, le comptage du tiroir se note en trente secondes.", en: "At the till, collect cash, MoMo or Orange Money. The receipt is written in a second, reminders schedule themselves, and in the evening the drawer count takes thirty seconds." },
  "connexion.liste1": { fr: "Une ardoise par élève et par année, en FCFA entiers.", en: "One ledger per student per year, in whole FCFA." },
  "connexion.liste2": { fr: "Le parent sans smartphone reçoit un message écrit pour lui.", en: "The parent without a smartphone gets a written message instead." },
  "connexion.liste3": { fr: "L'écart du jour reste ouvert tant qu'il n'est pas expliqué.", en: "The day's gap stays open until explained." },
  "connexion.note": { fr: "ÉCOLE CASH est un produit de CODE AXIS DIGITAL CAMEROON, à Bonabéri, Douala. Les données de cette édition sont un groupe scolaire fictif.", en: "ÉCOLE CASH is a product of CODE AXIS DIGITAL CAMEROON, in Bonabéri, Douala. This edition's data is a fictional school group." },
  "connexion.prix": { fr: "15 000 FCFA / école / mois", en: "15,000 FCFA / school / month" },
  "connexion.accueil": { fr: "Accueil", en: "Home" },
  // La vérification publique.
  "verif.meta.titre": { fr: "Vérification d'un reçu", en: "Receipt verification" },
  "verif.meta.desc": { fr: "Contrôler qu'un reçu de scolarité a bien été consigné à la caisse de l'école.", en: "Check that a school fee receipt was properly recorded at the school till." },
  "verif.kicker": { fr: "Vérification de reçu", en: "Receipt verification" },
  "verif.introuvable": { fr: "Introuvable", en: "Not found" },
  "verif.titre_absent": { fr: "Ce numéro n'est dans aucune école.", en: "This number belongs to no school." },
  "verif.message_absent": { fr: "Le code se trouve en bas du reçu, dix caractères sans espaces. Vérifiez la casse et les chiffres : le O et le 0 ne se ressemblent pas à l'écrit.", en: "The code is at the bottom of the receipt, ten characters without spaces. Check case and digits: O and 0 don't look alike in writing." },
  "verif.retour": { fr: "Retour à l'accueil", en: "Back to home" },
  "verif.valable": { fr: "Reçu valable", en: "Valid receipt" },
  "verif.annule": { fr: "Reçu annulé", en: "Cancelled receipt" },
  "verif.regle_par": { fr: "réglé par", en: "paid by" },
  "verif.jour_a": { fr: "à", en: "at" },
  "verif.eleve": { fr: "Élève", en: "Student" },
  "verif.classe": { fr: "Classe", en: "Class" },
  "verif.numero": { fr: "Numéro de reçu", en: "Receipt number" },
  "verif.code": { fr: "Code de contrôle", en: "Control code" },
  "verif.demo": { fr: "Démo : cette page lit la caisse d'une école fictive. Aucun encaissement réel n'est associé.", en: "Demo: this page reads a fictional school's till. No real payment is linked." },
  // Le formulaire de connexion et les champs partagés.
  "connexion.erreur": { fr: "La caisse ne répond pas.", en: "The till is not responding." },
  "connexion.email": { fr: "Adresse de la caisse", en: "Till address" },
  "connexion.mdp": { fr: "Mot de passe", en: "Password" },
  "connexion.ouvrir": { fr: "Ouvrir la caisse", en: "Open the till" },
  "connexion.ouverture": { fr: "Ouverture…", en: "Opening…" },
  "connexion.demo_mention": { fr: "Démo : les deux comptes ci-dessous ouvrent un groupe scolaire fictif. Aucun parent n'est contacté.", en: "Demo: the two accounts below open a fictional school group. No parent is contacted." },
  "connexion.role.directrice": { fr: "Directrice", en: "Principal" },
  "connexion.role.comptable": { fr: "Comptable", en: "Accountant" },
  "tel.aide": { fr: "Neuf chiffres commençant par 2, 6 ou 7.", en: "Nine digits starting with 2, 6 or 7." },
  "demo.mention": { fr: "Démo : aucun envoi WhatsApp, aucun débit MoMo. Le reçu reste dans cette machine.", en: "Demo: no WhatsApp sent, no MoMo debit. The receipt stays on this machine." },
};

// Lecture côté client (composants "use client" sans parent serveur) :
// le cookie posé par le commutateur. Absent ou illisible → français.
export function langueDepuisCookie(): Langue {
  if (typeof document === "undefined") return LANGUE_DEFAUT;
  const brut = document.cookie
    .split("; ")
    .find((une) => une.startsWith(`${NOM_COOKIE}=`))
    ?.split("=")[1];
  return normaliserLangue(brut ? decodeURIComponent(brut) : null);
}

export function t(
  cle: string,
  langue: Langue = LANGUE_DEFAUT,
  variables?: Record<string, string | number>,
): string {
  const entree = D[cle];
  let texte: string;
  if (entree) texte = entree[langue] ?? entree.fr;
  else texte = cle;
  if (!variables) return texte;
  return texte.replace(/\{([a-zA-Z0-9_]+)\}/g, (mot, nom) =>
    Object.prototype.hasOwnProperty.call(variables, nom) ? String(variables[nom]) : mot,
  );
}
