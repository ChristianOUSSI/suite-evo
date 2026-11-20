/**
 * Les 22 produits de la suite, dans l'ordre du catalogue.
 * Le port est celui du front Next.js de chaque produit.
 */
export type Produit = {
  nom: string;
  port: number;
  fr: { titre: string; texte: string };
  en: { titre: string; texte: string };
};

export const PRODUITS: Produit[] = [
  { nom: "evo-tontine", port: 3500, fr: { titre: "Tontines & épargne", texte: "Les tours, les mises, les caisses : l'épargne de groupe tenue au comptoir." }, en: { titre: "Tontines & savings", texte: "Rounds, stakes, coffers: group savings kept at the counter." } },
  { nom: "evo-crm", port: 3600, fr: { titre: "Portefeuille clients", texte: "Chaque client, son historique, ses relances : le carnet qui vend." }, en: { titre: "Customer portfolio", texte: "Every customer, their history, their follow-ups: the notebook that sells." } },
  { nom: "evo-presence", port: 3700, fr: { titre: "Pointage des présences", texte: "Arrivées, départs, retards : le pointage universel, vérifiable par code." }, en: { titre: "Attendance tracking", texte: "Arrivals, departures, delays: universal check-in, verifiable by code." } },
  { nom: "evo-hotel", port: 3800, fr: { titre: "Réservation hôtelière", texte: "Chambres, séjours, clients : la réception tenue sans papier." }, en: { titre: "Hotel booking", texte: "Rooms, stays, guests: the front desk without paper." } },
  { nom: "evo-shop", port: 3900, fr: { titre: "Point de vente", texte: "Le panier tactile, le ticket, le stock qui descend : la caisse du quartier." }, en: { titre: "Point of sale", texte: "The touch cart, the receipt, the stock that drops: the neighbourhood till." } },
  { nom: "evo-school", port: 4000, fr: { titre: "Frais scolaires & reçus", texte: "Élèves, classes, versements : chaque paiement sort son reçu vérifiable." }, en: { titre: "School fees & receipts", texte: "Pupils, classes, payments: every payment issues a verifiable receipt." } },
  { nom: "evo-clinic", port: 4200, fr: { titre: "Dossiers patients", texte: "Patients, actes, paiements : le dossier qui soigne et le reçu qui rassure." }, en: { titre: "Patient records", texte: "Patients, acts, payments: the record that heals and the receipt that reassures." } },
  { nom: "evo-immo", port: 4300, fr: { titre: "Annonces immobilières", texte: "Biens, visites, demandes : l'agence qui montre sans se déplacer." }, en: { titre: "Real-estate listings", texte: "Properties, viewings, enquiries: the agency that shows without travelling." } },
  { nom: "evo-log", port: 4400, fr: { titre: "Logistique & colis", texte: "Envois, numéros de suivi, statuts : le colis que le client suit seul." }, en: { titre: "Logistics & parcels", texte: "Shipments, tracking numbers, statuses: the parcel the customer follows alone." } },
  { nom: "evo-market", port: 4500, fr: { titre: "Marketplace", texte: "Les annonces, les commandes, la vitrine publique : vendre sans boutique." }, en: { titre: "Marketplace", texte: "Listings, orders, the public showcase: selling without a shop." } },
  { nom: "evo-docs", port: 4600, fr: { titre: "Gestion documentaire", texte: "Le classeur de l'organisation : documents, catégories, partage par lien." }, en: { titre: "Document management", texte: "The organisation's filing cabinet: documents, categories, link sharing." } },
  { nom: "evo-call", port: 4700, fr: { titre: "Centre d'appels", texte: "Les files, les agents, les durées : le standard qui ne perd pas d'appel." }, en: { titre: "Call center", texte: "Queues, agents, durations: the switchboard that loses no call." } },
  { nom: "evo-auto", port: 4800, fr: { titre: "Vente automobile", texte: "Véhicules en vente, clients, ventes : le parc qui se vend." }, en: { titre: "Car sales", texte: "Vehicles for sale, customers, sales: the fleet that sells." } },
  { nom: "evo-import", port: 4900, fr: { titre: "Fret & import", texte: "Envois internationaux, suivi public : la marchandise qui traverse." }, en: { titre: "Freight & import", texte: "International shipments, public tracking: the goods that cross borders." } },
  { nom: "evo-bijou", port: 5000, fr: { titre: "Bijouterie", texte: "Pièces, poids, carats : le comptoir qui pèse et qui compte." }, en: { titre: "Jewelry", texte: "Pieces, weight, carats: the counter that weighs and counts." } },
  { nom: "evo-moto", port: 5100, fr: { titre: "Motos & atelier", texte: "Motos en vente et réparations : la concession et le garage réunis." }, en: { titre: "Motorbikes & workshop", texte: "Bikes for sale and repairs: the dealership and the garage together." } },
  { nom: "evo-cars", port: 5200, fr: { titre: "Voitures & pièces", texte: "Voitures en vente et pièces détachées : le stock qui roule." }, en: { titre: "Cars & parts", texte: "Cars for sale and spare parts: the stock that rolls." } },
  { nom: "evo-wear", port: 5300, fr: { titre: "Prêt-à-porter", texte: "Articles, tailles, couleurs : la boutique qui habille le quartier." }, en: { titre: "Ready-to-wear", texte: "Items, sizes, colours: the shop that dresses the neighbourhood." } },
  { nom: "evo-gaz", port: 5400, fr: { titre: "Distribution de GPL", texte: "Livraisons de bonbonnes, clients revendeurs : la distribution sans cahier." }, en: { titre: "LPG distribution", texte: "Cylinder deliveries, reseller customers: distribution without a notebook." } },
  { nom: "evo-carnet", port: 5500, fr: { titre: "Carnet numérique", texte: "Notes, catégories, épingles : le carnet de poche qui partage." }, en: { titre: "Digital notebook", texte: "Notes, categories, pins: the pocket notebook that shares." } },
  { nom: "evo-agent", port: 5600, fr: { titre: "Agent IA autonome", texte: "File de tâches, exécutions journalisées : l'agent que l'équipe suit seul." }, en: { titre: "Autonomous AI agent", texte: "Task queue, journalised runs: the agent the team follows alone." } },
  { nom: "evo-voice", port: 5700, fr: { titre: "Dictée & commande vocale", texte: "Transcription, intention, exécution locale : la voix sans réseau." }, en: { titre: "Dictation & voice commands", texte: "Transcription, intent, local execution: the voice without a network." } },
  { nom: "palabre", port: 3000, fr: { titre: "Recouvrement & relances", texte: "Factures, relances, paiements Mobile Money : le recouvrement tenu au comptoir." }, en: { titre: "Collections & reminders", texte: "Invoices, reminders, Mobile Money payments: collections kept at the counter." } },
  { nom: "ecole-cash", port: 3200, fr: { titre: "Caisse scolaire", texte: "Frais, versements, reçus : la caisse de l'école de quartier." }, en: { titre: "School till", texte: "Fees, payments, receipts: the neighbourhood school's till." } },
  { nom: "voice", port: 3100, fr: { titre: "Standard téléphonique", texte: "Appels, messages, rendez-vous : le standard des universités et cliniques." }, en: { titre: "Telephone switchboard", texte: "Calls, messages, appointments: the switchboard for universities and clinics." } },
  { nom: "kolo-boutique", port: 3400, fr: { titre: "Cahier de boutique", texte: "Écritures au vocal, stock, bénéfice du jour : le cahier de la boutique." }, en: { titre: "Shop ledger", texte: "Voice entries, stock, daily profit: the shop's ledger." } },
];
