import Link from "next/link";
import type { Metadata } from "next";
import { FeuilleRendezVous } from "@/components/feuille-rdv";
import { Guichets } from "@/components/guichets";
import { Preneur, type Places } from "@/components/agenda";
import { lire } from "@/lib/api";
import { seance } from "@/lib/session";
import type { Guichet, RendezVous } from "@/lib/types";
import "../../../styles/agenda.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Agenda des guichets',
};

const FENETRES = [
  { code: "futur", label: "À venir" },
  { code: "jour", label: "La journée" },
  { code: "passe", label: "Déjà passés" },
  { code: "tous", label: "Tout" },
];

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function Agenda({ searchParams }: Props) {
  const parametres = await searchParams;
  await seance();
  const fenêtre = FENETRES.some((item) => item.code === parametres.fenetre)
    ? (parametres.fenetre as string)
    : "futur";

  const [guichets, agenda] = await Promise.all([
    lire<Guichet[]>("/standard/guichets"),
    lire<{ appointments: RendezVous[]; cancelled: number }>(
      `/appointments?horizon=${fenêtre}`
    ),
  ]);

  const premier = guichets[0];
  const depart = premier
    ? await lire<Places>(`/appointments/slots?service_id=${premier.id}&limit=18`)
    : null;
  const rappelles = agenda.appointments.filter((place) => place.reminded).length;

  return (
    <>
      <header className="entete-page">
        <div>
          <h1>Agenda des guichets</h1>
          <p className="note">
            Les heures que la voix peut proposer, et celles qu'elle a déjà
            posées. Une place prise au téléphone arrive ici avec sa référence,
            la même que l'appelant entend.
          </p>
          <nav className="fenetres">
            {FENETRES.map((item) => (
              <Link
                key={item.code}
                href={item.code === "futur" ? "/agenda" : `/agenda?fenetre=${item.code}`}
                className={item.code === fenêtre ? "active" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="compteurs">
          <div className="compteur mousse">
            <b className="chiffre">{agenda.appointments.length}</b>
            <span>places affichées</span>
          </div>
          <div className="compteur ambre">
            <b className="chiffre">{rappelles}</b>
            <span>rappels partis</span>
          </div>
          <div className="compteur rouille">
            <b className="chiffre">{agenda.cancelled}</b>
            <span>annulées</span>
          </div>
        </div>
      </header>

      <div className="panneaux">
        <Preneur guichets={guichets} depart={depart} />
        <Guichets guichets={guichets} />
      </div>

      <div className="suite">
        <FeuilleRendezVous
          rendezVous={agenda.appointments}
          annules={agenda.cancelled}
        />
      </div>
    </>
  );
}
