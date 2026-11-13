import { creerTraducteur, type Dictionnaire } from "@cadc/kit/i18n";

/**
 * Tous les mots de l'écran, dans les deux langues, au même endroit.
 *
 * Le backend rend des nombres et des clés stables ; c'ici que le français
 * devient de l'anglais. Les phrases restent courtes : elles se lisent sur un
 * téléphone tenu à bout de bras au marché.
 */
export const DICTEE: Dictionnaire = {
  // Marque et navigation
  "marque.slogan": { fr: "le cercle qui cotise", en: "the circle that contributes" },
  "nav.cercle": { fr: "Le cercle", en: "The circle" },
  "nav.tours": { fr: "Les tours", en: "Rounds" },
  "nav.membres": { fr: "Les membres", en: "Members" },
  "nav.reglages": { fr: "Les réglages", en: "Settings" },
  "nav.verifier": { fr: "Vérifier un reçu", en: "Check a receipt" },
  "aller.contenu": { fr: "Aller au contenu", en: "Skip to content" },
  "meta.titre": {
    fr: "evo-tontine | le cercle qui cotise",
    en: "evo-tontine | the circle that contributes",
  },
  "meta.description": {
    fr: "Un njangi tenu sur un téléphone : le pot est tracé, l'ordre est tiré devant tout le monde, chacun repart avec son reçu.",
    en: "A rotating savings circle kept on a phone: the pool is tracked, the order is drawn in public, everyone leaves with a receipt.",
  },
  "langue.label": { fr: "Langue", en: "Language" },
  "texte.label": { fr: "Taille du texte", en: "Text size" },
  "texte.normal": { fr: "A", en: "A" },
  "texte.grand": { fr: "A", en: "A" },
  "texte.tres-grand": { fr: "A", en: "A" },

  // Entrée
  "entree.titre": {
    fr: "Le pot est tracé. L'ordre est tiré. Chacun repart avec son reçu.",
    en: "The pool is tracked. The order is drawn. Everyone leaves with a receipt.",
  },
  "entree.chapo": {
    fr: "evo-tontine tient le njangi d'un quartier de Douala : qui a cotisé, qui reçoit ce mois-ci, et le code à montrer à celui qui doute.",
    en: "evo-tontine keeps a neighbourhood circle in Douala: who paid, who receives this month, and the code to show anyone who doubts.",
  },
  "entree.ouvrir": { fr: "Ouvrir le cercle", en: "Open the circle" },
  "entree.prix": { fr: "1 % par tour, plafonné", en: "1% per round, capped" },
  "entree.demo": {
    fr: "Démo : un cercle inventé, des noms fictifs, aucun envoi SMS, aucun débit MoMo.",
    en: "Demo: an invented circle, fake names, no SMS sent, no MoMo debit.",
  },
  "geste.titre": { fr: "Quatre gestes du trésorier", en: "Four moves for the treasurer" },
  "geste.1.titre": { fr: "Ouvrir le tour", en: "Open the round" },
  "geste.1.texte": {
    fr: "Chaque membre actif reçoit sa part due, calculée sur sa part (deux têtes comptent double).",
    en: "Every active member gets a due share, counted on their parts (two heads count double).",
  },
  "geste.2.titre": { fr: "Tirer au sort", en: "Draw the order" },
  "geste.2.texte": {
    fr: "La graine est publique : le nom qui sort se recalculer avec un téléphone, devant tout le monde.",
    en: "The seed is public: the winning name can be recomputed on any phone, in front of everyone.",
  },
  "geste.3.titre": { fr: "Encaisser les parts", en: "Collect the shares" },
  "geste.3.texte": {
    fr: "Espèces, MTN MoMo ou Orange Money. Un retard écrit une pénalité, une seule fois.",
    en: "Cash, MTN MoMo or Orange Money. A late payment writes one penalty, once.",
  },
  "geste.4.titre": { fr: "Remettre le pot", en: "Hand over the pool" },
  "geste.4.texte": {
    fr: "Devant deux témoins, un reçu avec un code de dix lettres que le membre vérifie seul.",
    en: "Before two witnesses, with a ten-character code the member can check alone.",
  },

  // Séance
  "seance.titre": { fr: "Le cercle ouvre pour douze heures", en: "The circle opens for twelve hours" },
  "seance.chapo": {
    fr: "Une adresse et un mot de passe. Rien d'autre à installer sur le téléphone.",
    en: "One address and one password. Nothing else to install on the phone.",
  },
  "seance.adresse": { fr: "Adresse du cercle", en: "Circle address" },
  "seance.mot": { fr: "Mot de passe", en: "Password" },
  "seance.ouvrir": { fr: "Ouvrir le cercle", en: "Open the circle" },
  "seance.ouverture": { fr: "Ouverture", en: "Opening" },
  "seance.comptes": { fr: "Deux comptes de démonstration", en: "Two demo accounts" },
  "seance.aide": {
    fr: "Un clic remplit les deux champs. La séance tient dans un cookie que le téléphone ne lit pas.",
    en: "One click fills both fields. The session lives in a cookie the phone cannot read.",
  },

  // Cercle / état
  "cercle.titre": { fr: "Le tour en cours", en: "The current round" },
  "cercle.chapo": {
    fr: "Ce qui est dû, ce qui est rentré, qui reçoit, et ce qui reste à attendre.",
    en: "What is due, what came in, who receives, and what is still owed.",
  },
  "cercle.membres": { fr: "Membres actifs", en: "Active members" },
  "cercle.parts": { fr: "Parts au total", en: "Total shares" },
  "cercle.pot": { fr: "Pot du tour", en: "Round pool" },
  "cercle.attendu": { fr: "Attendu", en: "Expected" },
  "cercle.rentré": { fr: "Rentré", en: "Collected" },
  "cercle.restant": { fr: "Restant", en: "Outstanding" },
  "cercle.retalards": { fr: "En retard", en: "Late" },
  "cercle.penalites": { fr: "Pénalités écrites", en: "Penalties written" },
  "cercle.remis": { fr: "Déjà remis", en: "Already handed over" },
  "cercle.prochain": { fr: "Prochain tour", en: "Next round" },
  "cercle.mot": { fr: "Le mot du cercle", en: "The circle's word" },
  "cercle.rythme": { fr: "Rythme", en: "Frequency" },
  "cercle.jour": { fr: "Tous les", en: "Every" },
  "cercle.cotisation": { fr: "Cotisation", en: "Contribution" },

  // Rythmes et statuts
  "rythme.hebdo": { fr: "Chaque semaine", en: "Every week" },
  "rythme.quinzaine": { fr: "Toutes les deux semaines", en: "Every two weeks" },
  "rythme.mensuel": { fr: "Chaque mois", en: "Every month" },
  "statut.a_venir": { fr: "À venir", en: "Upcoming" },
  "statut.en_cours": { fr: "En cours", en: "Open" },
  "statut.tire": { fr: "Tiré", en: "Drawn" },
  "statut.remis": { fr: "Remis", en: "Handed over" },
  "rail.especes": { fr: "Espèces", en: "Cash" },
  "rail.momo_mtn": { fr: "MTN MoMo", en: "MTN MoMo" },
  "rail.momo_orange": { fr: "Orange Money", en: "Orange Money" },
  "role.responsable": { fr: "Responsable", en: "Leader" },
  "role.tresorier": { fr: "Trésorière", en: "Treasurer" },
  "role.membre": { fr: "Membre", en: "Member" },

  // Tours
  "tours.titre": { fr: "Les tours du cercle", en: "Rounds of the circle" },
  "tours.chapo": {
    fr: "Un tour par mois, un gagnant par tour, un pot qui ne se discute pas.",
    en: "One round a month, one winner a round, a pool nobody argues with.",
  },
  "tours.vide": { fr: "Aucun tour pour l'instant.", en: "No rounds yet." },
  "tours.ouvrir": { fr: "Ouvrir un tour", en: "Open a round" },
  "tour.numero": { fr: "Tour", en: "Round" },
  "tour.date": { fr: "Date dite", en: "Due date" },
  "tour.gagnant": { fr: "Reçoit ce tour", en: "Receives this round" },
  "tour.personne": { fr: "Pas encore tiré", en: "Not drawn yet" },
  "tour.tirer": { fr: "Tirer au sort", en: "Draw the order" },
  "tour.tirage": { fr: "Tirage", en: "Draw" },
  "tour.note": { fr: "Un mot pour le cahier", en: "A word for the book" },
  "tour.graine": { fr: "Graine publique", en: "Public seed" },
  "tour.verif": { fr: "Le calcul refait", en: "The check, redone" },
  "tour.index": { fr: "Rang dans la liste triée", en: "Index in the sorted list" },
  "tour.algorithme": { fr: "Comment revérifier", en: "How to re-check" },
  "tour.algorithme-texte": {
    fr: "sha256 de la graine, lu comme un entier, coupé modulo le nombre de membres actifs triés par nom. Un camarade avec un téléphone refait le calcul en une minute.",
    en: "sha256 of the seed, read as one whole number, cut modulo the count of active members sorted by name. A friend with a phone can redo it in a minute.",
  },
  "tour.remettre": { fr: "Remettre le pot", en: "Hand over the pool" },
  "tour.temoin": { fr: "Témoin de la remise", en: "Witness of the handover" },
  "tour.recu": { fr: "Reçu de remise", en: "Handover receipt" },
  "tour.jeton": { fr: "Code à montrer", en: "Code to show" },
  "tour.complet": { fr: "Pot complet", en: "Pool complete" },
  "tour.manquantes": { fr: "parts encore dues", en: "shares still due" },
  "tour.tire_le": { fr: "Tiré le", en: "Drawn on" },
  "tour.en_attente": {
    fr: "Le tour est ouvert. Le nom sort quand tu appuies, devant le cercle.",
    en: "The round is open. The name comes out when you press, in front of the circle.",
  },
  "tour.tirer-aide": {
    fr: "La graine est publique : le nom du cercle, le numéro du tour, sa date. Rien de caché.",
    en: "The seed is public: the circle name, the round number, its date. Nothing hidden.",
  },
  "tour.preuve": { fr: "Le calcul refait aujourd'hui", en: "The check, redone today" },
  "tour.concorde": {
    fr: "Le rang désigne bien le même nom.",
    en: "The index points to the same name.",
  },
  "tour.ecart": {
    fr: "La liste a bougé depuis le tirage : le rang {index} désigne aujourd'hui {nom}.",
    en: "The list moved since the draw: index {index} now points to {nom}.",
  },
  "tour.liste": {
    fr: "sur {n} noms triés alphabétiquement",
    en: "over {n} names sorted alphabetically",
  },
  "tour.tous": { fr: "Tout le monde a cotisé.", en: "Everyone has contributed." },
  "tour.attendre": {
    fr: "Il manque {n} parts avant de remettre le pot.",
    en: "{n} shares are missing before the pool can be handed over.",
  },
  "tour.attendre1": {
    fr: "Il manque {n} part avant de remettre le pot.",
    en: "{n} share is missing before the pool can be handed over.",
  },
  "tour.remettre-aide": {
    fr: "La remise s'écrit devant un témoin. Le code qui sort se vérifie sans compte.",
    en: "The handover is written before a witness. The code it gives can be checked without an account.",
  },
  "tour.mode": { fr: "Remis en", en: "Handed over by" },
  "tour.jeton-aide": {
    fr: "Recopie ce code au bas du papier remis au membre.",
    en: "Copy this code at the bottom of the paper given to the member.",
  },
  "remise.sur": { fr: "Remis le", en: "Handed over on" },
  "remise.heure": { fr: "à", en: "at" },
  "remise.temoin": { fr: "Témoin", en: "Witness" },
  "remise.voir": { fr: "Voir le reçu", en: "See the receipt" },

  // Membres et cotisations
  "membres.titre": { fr: "Les membres du cercle", en: "Members of the circle" },
  "membres.chapo": {
    fr: "Une ligne par personne. Celui qui a deux têtes à nourrir cotise deux parts.",
    en: "One line per person. Whoever feeds two heads pays two shares.",
  },
  "membres.ajouter": { fr: "Ajouter un membre", en: "Add a member" },
  "membres.nom": { fr: "Nom", en: "Name" },
  "membres.telephone": { fr: "Numéro", en: "Phone" },
  "membres.part": { fr: "Parts", en: "Shares" },
  "membres.du": { fr: "Dû", en: "Due" },
  "membres.paye": { fr: "Payé", en: "Paid" },
  "membres.reste": { fr: "Reste", en: "Left" },
  "membres.retard": { fr: "en retard", en: "late" },
  "membres.actif": { fr: "Dans le cercle", en: "In the circle" },
  "membres.sorti": { fr: "Sorti", en: "Out" },
  "membres.payer": { fr: "Enregistrer la part", en: "Record the share" },
  "membres.payerTous": { fr: "Tout est rentré", en: "Everything is in" },
  "membres.entree": { fr: "Entré le", en: "Joined on" },
  "membres.operateur": { fr: "Réseau", en: "Network" },
  "membres.nouveau": { fr: "Nouveau membre", en: "New member" },
  "membres.vide": { fr: "Le cercle est vide : personne ne cotise encore.", en: "The circle is empty: nobody contributes yet." },
  "membres.part-aide": {
    fr: "Un membre avec deux têtes à nourrir cotise deux parts.",
    en: "A member feeding two heads contributes two shares.",
  },
  "membres.telephone-aide": {
    fr: "Neuf chiffres après +237. Le réseau se reconnaît tout seul.",
    en: "Nine digits after +237. The network is recognised on its own.",
  },
  "membres.sortir": { fr: "Faire sortir", en: "Take out" },
  "membres.reprendre": { fr: "Faire revenir", en: "Bring back" },
  "membres.sortir-aide": {
    fr: "Un membre sorti ne cotise plus au tour suivant. Ce qui est déjà écrit ne bouge pas.",
    en: "A member who leaves stops contributing at the next round. What is already written does not move.",
  },
  "membres.reference": { fr: "Référence", en: "Reference" },
  "membres.sansNumero": { fr: "Sans numéro", en: "No number" },
  "membres.horsTour": {
    fr: "Hors du tour en cours : rien à encaisser pour l'instant.",
    en: "Outside the current round: nothing to collect yet.",
  },
  "membres.payee_le": { fr: "Part entrée le", en: "Share in on" },
  "membres.mode": { fr: "Par", en: "Through" },

  // Réglages
  "reglages.titre": { fr: "Les réglages du cercle", en: "Circle settings" },
  "reglages.chapo": {
    fr: "Le rythme, la cotisation, la pénalité et les rails. Rien ici ne réécrit un tour déjà clos.",
    en: "Frequency, contribution, penalty and rails. Nothing here rewrites a closed round.",
  },
  "reglages.enregistrer": { fr: "Enregistrer", en: "Save" },
  "reglages.enCours": { fr: "Écriture", en: "Writing" },
  "reglages.annuler": { fr: "Revenir à la version tenue", en: "Back to the saved version" },
  "reglages.comptes": { fr: "Qui tient le cahier", en: "Who keeps the book" },
  "reglages.ajouterCompte": { fr: "Ajouter un compte", en: "Add an account" },
  "reglages.rails": { fr: "Rails ouverts", en: "Open rails" },
  "reglages.aideRails": {
    fr: "Un rail fermé ne se propose plus à l'encaissement. Les parts déjà rentrées ne bougent pas.",
    en: "A closed rail stops being offered. Shares already collected do not move.",
  },
  "reglages.groupe": { fr: "Le cercle", en: "The circle" },
  "reglages.nom": { fr: "Nom du cercle", en: "Circle name" },
  "reglages.ville": { fr: "Ville", en: "City" },
  "reglages.quartier": { fr: "Quartier", en: "Neighbourhood" },
  "reglages.telephone": { fr: "Numéro du responsable", en: "Leader's number" },
  "reglages.cotisation": { fr: "Cotisation par part", en: "Contribution per share" },
  "reglages.penalite": { fr: "Pénalité de retard", en: "Late penalty" },
  "reglages.penalite-aide": {
    fr: "Écrite une seule fois, le jour où la part rentre après la date du tour.",
    en: "Written once, on the day the share comes in after the round date.",
  },
  "reglages.ecrit": { fr: "Réglages écrits", en: "Settings saved" },
  "reglages.mot-aide": {
    fr: "{n} caractères au moins. Chacun garde son mot, on ne se prête pas une séance.",
    en: "At least {n} characters. Everyone keeps their own word; a session is not lent out.",
  },
  "reglages.jour": { fr: "Jour du mois", en: "Day of the month" },
  "reglages.jour-aide": {
    fr: "Entre 1 et 28, pour que le jour existe tous les mois.",
    en: "Between 1 and 28, so the day exists in every month.",
  },
  "reglages.montant-aide": { fr: "En francs CFA, entier.", en: "In FCFA, whole number." },
  "reglages.role": { fr: "Rôle", en: "Role" },
  "reglages.compte-nom": { fr: "Nom du compte", en: "Account name" },
  "reglages.compte-adresse": { fr: "Adresse", en: "Address" },
  "reglages.compte-mot": { fr: "Mot de passe", en: "Password" },
  "reglages.aideComptes": {
    fr: "Chaque compte ouvre le même cahier. Le rôle décide des gestes, pas l'adresse.",
    en: "Every account opens the same book. The role decides the moves, not the address.",
  },
  "reglages.tourne": { fr: "Le cercle tourne", en: "The circle is running" },
  "reglages.exports": { fr: "Le cahier en fichier", en: "The book as a file" },
  "reglages.exports-aide": {
    fr: "Trois fichiers CSV, séparés par des virgules, montants entiers en FCFA. Un comptable d'à côté peut les ouvrir.",
    en: "Three CSV files, comma separated, whole FCFA amounts. An accountant next door can open them.",
  },

  // Public
  "verif.titre": { fr: "Vérifier un reçu de remise", en: "Check a handover receipt" },
  "verif.chapo": {
    fr: "Le code est au bas du reçu, en dix lettres. Personne d'autre ne voit le reste du cercle.",
    en: "The code is at the bottom of the receipt, ten letters. Nobody else sees the rest of the circle.",
  },
  "verif.demander": { fr: "Vérifier ce code", en: "Check this code" },
  "verif.code": { fr: "Code du reçu", en: "Receipt code" },
  "verif.code-aide": {
    fr: "Dix lettres et chiffres, sans espaces. Il est au bas du papier.",
    en: "Ten letters and digits, no spaces. It sits at the bottom of the paper.",
  },
  "verif.forme": {
    fr: "Le code compte dix signes, ni plus ni moins. Recopie-le tel quel.",
    en: "The code is ten signs, no more, no less. Copy it exactly as written.",
  },
  "verif.introuvable": {
    fr: "Ce code ne correspond à aucune remise.",
    en: "That code matches no handover.",
  },
  "verif.introuvable-aide": {
    fr: "Le code n'utilise ni O, ni 0, ni I, ni 1 : s'il y en a un, recopie le code tel quel depuis le papier.",
    en: "The code never uses O, 0, I or 1: if one appears, copy the code again straight from the paper.",
  },
  "verif.valide": { fr: "Remise confirmée", en: "Handover confirmed" },
  "verif.autre": { fr: "Vérifier un autre code", en: "Check another code" },
  "verif.imprimer": { fr: "Imprimer le reçu", en: "Print the receipt" },
  "verif.par": { fr: "Cercle tenu par", en: "Circle kept by" },
  "verif.hors": {
    fr: "Seule cette remise se lit ici : pas les autres noms, pas les autres pots, pas un numéro de téléphone.",
    en: "Only this handover reads here: not the other names, not the other pools, not a phone number.",
  },

  // Communs
  "commun.enregistrer": { fr: "Enregistrer", en: "Save" },
  "commun.annuler": { fr: "Annuler", en: "Cancel" },
  "commun.fermer": { fr: "Fermer", en: "Close" },
  "commun.sortir": { fr: "Ranger le cahier", en: "Put the book away" },
  "commun.retour": { fr: "Retour", en: "Back" },
  "commun.recharger": { fr: "Recharger", en: "Reload" },
  "commun.date": { fr: "Date du paiement", en: "Payment date" },
  "commun.demo": { fr: "Démo", en: "Demo" },
  "commun.dejaDemo": {
    fr: "Démo : aucun SMS, aucun débit MoMo, aucun argent ne quitte cette machine.",
    en: "Demo: no SMS, no MoMo debit, no money leaves this machine.",
  },
  "commun.ferme": { fr: "Cercle fermé", en: "Circle closed" },
  "commun.horsLigne": {
    fr: "Le cercle ne répond pas. Vérifie que l'API est démarrée.",
    en: "The circle is not answering. Check that the API is running.",
  },
  "commun.chargement": { fr: "Le cercle s'ouvre", en: "Opening the circle" },
  "commun.droitManquant": {
    fr: "Seul le responsable ou la trésorière fait ce geste.",
    en: "Only the leader or the treasurer can do this.",
  },
  "commun.incident": { fr: "Le cahier est fermé", en: "The book is shut" },
  "commun.incident-aide": {
    fr: "Aucune écriture n'a été faite. Le cercle attend que l'API réponde.",
    en: "Nothing was written. The circle is waiting for the API to answer.",
  },
  "commun.essayer": { fr: "Réessayer", en: "Try again" },
  "commun.page-perdue": { fr: "Cette page n'existe pas", en: "This page does not exist" },
  "commun.page-perdue-aide": {
    fr: "Le code ou le tour demandé n'est pas dans ce cercle.",
    en: "That code or round is not in this circle.",
  },
  "commun.ecriture": { fr: "Écriture en cours", en: "Writing" },
  "commun.oui": { fr: "Ouvert", en: "Open" },
  "commun.non": { fr: "Fermé", en: "Closed" },
  "commun.voir": { fr: "Voir", en: "View" },
  "commun.reseaux": { fr: "MTN, Orange, Nexttel", en: "MTN, Orange, Nexttel" },
};

/** La fonction des mots, telle qu'on la passe dans un composant. */
export type Trad = (cle: string, variables?: Record<string, string | number>) => string;

export function traduire(langue: string) {
  return creerTraducteur(DICTEE, langue);
}
