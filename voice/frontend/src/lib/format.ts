export const RESULTATS = [
  { code: "renseigne", label: "Renseigné" },
  { code: "rendezvous", label: "Rendez-vous pris" },
  { code: "message", label: "Message laissé" },
  { code: "transfert", label: "Transféré" },
  { code: "raccroche", label: "Sans suite" },
  { code: "hors_horaires", label: "Hors horaires" },
];

export const ACTIONS_TOUCHE = [
  { code: "reponse", label: "Lire une fiche du répertoire" },
  { code: "rendezvous", label: "Proposer un rendez-vous au guichet" },
  { code: "message", label: "Prendre un message" },
  { code: "transfert", label: "Passer à un autre poste" },
];

export const URGENCES = [
  { code: "simple", label: "Simple" },
  { code: "note", label: "À noter" },
  { code: "urgent", label: "Urgent" },
];

export const JOURS = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
];

export function fcfa(montant: number): string {
  return `${montant.toLocaleString("fr-FR").replace(/\u202f/g, " ")} FCFA`;
}

export function heure(iso: string): string {
  const instant = new Date(iso);
  return `${String(instant.getHours()).padStart(2, "0")} h ${String(
    instant.getMinutes()
  ).padStart(2, "0")}`;
}

export function dateCourte(iso: string): string {
  const instant = new Date(iso);
  return instant.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export function instant(iso: string): string {
  const date = new Date(iso);
  const jour = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return `${jour} à ${heure(iso)}`;
}

const PARLEURS = [
  "voix",
  "voice",
  "téléphone",
  "phone",
  "poste",
  "sms",
  "whatsapp",
  "bip",
];

export function etiquetteDictee(ligne: string): {
  qui: string;
  texte: string;
} {
  const deuxPoints = ligne.indexOf(":");
  if (deuxPoints < 0) {
    return { qui: "bip", texte: ligne };
  }
  const qui = ligne.slice(0, deuxPoints).trim().toLowerCase();
  if (!PARLEURS.includes(qui)) {
    return { qui: "voix", texte: ligne };
  }
  return { qui, texte: ligne.slice(deuxPoints + 1).trim() };
}

export function couleurResultat(code: string): string {
  if (code === "rendezvous") return "mousse";
  if (code === "message") return "ambre";
  if (code === "hors_horaires" || code === "raccroche") return "rouille";
  return "nuit";
}
