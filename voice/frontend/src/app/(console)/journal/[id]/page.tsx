import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Dictee } from "@/components/dictee";
import { lire } from "@/lib/api";
import { seance } from "@/lib/session";
import type { Appel, Fiche, RendezVous } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fiche d'appel",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FicheAppel({ params }: Props) {
  const { id } = await params;
  await seance();

  let appel: Appel;
  try {
    appel = await lire<Appel>(`/calls/${id}`);
  } catch {
    notFound();
    return null;
  }

  const [reponses, agenda] = await Promise.all([
    appel.answer_id
      ? lire<Fiche>(`/answers/${appel.answer_id}`).catch(() => null)
      : Promise.resolve(null),
    appel.appointment_id
      ? lire<{ appointments: RendezVous[] }>("/appointments?horizon=tous").then(
          (file) =>
            file.appointments.find(
              (place) => place.id === appel.appointment_id
            ) ?? null
        )
      : Promise.resolve(null),
  ]);

  return (
    <>
      <header className="entete-page">
        <div>
          <h1>
            Fiche {String(appel.id).padStart(4, "0")}, {appel.day} à{" "}
            {appel.clock}
          </h1>
          <p className="note">
            {appel.caller_name || "Appelant sans nom"} ·{" "}
            {appel.caller_phone_display} · {appel.line_label} ·{" "}
            {appel.handled_label} · {appel.outcome_label} ·{" "}
            {appel.duration_label}
          </p>
        </div>
        <Link className="bouton sobre" href="/journal">
          Retour au journal
        </Link>
      </header>

      <section className="panneaux">
        <div className="panneau">
          <h2>Ce qui s'est dit</h2>
          {appel.question && (
            <p className="demande">
              La demande notée de l'appelant : « {appel.question} »
            </p>
          )}
          <Dictee lignes={appel.script} />
        </div>

        <div className="panneau">
          <h2>Rattaché à la fiche</h2>
          {reponses && (
            <div style={{ marginBottom: 18 }}>
              <h3 style={{ fontSize: 17 }}>Fiche lue</h3>
              <p className="note">{reponses.statement}</p>
              <p style={{ fontSize: 14, marginTop: 6 }}>{reponses.body}</p>
              <p className="detail">
                domaine {reponses.area}, {reponses.hits} lectures
              </p>
            </div>
          )}

          {agenda && (
            <div>
              <h3 style={{ fontSize: 17 }}>Place retenue</h3>
              <p className="note">
                {agenda.service_name}, {agenda.day} à {agenda.clock}
              </p>
              <p className="detail">
                référence {agenda.reference}, salle {agenda.room || "à préciser"}
              </p>
              <Link className="lien-fiche" href="/agenda">
                Ouvrir l'agenda
              </Link>
            </div>
          )}

          {!reponses && !agenda && (
            <p className="vide">
              Rien de posé pendant cet appel. La dictée suffit à comprendre ce
              qui s'est passé.
            </p>
          )}

          {appel.digit && (
            <p className="detail" style={{ marginTop: 16 }}>
              touche pressée : {appel.digit}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
