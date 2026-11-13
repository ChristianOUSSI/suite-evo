import Link from "next/link";
import type { Metadata } from "next";
import { EnvoiManuel } from "@/components/envoi-manuel";
import { Tournee } from "@/components/tournee";
import { lire } from "@/lib/api";
import { heure } from "@/lib/format";
import { seance } from "@/lib/session";
import type { Envoi } from "@/lib/types";
import "../../../styles/envois.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Envois',
};

const ETATS = [
  { code: "", label: "Tout le journal" },
  { code: "envoye", label: "Partis" },
  { code: "programme", label: "En file" },
  { code: "echoue", label: "Refusés" },
];

const CANAUX = [
  { code: "", label: "Tous les canaux" },
  { code: "sms", label: "SMS" },
  { code: "whatsapp", label: "WhatsApp" },
  { code: "appel_vocal", label: "Appel vocal" },
];

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

function cheminPour(etat: string, canal: string): string {
  const URL = new URLSearchParams();
  if (etat) URL.set("statut", etat);
  if (canal) URL.set("canal", canal);
  const suite = URL.toString();
  return `/envois${suite ? `?${suite}` : ""}`;
}

export default async function Envois({ searchParams }: Props) {
  const parametres = await searchParams;
  const session = await seance();
  const etat = ETATS.some((item) => item.code === (parametres.etat ?? ""))
    ? (parametres.etat ?? "")
    : "";
  const canal = CANAUX.some((item) => item.code === (parametres.canal ?? ""))
    ? (parametres.canal ?? "")
    : "";

  const requete = new URLSearchParams();
  if (etat) requete.set("statut", etat);
  if (canal) requete.set("canal", canal);
  const journal = await lire<{
    dispatches: Envoi[];
    sent: number;
    queued: number;
    failed: number;
  }>(`/dispatches${requete.toString() ? `?${requete}` : ""}`);

  return (
    <>
      <header className="entete-page">
        <div>
          <h1>Envois</h1>
          <p className="note">
            Tout ce que la console a poussé vers un téléphone : les
            confirmations de place, les rappels de la veille, les accusés de
            message, et ce que vous écrivez ici.
          </p>
          <nav className="fenetres">
            {ETATS.map((item) => (
              <Link
                key={item.code || "tout"}
                href={cheminPour(item.code, canal)}
                className={(parametres.etat ?? "") === item.code ? "active" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <nav className="fenetres canaux">
            {CANAUX.map((item) => (
              <Link
                key={item.code || "tous"}
                href={cheminPour(etat, item.code)}
                className={(parametres.canal ?? "") === item.code ? "active" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="compteurs">
          <div className="compteur mousse">
            <b className="chiffre">{journal.sent}</b>
            <span>partis</span>
          </div>
          <div className="compteur ambre">
            <b className="chiffre">{journal.queued}</b>
            <span>en file</span>
          </div>
          <div className="compteur rouille">
            <b className="chiffre">{journal.failed}</b>
            <span>refusés</span>
          </div>
        </div>
      </header>

      <div className="panneaux enveloppe">
        <section className="panneau">
          <h2>Le journal</h2>
          <table className="tableau">
            <thead>
              <tr>
                <th scope="col">Référence</th>
                <th scope="col">Canal</th>
                <th scope="col">Destinataire</th>
                <th scope="col">Texte rendu</th>
                <th scope="col">État</th>
                <th scope="col" className="droite">
                  À l'instant
                </th>
              </tr>
            </thead>
            <tbody>
              {journal.dispatches.map((envoi) => (
                <tr key={envoi.id}>
                  <td className="mono">{envoi.reference}</td>
                  <td>{envoi.channel_label}</td>
                  <td className="mono">{envoi.to_phone_display}</td>
                  <td className="corps">
                    {envoi.subject && <div className="sujet">{envoi.subject}</div>}
                    {envoi.body}
                  </td>
                  <td>
                    <span className={pastilleEnvoi(envoi.status)}>
                      {libelleEnvoi(envoi.status)}
                    </span>
                  </td>
                  <td className="droite mono">
                    {envoi.ago}
                    <div className="detail">
                      {envoi.sent_at ? "parti" : "programmé"}{" "}
                      {heure(envoi.sent_at ?? envoi.planned_at)}
                    </div>
                  </td>
                </tr>
              ))}
              {journal.dispatches.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <p className="vide">
                      Rien dans cette fenêtre. Le journal se remplit dès qu'une
                      place est posée ou qu'un message arrive hors horaires.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="pager">
            Quatre-vingts lignes au plus, la plus récente en haut. En Démo, la
            référence commence par DEM : rien n'a quitté la machine.
          </p>
        </section>

        <div className="colonne">
          <EnvoiManuel organisation={session.organization} />
          <Tournee auto={session.organization.auto_reminders} />
        </div>
      </div>
    </>
  );
}

function pastilleEnvoi(statut: string): string {
  if (statut === "envoye") return "pastille mousse";
  if (statut === "programme") return "pastille ambre";
  return "pastille rouille";
}

function libelleEnvoi(statut: string): string {
  if (statut === "envoye") return "parti";
  if (statut === "programme") return "en file";
  return "refusé";
}
