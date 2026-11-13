import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NonLie, StandardEteint, lire } from "@/lib/api";
import type { Session } from "@/lib/types";
import { Rail, type Groupe } from "@/components/rail";
import { EcranStandardEteint } from "@/components/standard-eteint";
import "../../styles/console.css";

export const metadata: Metadata = {
  title: {
    default: "Console du standard",
    template: "%s · CADC VOICE",
  },
};

const GROUPES: Groupe[] = [
  {
    titre: "Le standard",
    items: [
      { href: "/tableau", label: "Tableau du matin" },
      { href: "/journal", label: "Journal d'appels" },
      { href: "/simulateur", label: "Appel testé" },
    ],
  },
  {
    titre: "Ce qu'il faut tenir",
    items: [
      { href: "/repertoire", label: "Répertoire parlé" },
      { href: "/agenda", label: "Agenda des guichets" },
      { href: "/main-courante", label: "Main courante" },
      { href: "/envois", label: "Envois" },
    ],
  },
  {
    titre: "Réglages",
    items: [
      { href: "/standard", label: "Postes et touches" },
      { href: "/reglages", label: "Établissement" },
    ],
  },
];

export default async function Console({
  children,
}: {
  children: React.ReactNode;
}) {
  let seance: Session;
  try {
    seance = await lire<Session>("/auth/me");
  } catch (erreur) {
    if (erreur instanceof NonLie) redirect("/connexion");
    if (erreur instanceof StandardEteint) {
      return <EcranStandardEteint message={erreur.message} />;
    }
    throw erreur;
  }

  return (
    <div className="console">
      <Rail
        groupes={GROUPES}
        etablissement={seance.organization.name}
        agent={seance.user.name}
        ville={`${seance.organization.city}, ${seance.organization.quartier}`}
      />
      <main className="zone">{children}</main>
    </div>
  );
}
