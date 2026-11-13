import type { Metadata } from "next";
import Link from "next/link";

import { Icone } from "@/components/icone";
import { lire } from "@/lib/api";
import { canoniseTelephone, fcfa, pourcentage } from "@/lib/format";
import { parametres } from "@/lib/client-api";
import type { Classe, ListeEleves } from "@/lib/types";

import "../../../../styles/eleves.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Familles",
};

const ETATS = [
  { cle: "", label: "Tous" },
  { cle: "retard", label: "En retard" },
  { cle: "solde", label: "Soldés" },
  { cle: "suspendu", label: "Suspendus" },
  { cle: "sans_classe", label: "Sans classe" },
];

export default async function Familles({
  searchParams,
}: {
  searchParams: Promise<{ motif?: string; etat?: string; classe?: string; annee?: string }>;
}) {
  const filtre = await searchParams;
  const etat = filtre.etat ?? "";
  const classe = filtre.classe ?? "";
  const motif = filtre.motif ?? "";

  const rendu = await lire<ListeEleves>(
    `/eleves${parametres({ motif, etat, classe, annee: filtre.annee, limite: 400 })}`,
  );
  const journee = await lire<{ classes: Classe[] }>("/dashboard");

  return (
    <div className="shell vitre">
      <div className="page-head">
        <div className="page-head__main">
          <span className="kicker">
            <Icone nom="eleve" taille={14} /> {rendu.annee}
          </span>
          <h1 className="display">Les familles</h1>
          <p className="page-head__lede">
            {rendu.total} fiche{rendu.total > 1 ? "s" : ""} retenue
            {rendu.total > 1 ? "s" : ""} sur {rendu.total === rendu.eleves.length ? "toutes" : `les ${rendu.eleves.length} affichées`}
            · {fcfa(rendu.attendu)} attendus, {fcfa(rendu.reste)} encore dus,{" "}
            {rendu.retards} en retard.
          </p>
        </div>
        <div className="page-head__aside">
          <Link href="/app/guichet" className="btn btn--ink">
            Encaisser
          </Link>
          <Link href="/app/eleves/nouvel" className="btn">
            Inscrire un élève
          </Link>
        </div>
      </div>

      <form className="filtres" action="/app/eleves" method="get">
        <div className="field">
          <label htmlFor="motif">Nom, prénom, matricule ou parent</label>
          <input
            id="motif"
            name="motif"
            type="search"
            defaultValue={motif}
            placeholder="Zanga, CP2-2027-004, maman Njoya…"
          />
        </div>
        <div className="field field--court">
          <label htmlFor="classe">Classe</label>
          <select id="classe" name="classe" defaultValue={classe}>
            <option value="">Toutes</option>
            {journee.classes.map((une) => (
              <option key={une.id} value={String(une.id)}>
                {une.label}
              </option>
            ))}
          </select>
        </div>
        {etat ? <input type="hidden" name="etat" value={etat} /> : null}
        <button type="submit" className="btn btn--ink">
          Filtrer
        </button>
        {motif || classe || etat ? (
          <Link href="/app/eleves" className="btn btn--quiet">
            Tout revoir
          </Link>
        ) : null}
      </form>

      <nav className="bande-filtre" aria-label="État de compte">
        {ETATS.map((case_) => {
          const href = `/app/eleves${parametres({
            motif,
            classe,
            etat: case_.cle,
            annee: filtre.annee,
          })}`;
          const actif = case_.cle === etat;
          return (
            <Link
              key={case_.cle || "tous"}
              href={href}
              className={actif ? "is-active" : undefined}
              aria-current={actif ? "true" : undefined}
            >
              {case_.label}
            </Link>
          );
        })}
      </nav>

      <section className="sheet bloc" aria-label="Fiches">
        <div className="section-head">
          <h2>Ardoises</h2>
          <span className="section-head__aside">
            {rendu.eleves.length} ligne{rendu.eleves.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="filer" style={{ marginTop: "1.1rem" }}>
          {rendu.eleves.length === 0 ? (
            <div className="empty">
              <h3>Rien sous ce filtre.</h3>
              <p>
                Une classe et un état en même temps, ça peut ne laisser personne.
                Revenez à la liste complète.
              </p>
              <Link href="/app/eleves" className="text-link">
                Toutes les familles
              </Link>
            </div>
          ) : null}
          {rendu.eleves.map((eleve) => (
            <Link
              key={eleve.id}
              href={`/app/eleves/${eleve.id}`}
              className={`ardoise-fiche${
                eleve.en_retard
                  ? " ardoise-fiche--retard"
                  : eleve.reste === 0
                    ? " ardoise-fiche--solde"
                    : ""
              }`}
            >
              <span className="ardoise-fiche__nom">
                {eleve.nom_complet}
                <small>
                  {eleve.classe} · {eleve.matricule} ·{" "}
                  {eleve.tuteur_nom || "parent non noté"}
                  {canoniseTelephone(eleve.tuteur_telephone) ? "" : " · sans numéro"}
                </small>
              </span>
              <span className="ardoise-fiche__montants">
                <span className="mono">{fcfa(eleve.du)} dus</span>
                <span className="mono">{pourcentage(eleve.du > 0 ? (eleve.rentre / eleve.du) * 100 : 0)} réglé</span>
              </span>
              <span
                className={`ardoise-fiche__reste money${
                  eleve.reste === 0 ? " filer__reste--solde" : eleve.en_retard ? " filer__reste--retard" : ""
                }`}
              >
                {eleve.reste === 0 ? "année réglée" : `${fcfa(eleve.reste)} restants`}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
