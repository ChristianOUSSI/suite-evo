import { creerTraducteur, type Dictionnaire } from "@cadc/kit/i18n";

/**
 * Tous les mots du carnet, dans les deux langues, au même endroit.
 *
 * Le backend rend des nombres et des clés stables ; c'ici que le français
 * devient de l'anglais. Les phrases restent courtes : un vendeur les lit en
 * marchant, le téléphone dans une main, un carton dans l'autre.
 */
export const DICTEE: Dictionnaire = {
  // Marque et navigation
  "marque.slogan": { fr: "le carnet qui se souvient", en: "the book that remembers" },
  "nav.carnet": { fr: "Aujourd'hui", en: "Today" },
  "nav.clients": { fr: "Les clients", en: "Customers" },
  "nav.relances": { fr: "Les relances", en: "Reminders" },
  "nav.silence": { fr: "Sans nouvelles", en: "Gone quiet" },
  "nav.reglages": { fr: "Les réglages", en: "Settings" },
  "aller.contenu": { fr: "Aller au contenu", en: "Skip to content" },
  "langue.label": { fr: "Langue", en: "Language" },
  "texte.label": { fr: "Taille du texte", en: "Text size" },
  "meta.titre": {
    fr: "evo-crm | le carnet qui se souvient",
    en: "evo-crm | the book that remembers",
  },
  "meta.description": {
    fr: "Le carnet de clients d'une PME camerounaise : qui a été appelé, qui doit l'être ce matin, et la fiche à sortir au comptoir.",
    en: "The customer book of a Cameroonian business: who was called, who must be called this morning, and the card to bring out at the counter.",
  },

  // Entrée
  "entree.titre": {
    fr: "Une PME ne perd pas ses clients par manque de marché. Elle les perd par silence.",
    en: "A small business does not lose its customers for lack of market. It loses them to silence.",
  },
  "entree.chapo": {
    fr: "evo-crm tient le carnet d'un comptoir de Douala : la fiche de chaque client, ce qui s'est dit, et la liste de qui rappeler ce matin.",
    en: "evo-crm keeps a counter's book in Douala: one card per customer, what was said, and the list of who to call this morning.",
  },
  "entree.ouvrir": { fr: "Ouvrir le carnet", en: "Open the book" },
  "entree.prix": { fr: "10 000 F par mois", en: "10 000 F a month" },
  "entree.slogan": {
    fr: "un téléphone, pas d'application",
    en: "one phone, no app to install",
  },
  "entree.exige": { fr: "Ce que le carnet demande", en: "What the book needs" },
  "entree.exige-aide": {
    fr: "Un téléphone à 25 000 F, une connexion qui coupe, {reseaux}. Pas de carte bancaire, pas de tablette, pas de formation.",
    en: "A 25,000 F phone, a connection that drops, {reseaux}. No bank card, no tablet, no training.",
  },
  "geste.titre": { fr: "Quatre gestes du carnet", en: "Four moves in the book" },
  "geste.1.titre": { fr: "Noter l'appel", en: "Log the call" },
  "geste.1.texte": {
    fr: "Appel, WhatsApp, visite, devis, commande : une ligne, une date, un montant si c'est un devis.",
    en: "Call, WhatsApp, visit, quote, order: one line, one date, one amount if it is a quote.",
  },
  "geste.2.titre": {
    fr: "Un devis ouvre la reprise",
    en: "A quote opens the follow-up",
  },
  "geste.2.texte": {
    fr: "Le jour même, le carnet pose la relance quelques jours plus tard. Personne n'a à y penser.",
    en: "The same day, the book places the reminder a few days later. Nobody has to remember.",
  },
  "geste.3.titre": { fr: "Voir qui rappeler", en: "See who to call" },
  "geste.3.texte": {
    fr: "Ce matin : les relances dues, celles en retard, et les clients sans nouvelles depuis trop longtemps.",
    en: "This morning: reminders due, ones overdue, and customers gone quiet for too long.",
  },
  "geste.4.titre": { fr: "Sortir la fiche", en: "Bring out the card" },
  "geste.4.texte": {
    fr: "Réseau, quartier, historique, et le lien qui ouvre WhatsApp avec le client.",
    en: "Network, area, history, and the link that opens WhatsApp with the customer.",
  },

  // Séance
  "seance.titre": {
    fr: "Le carnet s'ouvre douze heures",
    en: "The book opens for twelve hours",
  },
  "seance.chapo": {
    fr: "Une adresse et un mot de passe. Rien à installer sur le téléphone.",
    en: "One address and one password. Nothing to install on the phone.",
  },
  "seance.adresse": { fr: "Adresse du carnet", en: "Book address" },
  "seance.mot": { fr: "Mot de passe", en: "Password" },
  "seance.ouvrir": { fr: "Ouvrir le carnet", en: "Open the book" },
  "seance.ouverture": { fr: "Ouverture", en: "Opening" },
  "seance.comptes": { fr: "Deux comptes de démonstration", en: "Two demo accounts" },
  "seance.responsable": {
    fr: "toute la maison, écrit les réglages",
    en: "the whole book, writes the settings",
  },
  "seance.vendeur": {
    fr: "le journal et les relances, rien d'autre",
    en: "the log and the reminders, nothing else",
  },
  "seance.aide": {
    fr: "Un clic remplit les deux champs. La séance tient dans un cookie que le téléphone ne lit pas.",
    en: "One click fills both fields. The session lives in a cookie the phone cannot read.",
  },

  // Accueil
  "carnet.titre": { fr: "Qui rappeler ce matin", en: "Who to call this morning" },
  "carnet.chapo": {
    fr: "Les relances dues, celles qui ont glissé, et ce que le carnet a retenu ces trente derniers jours.",
    en: "Reminders due, the ones that slipped, and what the book kept over the last thirty days.",
  },
  "carnet.sur": { fr: "Séance du", en: "Book open on" },
  "carnet.en_retard": { fr: "en retard", en: "overdue" },
  "carnet.rien_rappeler": {
    fr: "Aucune relance due. Le carnet surveille quand même les silences.",
    en: "No reminder due. The book still watches the silence.",
  },
  "carnet.tous_rappelles": {
    fr: "Tout le monde a été rappelé.",
    en: "Everyone has been called back.",
  },
  "carnet.prochain": { fr: "La prochaine reprise", en: "The next follow-up" },
  "carnet.silence_titre": {
    fr: "Sans nouvelles depuis trop longtemps",
    en: "Gone quiet for too long",
  },
  "carnet.silence_aide": {
    fr: "Au-delà de {n} jours sans une ligne dans le journal.",
    en: "Past {n} days without one line in the log.",
  },

  // Chiffres
  "stat.clients": { fr: "Fiches du carnet", en: "Cards in the book" },
  "stat.actifs": { fr: "Toujours là", en: "Still in" },
  "stat.joignables": { fr: "Joignables", en: "Reachable" },
  "stat.sans_numero": { fr: "Sans numéro", en: "No number" },
  "stat.echanges": { fr: "Lignes du journal", en: "Log lines" },
  "stat.devis": { fr: "Devis", en: "Quotes" },
  "stat.commandes": { fr: "Commandes", en: "Orders" },
  "stat.relances": { fr: "À rappeler", en: "To call back" },
  "stat.retards": { fr: "En retard", en: "Overdue" },
  "stat.silencie": { fr: "Sans nouvelles", en: "Gone quiet" },
  "stat.dernier": { fr: "Dernière ligne", en: "Last entry" },
  "stat.30j": { fr: "ces 30 jours", en: "last 30 days" },

  // Clients
  "clients.titre": { fr: "Les clients du carnet", en: "Customers in the book" },
  "clients.chapo": {
    fr: "Une fiche par personne ou par maison. Le numéro suffit à la retrouver au comptoir.",
    en: "One card per person or per business. The number is enough to find it at the counter.",
  },
  "clients.ajouter": { fr: "Ajouter un client", en: "Add a customer" },
  "clients.nouveau": { fr: "Nouvelle fiche", en: "New card" },
  "clients.recherche": { fr: "Chercher", en: "Search" },
  "clients.recherche-aide": {
    fr: "Un nom, un quartier, un numéro, un mot de la note.",
    en: "A name, an area, a number, one word from the note.",
  },
  "clients.vide": {
    fr: "Aucune fiche ne répond à cette recherche.",
    en: "No card answers that search.",
  },
  "clients.trouves": {
    fr: "{n} fiches dans le carnet",
    en: "{n} cards in the book",
  },
  "clients.nom": { fr: "Nom", en: "Name" },
  "clients.telephone": { fr: "Numéro", en: "Number" },
  "clients.email": { fr: "Courriel", en: "Email" },
  "clients.quartier": { fr: "Quartier", en: "Area" },
  "clients.note": { fr: "Note du comptoir", en: "Counter note" },
  "clients.note-aide": {
    fr: "Ce que l'équipe doit savoir dans deux mois.",
    en: "What the team should still know in two months.",
  },
  "clients.telephone-aide": {
    fr: "Neuf chiffres après +237, ou rien. Un client sans numéro ne se rappelle pas.",
    en: "Nine digits after +237, or nothing. A customer with no number cannot be called back.",
  },
  "clients.sortir": { fr: "Sortir du carnet", en: "Take out of the book" },
  "clients.reprendre": { fr: "Faire revenir", en: "Bring back" },
  "clients.sorti": { fr: "Sorti", en: "Out" },
  "clients.dans": { fr: "Dans le carnet", en: "In the book" },
  "clients.sortir-aide": {
    fr: "Rien n'est effacé : le journal et les relances closes restent. Seules les reprises s'arrêtent.",
    en: "Nothing is erased: the log and closed reminders stay. Only the follow-ups stop.",
  },
  "clients.entre_le": { fr: "Fiche ouverte le", en: "Card opened on" },
  "clients.segment": { fr: "Segment", en: "Segment" },
  "clients.operateur": { fr: "Réseau", en: "Network" },

  // Segments et types
  "segment.particulier": { fr: "Particulier", en: "Private" },
  "segment.revendeur": { fr: "Revendeur", en: "Reseller" },
  "segment.grossiste": { fr: "Grossiste", en: "Wholesaler" },
  "segment.institution": { fr: "Institution", en: "Institution" },
  "type.appel": { fr: "Appel", en: "Call" },
  "type.whatsapp": { fr: "WhatsApp", en: "WhatsApp" },
  "type.visite": { fr: "Visite", en: "Visit" },
  "type.sms": { fr: "SMS", en: "SMS" },
  "type.devis": { fr: "Devis", en: "Quote" },
  "type.commande": { fr: "Commande", en: "Order" },
  "type.reclamation": { fr: "Réclamation", en: "Complaint" },
  "type.formulaire": { fr: "Formulaire", en: "Form" },

  // Fiche
  "fiche.journal": { fr: "Ce qui s'est dit", en: "What was said" },
  "fiche.journal_vide": {
    fr: "Aucune ligne dans le journal. Le carnet ne peut pas deviner.",
    en: "No line in the log. The book cannot guess.",
  },
  "fiche.silence": {
    fr: "Plus de nouvelles depuis {n} jours.",
    en: "No news for {n} days.",
  },
  "fiche.jamais": { fr: "Jamais contacté", en: "Never contacted" },
  "fiche.jours": { fr: "{n} jours", en: "{n} days" },
  "fiche.aujourdhui": { fr: "aujourd'hui", en: "today" },
  "fiche.hier": { fr: "hier", en: "yesterday" },
  "fiche.whatsapp": { fr: "Ouvrir WhatsApp", en: "Open WhatsApp" },
  "fiche.appeler": { fr: "Appeler", en: "Call" },
  "fiche.ecrire": { fr: "Écrire", en: "Write" },
  "fiche.rien_a_rappeler": {
    fr: "Pas de numéro sur cette fiche : rien à rappeler.",
    en: "No number on this card: nothing to call.",
  },
  "fiche.demo-lien": {
    fr: "Le lien ouvre WhatsApp sur ton téléphone. Le carnet n'envoie rien, n'appelle personne.",
    en: "The link opens WhatsApp on your phone. The book sends nothing and calls nobody.",
  },

  // Journal
  "echange.titre": { fr: "Noter un échange", en: "Log an entry" },
  "echange.type": { fr: "Ce qui s'est passé", en: "What happened" },
  "echange.note": { fr: "Un mot", en: "A word" },
  "echange.montant": { fr: "Montant promis", en: "Amount quoted" },
  "echange.montant-aide": {
    fr: "Uniquement pour un devis ou une commande, en FCFA entiers.",
    en: "Only for a quote or an order, in whole FCFA.",
  },
  "echange.jour": { fr: "Le", en: "On" },
  "echange.enregistrer": { fr: "Écrire dans le journal", en: "Write it in the log" },
  "echange.par": { fr: "Noté par", en: "Logged by" },
  "echange.aide": {
    fr: "Un devis pose tout seul une reprise dans {n} jours.",
    en: "A quote places a follow-up on its own in {n} days.",
  },

  // Relances
  "relance.titre": { fr: "Les relances", en: "Reminders" },
  "relance.chapo": {
    fr: "Une relance a une raison. Sans raison, elle ne se fait pas.",
    en: "A reminder has a reason. Without one, it never gets done.",
  },
  "relance.motif": { fr: "Pourquoi rappeler", en: "Why to call" },
  "relance.motif-aide": {
    fr: "Ce que tu diras au téléphone, pas un mot du dictionnaire.",
    en: "What you will say on the phone, not a word from a dictionary.",
  },
  "relance.due": { fr: "Le jour dit", en: "Due on" },
  "relance.programmer": { fr: "Poser une relance", en: "Set a reminder" },
  "relance.terminer": { fr: "C'est fait", en: "Done" },
  "relance.reprogrammer": { fr: "Reprogrammer", en: "Move it" },
  "relance.faite": { fr: "Faite le", en: "Done on" },
  "relance.retard": { fr: "{n} jours de retard", en: "{n} days late" },
  "relance.retard1": { fr: "1 jour de retard", en: "1 day late" },
  "relance.due_le": { fr: "due aujourd'hui", en: "due today" },
  "relance.aucune": { fr: "Aucune relance en attente.", en: "No reminder waiting." },
  "relance.devis": {
    fr: "Reprise après un devis",
    en: "Follow-up after a quote",
  },
  "relance.par": { fr: "posée par", en: "set by" },
  "relance.dans": { fr: "dans {n} jours", en: "in {n} days" },
  "relance.seuil": { fr: "Le seuil de silence", en: "The silence window" },

  // Réglages
  "reglages.titre": { fr: "Les réglages du carnet", en: "Book settings" },
  "reglages.chapo": {
    fr: "La maison, le silence qui fâche, et qui tient le carnet. Rien ici n'efface une ligne du journal.",
    en: "The business, the silence that hurts, and who keeps the book. Nothing here erases a log line.",
  },
  "reglages.maison": { fr: "La maison", en: "The business" },
  "reglages.nom": { fr: "Nom de la maison", en: "Business name" },
  "reglages.ville": { fr: "Ville", en: "City" },
  "reglages.quartier": { fr: "Quartier", en: "Area" },
  "reglages.secteur": { fr: "Secteur", en: "Trade" },
  "reglages.secteur-aide": {
    fr: "Ce que vous vendez, en trois mots.",
    en: "What you sell, in three words.",
  },
  "reglages.telephone": { fr: "Numéro du comptoir", en: "Counter number" },
  "reglages.silence": { fr: "Jours sans nouvelles", en: "Days of silence" },
  "reglages.silence-aide": {
    fr: "Passé ce nombre, le client monte tout seul dans la liste des oubliés.",
    en: "Past this count, the customer rises on its own into the forgotten list.",
  },
  "reglages.rappel": { fr: "Jours avant la reprise", en: "Days before the follow-up" },
  "reglages.rappel-aide": {
    fr: "Le délai qui suit un devis. Sept jours est le chiffre du terrain.",
    en: "The delay after a quote. Seven days is the field number.",
  },
  "reglages.enregistrer": { fr: "Enregistrer", en: "Save" },
  "reglages.enCours": { fr: "Écriture", en: "Writing" },
  "reglages.ecrit": { fr: "Réglages écrits", en: "Settings saved" },
  "reglages.comptes": { fr: "Qui tient le carnet", en: "Who keeps the book" },
  "reglages.ajouterCompte": { fr: "Ajouter un compte", en: "Add an account" },
  "reglages.compte-nom": { fr: "Nom du compte", en: "Account name" },
  "reglages.compte-adresse": { fr: "Adresse", en: "Address" },
  "reglages.compte-mot": { fr: "Mot de passe", en: "Password" },
  "reglages.mot-aide": {
    fr: "{n} caractères au moins. Chacun garde son mot, on ne se prête pas une séance.",
    en: "At least {n} characters. Everyone keeps their own word; a session is not lent out.",
  },
  "reglages.role": { fr: "Rôle", en: "Role" },
  "reglages.aideComptes": {
    fr: "Chaque compte ouvre le même carnet. Le rôle décide des gestes, pas l'adresse.",
    en: "Every account opens the same book. The role decides the moves, not the address.",
  },
  "reglages.exports": { fr: "Le carnet en fichier", en: "The book as a file" },
  "reglages.exports-aide": {
    fr: "Trois feuilles CSV séparées par des points-virgules, montants entiers en FCFA. Un comptable d'à côté peut les ouvrir.",
    en: "Three CSV sheets, semicolon separated, whole FCFA amounts. An accountant next door can open them.",
  },
  "reglages.abonnement": { fr: "Abonnement", en: "Subscription" },
  "role.responsable": { fr: "Responsable", en: "Owner" },
  "role.vendeur": { fr: "Vendeur", en: "Salesperson" },

  // Communs
  "commun.enregistrer": { fr: "Enregistrer", en: "Save" },
  "commun.annuler": { fr: "Annuler", en: "Cancel" },
  "commun.fermer": { fr: "Fermer", en: "Close" },
  "commun.sortir": { fr: "Ranger le carnet", en: "Put the book away" },
  "commun.retour": { fr: "Retour", en: "Back" },
  "commun.recharger": { fr: "Recharger", en: "Reload" },
  "commun.demo": { fr: "Démo", en: "Demo" },
  "commun.dejaDemo": {
    fr: "Démo : aucun SMS, aucun appel, aucune somme ne quitte cette machine.",
    en: "Demo: no SMS, no call, no amount leaves this machine.",
  },
  "commun.ferme": { fr: "Carnet fermé", en: "Book closed" },
  "commun.horsLigne": {
    fr: "Le carnet ne répond pas. Vérifie que l'API est démarrée.",
    en: "The book is not answering. Check that the API is running.",
  },
  "commun.incident": { fr: "Le carnet est fermé", en: "The book is shut" },
  "commun.incident-aide": {
    fr: "Aucune écriture n'a été faite. Le carnet attend que l'API réponde.",
    en: "Nothing was written. The book is waiting for the API to answer.",
  },
  "commun.essayer": { fr: "Réessayer", en: "Try again" },
  "commun.page-perdue": { fr: "Cette page n'existe pas", en: "This page does not exist" },
  "commun.page-perdue-aide": {
    fr: "Cette fiche ou cette relance n'est pas dans ce carnet.",
    en: "That card or reminder is not in this book.",
  },
  "commun.chargement": { fr: "Le carnet s'ouvre", en: "Opening the book" },
  "commun.ecriture": { fr: "Écriture en cours", en: "Writing" },
  "commun.droitManquant": {
    fr: "Seul le responsable change la maison ou sort une fiche.",
    en: "Only the owner changes the business or takes a card out.",
  },
  "commun.date": { fr: "Date", en: "Date" },
  "commun.voir": { fr: "Voir", en: "View" },
  "commun.reseaux": { fr: "MTN, Orange, Nexttel", en: "MTN, Orange, Nexttel" },
  "commun.jours": { fr: "jours", en: "days" },
  "commun.mois": { fr: "mois", en: "month" },
  "contact.titre": { fr: "Écrire à l'entreprise", en: "Write to the company" },
  "contact.chapo": {
    fr: "Laisse ton nom et ton numéro : l'équipe te rappelle. Sans compte, sans installation.",
    en: "Leave your name and number: the team calls you back. No account, no install.",
  },
  "contact.nom": { fr: "Ton nom", en: "Your name" },
  "contact.telephone": { fr: "Ton numéro", en: "Your number" },
  "contact.quartier": { fr: "Ton quartier", en: "Your neighbourhood" },
  "contact.besoin": { fr: "Ce dont tu as besoin", en: "What you need" },
  "contact.envoyer": { fr: "Envoyer", en: "Send" },
  "contact.envoi": { fr: "Envoi…", en: "Sending…" },
  "contact.ok-titre": { fr: "Message envoyé !", en: "Message sent!" },
  "contact.ok-texte": {
    fr: "{entreprise} a bien reçu ton message et te rappelle très vite.",
    en: "{entreprise} received your message and will call you back soon.",
  },
  "contact.encore": { fr: "Écrire encore", en: "Write again" },
  "contact.vide": {
    fr: "Cette entreprise n'a pas encore ouvert sa page de contact.",
    en: "This company has not opened its contact page yet.",
  },
};

export function traduire(langue: string) {
  return creerTraducteur(DICTEE, langue);
}

/** La fonction des mots, telle qu'on la passe dans un composant. */
export type Trad = (cle: string, variables?: Record<string, string | number>) => string;
