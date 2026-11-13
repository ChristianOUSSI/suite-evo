import type { Metadata } from "next";
import { Fermetures } from "@/components/fermetures";
import { Horaires } from "@/components/horaires";
import { Postes } from "@/components/postes";
import { Touches } from "@/components/touches";
import { lire } from "@/lib/api";
import { heure } from "@/lib/format";
import { seance } from "@/lib/session";
import type {
  Fermeture,
  Fiche,
  Guichet,
  Ligne,
  Ouverture,
  Touche,
} from "@/lib/types";
import "../../../styles/standard.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Postes et touches',
};

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function Standard({ searchParams }: Props) {
  const parametres = await searchParams;
  await seance();

  const lignes = await lire<Ligne[]>("/lines");
  const demande = Number(parametres.poste ?? 0);
  const choisie =
    lignes.find((ligne) => ligne.id === demande) ?? lignes[0] ?? null;

  if (!choisie) {
    return (
      <header className="entete-page">
        <div>
          <h1>Postes et touches</h1>
          <p className="note">
            Aucun poste dans la console. Un standard sans ligne décrochée ne
            teste rien : reprenez l'installation.
          </p>
        </div>
      </header>
    );
  }

  const [detail, menu, fermetures, fonds, guichets] = await Promise.all([
    lire<Ligne>(`/lines/${choisie.id}`),
    lire<{ menu: Touche[]; dictation: string; open_now: Ouverture }>(
      `/lines/${choisie.id}/menu`
    ),
    lire<Fermeture[]>("/closures"),
    lire<{ answers: Fiche[] }>("/answers"),
    lire<Guichet[]>("/services"),
  ]);

  const reprise = menu.open_now.next_open;

  return (
    <>
      <header className="entete-page">
        <div>
          <h1>Postes et touches</h1>
          <p className="note">{menu.dictation}</p>
          <p className={menu.open_now.open ? "poste-ouvert" : "poste-ferme"}>
            {menu.open_now.open
              ? `« ${choisie.label} » décroche maintenant, ${choisie.number_display}.`
              : `« ${choisie.label} » ne décroche pas à cette heure${
                  reprise ? `, reprise ${heure(reprise)}` : ""
                }.`}
          </p>
        </div>
        <div className="compteurs">
          <div className="compteur">
            <b className="chiffre">{lignes.length}</b>
            <span>postes</span>
          </div>
          <div className="compteur ambre">
            <b className="chiffre">{detail.menu?.length ?? 0}</b>
            <span>touches sur ce poste</span>
          </div>
          <div className="compteur rouille">
            <b className="chiffre">{fermetures.length}</b>
            <span>jours fermés</span>
          </div>
        </div>
      </header>

      <div className="panneaux">
        <div className="colonne">
          <Touches
            ligne={detail}
            fiches={fonds.answers}
            guichets={guichets}
            postes={lignes}
          />
          <Horaires ligne={detail} />
        </div>

        <div className="colonne">
          <Postes lignes={lignes} active={detail.id} detail={detail} />
          <Fermetures fermetures={fermetures} />
        </div>
      </div>
    </>
  );
}
