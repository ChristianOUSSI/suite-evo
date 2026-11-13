import Link from "next/link";
import type { Metadata } from "next";
import { Courant } from "@/components/courant";
import { Laisser } from "@/components/laisser-message";
import { lire } from "@/lib/api";
import { seance } from "@/lib/session";
import type { Ligne, Message } from "@/lib/types";
import "../../../styles/main-courante.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Main courante',
};

const ETATS = [
  { code: "", label: "Tout" },
  { code: "nouveau", label: "Nouveaux" },
  { code: "en_cours", label: "En cours" },
  { code: "rappelle", label: "Rappelés" },
];

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function MainCourante({ searchParams }: Props) {
  const parametres = await searchParams;
  const session = await seance();
  const etat = ETATS.some((item) => item.code === (parametres.etat ?? ""))
    ? (parametres.etat ?? "")
    : "";
  const retard = parametres.retard === "1";

  const requete = new URLSearchParams();
  if (etat) requete.set("statut", etat);
  if (retard) requete.set("seulement_en_retard", "true");
  const chemin = `/messages${requete.toString() ? `?${requete}` : ""}`;

  const [file, lignes] = await Promise.all([
    lire<{ messages: Message[]; late: number; open: number }>(chemin),
    lire<Ligne[]>("/lines"),
  ]);

  function lien(code: string, enRetard: boolean): string {
    const URL = new URLSearchParams();
    if (code) URL.set("etat", code);
    if (enRetard) URL.set("retard", "1");
    const suite = URL.toString();
    return `/main-courante${suite ? `?${suite}` : ""}`;
  }

  return (
    <>
      <header className="entete-page">
        <div>
          <h1>Main courante</h1>
          <p className="note">
            Ce que la voix a retenu pour vous, et ce qu'un conseiller note à la
            main. Chaque mot porte l'heure à laquelle il devait être rendu.
          </p>
          <nav className="fenetres">
            {ETATS.map((item) => (
              <Link
                key={item.code || "tout"}
                href={lien(item.code, retard)}
                className={(parametres.etat ?? "") === item.code ? "active" : undefined}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={lien(etat, !retard)}
              className={retard ? "active retard" : "retard"}
            >
              Seulement en retard
            </Link>
          </nav>
        </div>
        <div className="compteurs">
          <div className="compteur ambre">
            <b className="chiffre">{file.open}</b>
            <span>à rendre</span>
          </div>
          <div className="compteur rouille">
            <b className="chiffre">{file.late}</b>
            <span>dépassés</span>
          </div>
          <div className="compteur">
            <b className="chiffre">{session.organization.callback_minutes}</b>
            <span>minutes de fenêtre</span>
          </div>
        </div>
      </header>

      <div className="panneaux">
        <Courant messages={file.messages} agent={session.user.name} />
        <Laisser
          postes={lignes.map((ligne) => ({ id: ligne.id, label: ligne.label }))}
          defaut={session.organization.callback_minutes}
        />
      </div>
    </>
  );
}
