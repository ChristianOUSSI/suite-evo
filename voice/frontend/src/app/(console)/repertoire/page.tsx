import type { Metadata } from "next";
import { Classeur } from "@/components/classeur";
import { FiltresRepertoire } from "@/components/filtres-repertoire";
import { lire } from "@/lib/api";
import { seance } from "@/lib/session";
import type { Fiche, Ligne, Trous } from "@/lib/types";
import "../../../styles/repertoire.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Répertoire parlé',
};

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function Repertoire({ searchParams }: Props) {
  const parametres = await searchParams;
  await seance();

  const requete = new URLSearchParams();
  if (parametres.domaine) requete.set("domaine", parametres.domaine);
  if (parametres.motif) requete.set("q", parametres.motif);
  const chemin = `/answers${requete.toString() ? `?${requete}` : ""}`;

  const JOURS_TROUS = 45;

  const [fonds, complet, lignes, trous] = await Promise.all([
    lire<{ answers: Fiche[] }>(chemin),
    lire<{ areas: string[] }>("/answers"),
    lire<Ligne[]>("/lines"),
    lire<Trous>(`/answers/trous?jours=${JOURS_TROUS}`),
  ]);
  const aires = complet.areas;

  const dites = fonds.answers.reduce((total, fiche) => total + fiche.hits, 0);
  const souffle = fonds.answers.length
    ? Math.round(
        fonds.answers.reduce((total, f) => total + f.seconde, 0) /
          fonds.answers.length
      )
    : 0;

  return (
    <>
      <header className="entete-page">
        <div>
          <h1>Répertoire parlé</h1>
          <p className="note">
            Ce que la voix connaît. Une fiche, c'est une affirmation, les mots
            qui doivent la faire sortir, et le texte exact lu au téléphone.
          </p>
        </div>
        <div className="compteurs">
          <div className="compteur">
            <b className="chiffre">{fonds.answers.length}</b>
            <span>fiches</span>
          </div>
          <div className="compteur ambre">
            <b className="chiffre">{dites}</b>
            <span>lectures en tout</span>
          </div>
          <div className="compteur">
            <b className="chiffre">{souffle}</b>
            <span>secondes en moyenne</span>
          </div>
          <div className="compteur rouille">
            <b className="chiffre">{trous.to_fill}</b>
            <span>questions sans fiche</span>
          </div>
        </div>
      </header>

      <FiltresRepertoire
        aires={aires}
        domaine={parametres.domaine ?? ""}
        motif={parametres.motif ?? ""}
      />

      <Classeur
        fiches={fonds.answers}
        aires={aires}
        jours={trous.since_days}
        trous={trous.holes}
        postes={lignes.map((ligne) => ({ id: ligne.id, label: ligne.label }))}
      />
    </>
  );
}
