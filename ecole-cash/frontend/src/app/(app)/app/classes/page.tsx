import type { Metadata } from "next";
import Link from "next/link";

import { ClassesConsole } from "@/components/classes-console";
import { Icone } from "@/components/icone";
import { lire } from "@/lib/api";
import { fcfa } from "@/lib/format";
import { seanceObligatoire } from "@/lib/session";
import type { Classe, Recapitulatif } from "@/lib/types";

import "../../../../styles/classes.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Classes",
};

export default async function Classes({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string }>;
}) {
  const filtre = await searchParams;
  const auDepart = Number.parseInt(filtre.classe ?? "", 10);
  const [classes, recap, session] = await Promise.all([
    lire<Classe[]>("/classes"),
    lire<Recapitulatif>("/recapitulatif"),
    seanceObligatoire(),
  ]);
  const deLAnnee = classes.filter((classe) => classe.annee === session.ecole.annee);

  return (
    <div className="shell">
      <div className="page-head">
        <div className="page-head__main">
          <span className="kicker">
            <Icone nom="classe" taille={14} /> Barèmes et engagements
          </span>
          <h1 className="display">Les classes</h1>
          <p className="page-head__lede">
            {deLAnnee.length} classe{deLAnnee.length > 1 ? "s" : ""} ouverte
            {deLAnnee.length > 1 ? "s" : ""} pour {session.ecole.annee} ·{" "}
            {recap.familles} familles engagées, {fcfa(recap.attendu)} attendus,{" "}
            {fcfa(recap.reste)} à rentrer. Engager une classe pose l&apos;ardoise
            de chaque élève et programme les relances.
          </p>
        </div>
        <div className="page-head__aside">
          <Link href="/app/eleves/nouvel" className="btn btn--ink">
            Inscrire un élève
          </Link>
        </div>
      </div>

      <ClassesConsole
        classes={classes}
        annee={session.ecole.annee}
        auDepart={Number.isNaN(auDepart) ? null : auDepart}
      />
    </div>
  );
}
