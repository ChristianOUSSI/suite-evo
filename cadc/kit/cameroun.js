/**
 * Règles du Cameroun : monnaie, numéros, régions, rails de paiement.
 * Aucune dépendance, utilisable côté serveur comme côté navigateur.
 */

const ESPACE_FIN = "\u202f";

export const DEVISES = ["XAF"];

const MOIS = {
  fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

const JOURS = {
  fr: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

/** Villes et quartiers réellement utilisés, du plus petit comptoir au dépôt. */
export const VILLES = [
  { nom: "Douala", region: "Littoral", quartiers: ["Bonabéri", "Bonapriso", "Deido", "Makele", "Mboppi", "Ndogpassi", "New-Bell", "Ndokoti"] },
  { nom: "Yaoundé", region: "Centre", quartiers: ["Bastos", "Biekha", "Mendong", "Mvan", "Nsam", "Odza", "Tergnel", "Brieh"] },
  { nom: "Bafoussam", region: "Ouest", quartiers: ["Toudou", "Santchou", "Fongo"] },
  { nom: "Garoua", region: "Nord", quartiers: ["Bourranga", "Dingassi", "Paldaki"] },
  { nom: "Maroua", region: "Extrême-Nord", quartiers: ["Boulmiougou", "Midjivin", "Zeve"] },
  { nom: "Bamenda", region: "Nord-Ouest", quartiers: ["Nkwen", "Mile 3", "Cressington"] },
  { nom: "Buea", region: "Sud-Ouest", quartiers: ["Great Soppo", "Molyko", "Bomaka"] },
  { nom: "Limbé", region: "Sud-Ouest", quartiers: ["Bellebaton", "Deidre"] },
  { nom: "Kribi", region: "Sud", quartiers: ["Mbé", "Niambi"] },
  { nom: "Ebolowa", region: "Sud", quartiers: ["Nku", "Zombo"] },
  { nom: "Ngaoundéré", region: "Adamaoua", quartiers: ["Djohong", "Lamido"] },
];

/** Les rails réellement utilisables ici. Aucune carte bancaire n'est supposée. */
export const RAILS = [
  { cle: "especes", label: { fr: "Espèces", en: "Cash" }, aide: { fr: "la main à la main", en: "hand to hand" } },
  { cle: "momo_mtn", label: { fr: "MTN MoMo", en: "MTN MoMo" }, aide: { fr: "le réseau le plus répandu", en: "the widest network" } },
  { cle: "momo_orange", label: { fr: "Orange Money", en: "Orange Money" }, aide: { fr: "l'autre réseau", en: "the other network" } },
  { cle: "wirecard", label: { fr: "Wave", en: "Wave" }, aide: { fr: "gratuit entre utilisateurs", en: "free between users" } },
  { cle: "cheque", label: { fr: "Chèque", en: "Cheque" }, aide: { fr: "uniquement pour les grossistes", en: "wholesale only" } },
  { cle: "credit", label: { fr: "À crédit", en: "On credit" }, aide: { fr: "à réserver aux clients connus", en: "known customers only" } },
];

export function canoniseTelephone(brut) {
  if (!brut) return null;
  let chiffres = String(brut).replace(/\D/g, "");
  if (chiffres.startsWith("00")) chiffres = chiffres.slice(2);
  if (chiffres.startsWith("237") && chiffres.length > 9) chiffres = chiffres.slice(3);
  if (chiffres.startsWith("0") && chiffres.length === 10) chiffres = chiffres.slice(1);
  if (chiffres.length !== 9) return null;
  if (!/^[267]/.test(chiffres)) return null;
  return `+237${chiffres}`;
}

/** Le numéro tel qu'on le lit au téléphone : 6 99 30 77 24. */
export function afficheTelephone(brut) {
  const canonique = canoniseTelephone(brut);
  if (!canonique) return brut || "";
  const no = canonique.slice(4);
  return [no[0], no.slice(1, 3), no.slice(3, 5), no.slice(5, 7), no.slice(7, 9)].join(" ");
}

/**
 * L'opérateur d'un numéro, d'après la plage des trois premiers chiffres.
 * MTN : 650-654 et 670-679. Orange : 640-642, 655-659, 686-689, 690-699.
 * Nexttel : 660-669. Le 2 est fixe (Camtel). La portabilité rend la lecture
 * indicative : elle sert à rassurer, pas à facturer.
 */
export function operateur(brut) {
  const canonique = canoniseTelephone(brut);
  if (!canonique) return "inconnu";
  const no = canonique.slice(4);
  if (no[0] === "2") return "Camtel (fixe)";
  const tete = Number(no.slice(0, 3));
  if ((tete >= 650 && tete <= 654) || (tete >= 670 && tete <= 679)) return "MTN";
  if (
    (tete >= 640 && tete <= 642) ||
    (tete >= 655 && tete <= 659) ||
    (tete >= 686 && tete <= 689) ||
    (tete >= 690 && tete <= 699)
  ) {
    return "Orange";
  }
  if (tete >= 660 && tete <= 669) return "Nexttel";
  return "mobile";
}

/** Un montant de comptoir : milliers séparés, pas de décimales. */
export function fcfa(montant, langue = "fr") {
  const valeur = Math.round(Number(montant) || 0);
  const signe = valeur < 0 ? "-" : "";
  const groupes = Math.abs(valeur).toLocaleString(langue === "en" ? "en-US" : "fr-FR");
  return `${signe}${groupes}${ESPACE_FIN}FCFA`;
}

/** Version courte pour une tuile : 1,4 M ou 250 k. */
export function fcfaCourt(montant, langue = "fr") {
  const valeur = Math.round(Number(montant) || 0);
  const abs = Math.abs(valeur);
  const signe = valeur < 0 ? "-" : "";
  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000;
    const arrondi = millions.toLocaleString(langue === "en" ? "en-US" : "fr-FR", { maximumFractionDigits: millions < 10 ? 2 : 1 });
    return `${signe}${arrondi}${ESPACE_FIN}M`;
  }
  if (abs >= 1_000) return `${signe}${Math.round(abs / 1_000)}${ESPACE_FIN}k`;
  return `${signe}${abs}`;
}

export function dateLongue(valeur, langue = "fr") {
  const date = valeur instanceof Date ? valeur : new Date(`${String(valeur).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(valeur);
  if (langue === "en") return `${MOIS.en[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  return `${date.getDate()} ${MOIS.fr[date.getMonth()]} ${date.getFullYear()}`;
}

export function jourEtDate(valeur, langue = "fr") {
  const date = valeur instanceof Date ? valeur : new Date(`${String(valeur).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(valeur);
  return `${JOURS[langue][date.getDay()]}, ${dateLongue(date, langue)}`;
}

export function heureLocal(valeur, langue = "fr") {
  const date = valeur instanceof Date ? valeur : new Date(valeur);
  if (Number.isNaN(date.getTime())) return String(valeur);
  return new Intl.DateTimeFormat(langue === "en" ? "en-GB" : "fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Douala",
  }).format(date);
}

export function aujourdhui() {
  const maintenant = new Date();
  return [
    maintenant.getFullYear(),
    String(maintenant.getMonth() + 1).padStart(2, "0"),
    String(maintenant.getDate()).padStart(2, "0"),
  ].join("-");
}

export function dansJours(n) {
  const date = new Date();
  date.setDate(date.getDate() + n);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Le nombre de jours entre deux dates ISO, positif si la seconde est passée. */
export function joursEntre(debut, fin) {
  const a = new Date(`${String(debut).slice(0, 10)}T00:00:00`);
  const b = new Date(`${String(fin).slice(0, 10)}T00:00:00`);
  return Math.round((b - a) / 86_400_000);
}

export function pourcentage(valeur, langue = "fr") {
  return `${Math.round(Number(valeur) || 0)}${ESPACE_FIN}%`;
}

/** Une salutation qui se dit vraiment ici, selon l'heure de Douala. */
export function salutation(langue = "fr") {
  const heure = Number(
    new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", hour12: false, timeZone: "Africa/Douala" }).format(new Date()),
  );
  if (heure < 12) return langue === "en" ? "Good morning" : "Bonjour";
  if (heure < 18) return langue === "en" ? "Good afternoon" : "Bon après-midi";
  return langue === "en" ? "Good evening" : "Bonsoir";
}

export function initiales(nom) {
  return String(nom || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((morceau) => morceau[0].toUpperCase())
    .join("");
}
