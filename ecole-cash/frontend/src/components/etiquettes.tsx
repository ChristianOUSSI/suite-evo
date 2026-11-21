import { t, LANGUE_DEFAUT, type Langue } from "@/lib/langue";
import type { StatutEcheance, StatutRecu } from "@/lib/types";

const ECHEANCE: Record<StatutEcheance, { cle: string; classe: string }> = {
  solde: { cle: "etq.solde", classe: "tag--paid" },
  a_venir: { cle: "etq.a_venir", classe: "tag--quiet" },
  aujourdhui: { cle: "etq.aujourdhui", classe: "tag--wait" },
  retard: { cle: "etq.retard", classe: "tag--late" },
};

const RECU: Record<string, { cle: string; classe: string }> = {
  envoye: { cle: "etq.envoye", classe: "tag--paid" },
  file: { cle: "etq.file", classe: "tag--wait" },
  "coupé": { cle: "etq.coupe", classe: "tag--cut" },
  annule: { cle: "etq.annule", classe: "tag--quiet" },
};

export function EtiquetteEcheance({
  statut,
  langue = LANGUE_DEFAUT,
}: {
  statut: StatutEcheance;
  langue?: Langue;
}) {
  const info = ECHEANCE[statut];
  if (!info) {
    return <span className="tag tag--quiet">{statut}</span>;
  }
  return <span className={`tag ${info.classe}`}>{t(info.cle, langue)}</span>;
}

export function EtiquetteRecu({
  statut,
  langue = LANGUE_DEFAUT,
}: {
  statut: StatutRecu | string;
  langue?: Langue;
}) {
  const info = RECU[statut];
  if (!info) {
    return <span className="tag tag--quiet">{statut}</span>;
  }
  return <span className={`tag ${info.classe}`}>{t(info.cle, langue)}</span>;
}
