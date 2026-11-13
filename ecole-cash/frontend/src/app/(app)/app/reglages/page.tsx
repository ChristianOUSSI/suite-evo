import type { Metadata } from "next";
import Link from "next/link";

import { EquipeConsole } from "@/components/equipe-console";
import { FormulaireReglages } from "@/components/formulaire-reglages";
import { Icone } from "@/components/icone";
import { lire } from "@/lib/api";
import { fcfa, pourcentage, telephoneLocal } from "@/lib/format";
import { seanceObligatoire } from "@/lib/session";
import type { Recapitulatif, Reglages } from "@/lib/types";

import "../../../../styles/reglages.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Réglages",
};

const FEUILLES = [
  {
    href: "/api/exports/eleves.csv",
    titre: "Élèves",
    cols: "Nom, classe, parent, deux numéros, année.",
  },
  {
    href: "/api/exports/echeances.csv",
    titre: "Échéances",
    cols: "Terme par terme : dû, imputé, reste, retard.",
  },
  {
    href: "/api/exports/impayes.csv",
    titre: "Impayés",
    cols: "Les familles qui doivent encore, jours de retard en tête.",
  },
  {
    href: "/api/exports/caisse.csv?jours=30",
    titre: "Caisse",
    cols: "Versements et comptages du soir, dans l'ordre des jours.",
  },
  {
    href: "/api/exports/recus.csv?jours=90",
    titre: "Reçus",
    cols: "Numéros, canaux, états et jetons de vérification.",
  },
];

const ANCRAGES = [
  { cle: "ecole", label: "L'école" },
  { cle: "calendrier", label: "Calendrier" },
  { cle: "ton", label: "Ton et délais" },
  { cle: "rails", label: "Rails" },
  { cle: "equipe", label: "Équipe" },
  { cle: "feuilles", label: "Feuilles CSV" },
];

export default async function Reglages() {
  const session = await seanceObligatoire();
  const [rendu, bilan] = await Promise.all([
    lire<Reglages>("/settings"),
    lire<Recapitulatif>("/recapitulatif"),
  ]);

  return (
    <div className="shell vitre">
      <div className="page-head">
        <div className="page-head__main">
          <span className="kicker">
            <Icone nom="reglage" taille={14} />{" "}
            {rendu.ecole.sigle || rendu.ecole.nom}
          </span>
          <h1 className="display">Les réglages</h1>
          <p className="page-head__lede">
            Les mots de l&apos;école, son calendrier, le ton des relances et les
            rails ouverts au guichet. Ce qui est écrit ici ressort sur chaque
            reçu, chaque feuille et chaque message. Rien n&apos;est facture :
            changer un texte ne change aucun montant déjà encaissé.
          </p>
        </div>
        <div className="page-head__aside">
          <span className="stamp stamp--moss">
            Abonnement {rendu.ecole.abonnement_label}
          </span>
          <span className="eyebrow">
            Ouvert par {session.user.nom}, {session.user.role_label.toLowerCase()}
          </span>
        </div>
      </div>

      <nav className="bande-ancrage" aria-label="Sections des réglages">
        {ANCRAGES.map((un) => (
          <a key={un.cle} href={`#${un.cle}`}>
            {un.label}
          </a>
        ))}
      </nav>

      <section className="sheet bloc reglages-bilan" aria-label="État du registre">
        <div className="section-head">
          <h2>Ce que dit le registre</h2>
          <span className="section-head__aside">année {bilan.annee}</span>
        </div>
        <dl className="bilan-grille">
          <div>
            <dt>Familles suivies</dt>
            <dd className="money">{rendu.compteurs.eleves}</dd>
          </div>
          <div>
            <dt>Classes ouvertes</dt>
            <dd className="money">{rendu.classes.length}</dd>
          </div>
          <div>
            <dt>Reçus émis</dt>
            <dd className="money">{rendu.compteurs.recus}</dd>
          </div>
          <div>
            <dt>Attendu sur l'année</dt>
            <dd className="money">{fcfa(bilan.attendu)}</dd>
          </div>
          <div>
            <dt>Rentré à ce jour</dt>
            <dd className="money">{fcfa(bilan.rentre)}</dd>
          </div>
          <div>
            <dt>Part recouvrée</dt>
            <dd className="money">{pourcentage(bilan.part)}</dd>
          </div>
        </dl>
        <p className="regle-note">
          {bilan.familles} famille{bilan.familles > 1 ? "s" : ""} engagée
          {bilan.familles > 1 ? "s" : ""} cette année, dont{" "}
          {bilan.familles_payeuses} déjà payée
          {bilan.familles_payeuses > 1 ? "s" : ""}. Reste{" "}
          <strong>{fcfa(bilan.reste)}</strong> à rentrer. Depuis l'ouverture du
          registre : {rendu.compteurs.recus} reçu{rendu.compteurs.recus > 1 ? "s" : ""}
          {" "}émis{rendu.compteurs.recus > 1 ? "s" : ""}, {fcfa(rendu.compteurs.attendu)}{" "}
          posés et {fcfa(rendu.compteurs.rentre)} imputés, toutes années. Cette
          phrase se lit telle quelle en réunion des parents.
        </p>
      </section>

      <section className="sheet bloc" aria-label="Réglages de l'école">
        <FormulaireReglages
          ecole={rendu.ecole}
          telephoneLocal={telephoneLocal(rendu.ecole.telephone)}
        />
      </section>

      <section className="sheet bloc" id="equipe" aria-label="Équipe de la caisse">
        <EquipeConsole membres={rendu.membres} />
      </section>

      <section className="sheet bloc" id="feuilles" aria-label="Feuilles à emporter">
        <div className="section-head">
          <h2>Les feuilles à emporter</h2>
          <span className="section-head__aside">
            <Icone nom="feuille" taille={13} /> cinq exports
          </span>
        </div>
        <p className="regle-note">
          Chaque feuille s&apos;ouvre dans Excel ou LibreOffice, en français,
          séparée par des points-virgules. Rien n&apos;est envoyé hors de cette
          machine.
        </p>
        <ul className="feuilles">
          {FEUILLES.map((un) => (
            <li className="feuille-ligne" key={un.href}>
              <a href={un.href} download className="feuille-ligne__titre">
                <Icone nom="feuille" taille={15} /> {un.titre}
              </a>
              <span className="feuille-ligne__cols">{un.cols}</span>
              <span className="mono feuille-ligne__nom">{un.href.split("/").pop()?.split("?")[0]}</span>
            </li>
          ))}
        </ul>
        <Link href="/app/journal" className="text-link">
          Voir le journal de caisse jour par jour
        </Link>
      </section>
    </div>
  );
}
