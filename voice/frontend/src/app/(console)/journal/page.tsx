import Link from "next/link";
import type { Metadata } from "next";
import { FiltresJournal } from "@/components/filtres-journal";
import { lire } from "@/lib/api";
import { seance } from "@/lib/session";
import type { Journal, Ligne } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Journal d'appels",
};

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

function pastille(code: string): string {
  if (code === "rendezvous") return "pastille mousse";
  if (code === "message") return "pastille ambre";
  if (code === "raccroche" || code === "hors_horaires") return "pastille rouille";
  return "pastille";
}

export default async function Journal({ searchParams }: Props) {
  const parametres = await searchParams;
  await seance();
  const lignes = await lire<Ligne[]>("/lines");

  const requete = new URLSearchParams();
  if (parametres.issue) requete.set("outcome", parametres.issue);
  if (parametres.poste) requete.set("line_id", parametres.poste);
  requete.set("jours", parametres.jours ?? "14");
  if (parametres.motif) requete.set("q", parametres.motif);

  const journal = await lire<Journal>(`/calls?${requete}`);

  return (
    <>
      <header className="entete-page">
        <div>
          <h1>Journal d'appels</h1>
          <p className="note">
            Chaque fiche garde la dictée complète. {journal.calls.length} fiches
            sur {journal.days} jours.
          </p>
        </div>
        <div className="compteurs">
          {Object.entries(journal.counts)
            .filter(([, total]) => total > 0)
            .map(([code, total]) => (
              <div className="compteur" key={code}>
                <b className="chiffre">{total}</b>
                <span>{code}</span>
              </div>
            ))}
        </div>
      </header>

      <FiltresJournal
        postes={lignes.map((ligne) => ({ id: ligne.id, label: ligne.label }))}
        issue={parametres.issue ?? ""}
        poste={parametres.poste ?? ""}
        jours={parametres.jours ?? "14"}
        motif={parametres.motif ?? ""}
      />

      <section className="panneau">
        <table className="tableau">
          <thead>
            <tr>
              <th scope="col">Jour</th>
              <th scope="col">Heure</th>
              <th scope="col">Appelant</th>
              <th scope="col">Poste</th>
              <th scope="col">Touche</th>
              <th scope="col">Issue</th>
              <th scope="col">Tenu par</th>
              <th scope="col" className="droite">
                Durée
              </th>
            </tr>
          </thead>
          <tbody>
            {journal.calls.map((appel) => (
              <tr key={appel.id}>
                <td>{appel.day}</td>
                <td className="mono">{appel.clock}</td>
                <td>
                  <Link className="lien-fiche" href={`/journal/${appel.id}`}>
                    {appel.caller_name || "Appelant sans nom"}
                  </Link>
                  <div className="detail">{appel.caller_phone_display}</div>
                  {appel.question && (
                    <div className="demande">« {appel.question} »</div>
                  )}
                </td>
                <td>{appel.line_label}</td>
                <td className="mono">{appel.digit || "rien"}</td>
                <td>
                  <span className={pastille(appel.outcome)}>
                    {appel.outcome_label}
                  </span>
                  {appel.language === "en" && (
                    <div className="detail">en anglais</div>
                  )}
                </td>
                <td>{appel.handled_label}</td>
                <td className="mono droite">{appel.duration_label}</td>
              </tr>
            ))}
            {journal.calls.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <p className="vide">
                    Aucune fiche sur ce créneau. Élargissez la fenêtre ou
                    changez d'issue.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <p className="pager">
          Fiche la plus ancienne de la page :{" "}
          {journal.calls[journal.calls.length - 1]?.day ?? "aucune"}. La liste
          s'arrête à cent vingt fiches.
        </p>

        <p className="sous">Feuilles pour la direction</p>
        <div className="exports">
          <a
            className="bouton sobre petit"
            href={`/api/exports/calls.csv?jours=${journal.days}`}
          >
            Journal des appels
          </a>
          <a className="bouton sobre petit" href="/api/exports/messages.csv">
            Main courante
          </a>
          <a className="bouton sobre petit" href="/api/exports/appointments.csv">
            Places posées
          </a>
          <a className="bouton sobre petit" href="/api/exports/contacts.csv">
            Carnet des numéros
          </a>
          <a className="bouton sobre petit" href="/api/exports/closures.csv">
            Jours fermés
          </a>
        </div>
        <p className="note-bas">
          Chaque feuille s'ouvre dans Excel et LibreOffice : point-virgule, BOM,
          et les champs qui commencent par un signe égal sont précédés d'une
          apostrophe. En Démo, les lignes viennent du jeu d'essai, pas d'un
          tronc réel.
        </p>
      </section>
    </>
  );
}
