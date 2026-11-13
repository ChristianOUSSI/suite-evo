import type { StatutEcheance, StatutRecu } from "@/lib/types";

const ECHEANCE: Record<StatutEcheance, { texte: string; classe: string }> = {
  solde: { texte: "réglée", classe: "tag--paid" },
  a_venir: { texte: "à venir", classe: "tag--quiet" },
  aujourdhui: { texte: "attendue aujourd'hui", classe: "tag--wait" },
  retard: { texte: "en retard", classe: "tag--late" },
};

const RECU: Record<string, { texte: string; classe: string }> = {
  envoye: { texte: "remis au parent", classe: "tag--paid" },
  file: { texte: "en file", classe: "tag--wait" },
  "coupé": { texte: "canal coupé", classe: "tag--cut" },
  annule: { texte: "annulé", classe: "tag--quiet" },
};

export function EtiquetteEcheance({ statut }: { statut: StatutEcheance }) {
  const info = ECHEANCE[statut] ?? { texte: statut, classe: "tag--quiet" };
  return <span className={`tag ${info.classe}`}>{info.texte}</span>;
}

export function EtiquetteRecu({ statut }: { statut: StatutRecu | string }) {
  const info = RECU[statut] ?? { texte: statut, classe: "tag--quiet" };
  return <span className={`tag ${info.classe}`}>{info.texte}</span>;
}
