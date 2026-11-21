import type { Metadata } from "next";
import Link from "next/link";

import { Icone } from "@/components/icone";
import { lire } from "@/lib/api";
import { canoniseTelephone, fcfa, pourcentage } from "@/lib/format";
import { parametres } from "@/lib/client-api";
import { t } from "@/lib/langue";
import { langueServeur } from "@/lib/langue-serveur";
import type { Classe, ListeEleves } from "@/lib/types";

import "../../../../styles/eleves.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueServeur();
  return { title: t("fam.meta", langue) };
}

const ETATS = [
  { cle: "", cle_label: "fam.etat.tous" },
  { cle: "retard", cle_label: "fam.etat.retard" },
  { cle: "solde", cle_label: "fam.etat.solde" },
  { cle: "suspendu", cle_label: "fam.etat.suspendu" },
  { cle: "sans_classe", cle_label: "fam.etat.sans_classe" },
];

export default async function Familles({
  searchParams,
}: {
  searchParams: Promise<{ motif?: string; etat?: string; classe?: string; annee?: string }>;
}) {
  const langue = await langueServeur();
  const filtre = await searchParams;
  const etat = filtre.etat ?? "";
  const classe = filtre.classe ?? "";
  const motif = filtre.motif ?? "";

  const rendu = await lire<ListeEleves>(
    `/eleves${parametres({ motif, etat, classe, annee: filtre.annee, limite: 400 })}`,
  );
  const journee = await lire<{ classes: Classe[] }>("/dashboard");
  const total = rendu.total;
  const affichees = rendu.eleves.length;
  const portee =
    total === affichees
      ? t("fam.toutes", langue)
      : t("fam.affichees", langue, { n: affichees });

  return (
    <div className="shell vitre">
      <div className="page-head">
        <div className="page-head__main">
          <span className="kicker">
            <Icone nom="eleve" taille={14} /> {t("fam.kicker", langue, { annee: rendu.annee })}
          </span>
          <h1 className="display">{t("fam.titre", langue)}</h1>
          <p className="page-head__lede">
            {t("fam.lede", langue, {
              total,
              s: total > 1 ? "s" : "",
              portee,
              attendu: fcfa(rendu.attendu),
              reste: fcfa(rendu.reste),
              retards: rendu.retards,
            })}
          </p>
        </div>
        <div className="page-head__aside">
          <Link href="/app/guichet" className="btn btn--ink">
            {t("fam.encaisser", langue)}
          </Link>
          <Link href="/app/eleves/nouvel" className="btn">
            {t("fam.inscrire", langue)}
          </Link>
        </div>
      </div>

      <form className="filtres" action="/app/eleves" method="get">
        <div className="field">
          <label htmlFor="motif">{t("fam.filtre_label", langue)}</label>
          <input
            id="motif"
            name="motif"
            type="search"
            defaultValue={motif}
            placeholder={t("fam.filtre_placeholder", langue)}
          />
        </div>
        <div className="field field--court">
          <label htmlFor="classe">{t("fam.classe", langue)}</label>
          <select id="classe" name="classe" defaultValue={classe}>
            <option value="">{t("fam.toutes_classes", langue)}</option>
            {journee.classes.map((une) => (
              <option key={une.id} value={String(une.id)}>
                {une.label}
              </option>
            ))}
          </select>
        </div>
        {etat ? <input type="hidden" name="etat" value={etat} /> : null}
        <button type="submit" className="btn btn--ink">
          {t("fam.filtrer", langue)}
        </button>
        {motif || classe || etat ? (
          <Link href="/app/eleves" className="btn btn--quiet">
            {t("fam.revoir", langue)}
          </Link>
        ) : null}
      </form>

      <nav className="bande-filtre" aria-label={t("fam.etat.aria", langue)}>
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
              {t(case_.cle_label, langue)}
            </Link>
          );
        })}
      </nav>

      <section className="sheet bloc" aria-label={t("fam.ardoises", langue)}>
        <div className="section-head">
          <h2>{t("fam.ardoises", langue)}</h2>
          <span className="section-head__aside">
            {t("fam.lignes", langue, { n: affichees, s: affichees > 1 ? "s" : "" })}
          </span>
        </div>

        <div className="filer" style={{ marginTop: "1.1rem" }}>
          {affichees === 0 ? (
            <div className="empty">
              <h3>{t("fam.vide_titre", langue)}</h3>
              <p>
                {t("fam.vide_texte", langue)}
              </p>
              <Link href="/app/eleves" className="text-link">
                {t("fam.vide_lien", langue)}
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
                  {eleve.tuteur_nom || t("fam.parent_non_note", langue)}
                  {canoniseTelephone(eleve.tuteur_telephone) ? "" : ` · ${t("fam.sans_numero", langue)}`}
                </small>
              </span>
              <span className="ardoise-fiche__montants">
                <span className="mono">{t("fam.dus", langue, { montant: fcfa(eleve.du) })}</span>
                <span className="mono">{t("fam.regle", langue, { pct: pourcentage(eleve.du > 0 ? (eleve.rentre / eleve.du) * 100 : 0) })}</span>
              </span>
              <span
                className={`ardoise-fiche__reste money${
                  eleve.reste === 0 ? " filer__reste--solde" : eleve.en_retard ? " filer__reste--retard" : ""
                }`}
              >
                {eleve.reste === 0 ? t("fam.annee_reglee", langue) : t("fam.restants", langue, { montant: fcfa(eleve.reste) })}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
