import type { Metadata } from "next";
import Link from "next/link";

import { EtiquetteEcheance, EtiquetteRecu } from "@/components/etiquettes";
import { Icone } from "@/components/icone";
import { Semaine } from "@/components/semaine";
import { lire } from "@/lib/api";
import { fcfa, fcfaCompact, pourcentage } from "@/lib/format";
import { t } from "@/lib/langue";
import { langueServeur } from "@/lib/langue-serveur";
import { seanceObligatoire } from "@/lib/session";
import type { Eleve, Tableau } from "@/lib/types";

import "../../../styles/tableau.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueServeur();
  return { title: t("app.meta", langue) };
}

export default async function Journee() {
  const langue = await langueServeur();
  const [tableau, session] = await Promise.all([
    lire<Tableau>("/dashboard"),
    seanceObligatoire(),
  ]);
  const caisse = tableau.caisse;
  const recouvrement = tableau.recouvrement;
  const nb = caisse.nb_entries;
  const relances = tableau.relances_dues;

  return (
    <div className="shell vitre">
      <div className="page-head">
        <div className="page-head__main">
          <span className="kicker">
            <Icone nom="caisse" taille={14} /> {tableau.day} · {tableau.annee}
          </span>
          <h1 className="display">
            {tableau.ecole.nom}
          </h1>
          <p className="page-head__lede">
            {t("dash.lede", langue, {
              nom: session.user.nom,
              role: session.user.role_label.toLowerCase(),
              effectif: tableau.effectif,
            })}{" "}
            {nb > 0
              ? t("dash.encaisse", langue, { n: nb, s: nb > 1 ? "s" : "" })
              : t("dash.rien", langue)}
          </p>
        </div>
        <div className="page-head__aside">
          <Link href="/app/guichet" className="btn btn--ink">
            {t("dash.encaisser", langue)}
            <span className="btn__fleche" aria-hidden="true">
              <Icone nom="fleche" taille={15} />
            </span>
          </Link>
          {relances > 0 ? (
            <Link href="/app/relances" className="btn btn--stamp">
              {t("dash.relances", langue, { n: relances, s: relances > 1 ? "s" : "" })}
            </Link>
          ) : null}
        </div>
      </div>

      <section className="jumelee" aria-label={t("dash.caisse", langue)}>
        <div className="sheet bloc">
          <div className="section-head">
            <h2>{t("dash.caisse", langue)}</h2>
            <span className="section-head__aside">
              {caisse.declaree ? t("dash.comptee", langue) : t("dash.tiroir_ouvert", langue)}
            </span>
          </div>

          <p className="recu-public__montant money" style={{ marginTop: "1rem" }}>
            {fcfa(caisse.total)}
          </p>

          <div className="recus">
            {Object.entries(caisse.par_mode).map(([libelle, montant]) => (
              <div className="ligne-ecolee" key={libelle}>
                <span className="ligne-ecolee__nom">{libelle}</span>
                <span className="ligne-ecolee__valeur">{fcfa(montant)}</span>
              </div>
            ))}
            {nb === 0 ? (
              <p className="vide-note">
                {t("dash.vide_tiroir", langue)}
              </p>
            ) : null}
          </div>

          <hr className="divider divider--ink" style={{ marginBlock: "1.2rem" }} />

          <div className="ligne-ecolee">
            <span className="ligne-ecolee__nom">{t("dash.fond", langue)}</span>
            <span className="ligne-ecolee__valeur">{fcfa(caisse.fond)}</span>
          </div>
          <div className="ligne-ecolee">
            <span className="ligne-ecolee__nom">{t("dash.annonce", langue)}</span>
            <span className="ligne-ecolee__valeur">{fcfa(caisse.attendu)}</span>
          </div>
          <div className="ligne-ecolee">
            <span className="ligne-ecolee__nom">{t("dash.comptage", langue)}</span>
            <span className="ligne-ecolee__valeur">
              {caisse.comptage === null ? t("dash.pas_compte", langue) : fcfa(caisse.comptage)}
            </span>
          </div>

          {caisse.ecart === null ? (
            <p className="tiroir__ferme">
              {caisse.tenu_par
                ? t("dash.tenu_par", langue, { nom: caisse.tenu_par })
                : t("dash.reste_a_compter", langue)}
              <Link href="/app/journal" className="text-link">
                {t("dash.compter", langue)}
              </Link>
            </p>
          ) : (
            <p
              className={`tiroir__ecart${caisse.ecart === 0 ? " tiroir__ecart--net" : ""}`}
            >
              {caisse.ecart === 0
                ? t("dash.ecart_net", langue)
                : t("dash.ecart", langue, {
                    montant: fcfa(Math.abs(caisse.ecart)),
                    sens: caisse.ecart > 0 ? t("dash.en_trop", langue) : t("dash.manquant", langue),
                  })}
            </p>
          )}
        </div>

        <div className="sheet bloc">
          <div className="section-head">
            <h2>{t("dash.recouvrement", langue)}</h2>
            <span className="section-head__aside">{tableau.annee}</span>
          </div>

          <p className="recu-public__montant money" style={{ marginTop: "1rem" }}>
            {pourcentage(recouvrement.part)}
          </p>
          <div className="fente">
            <span className="fente__regle" style={{ width: `${recouvrement.part}%` }} />
          </div>

          <div className="recus" style={{ marginTop: "1.2rem" }}>
            <div className="ligne-ecolee">
              <span className="ligne-ecolee__nom">{t("dash.attendu_annee", langue)}</span>
              <span className="ligne-ecolee__valeur">{fcfa(recouvrement.attendu)}</span>
            </div>
            <div className="ligne-ecolee">
              <span className="ligne-ecolee__nom">{t("dash.deja_rentre", langue)}</span>
              <span className="ligne-ecolee__valeur">{fcfa(recouvrement.rentre)}</span>
            </div>
            <div className="ligne-ecolee">
              <span className="ligne-ecolee__nom">{t("dash.reste_du", langue)}</span>
              <span className="ligne-ecolee__valeur">{fcfa(recouvrement.reste)}</span>
            </div>
          </div>

          <Semaine serie={tableau.serie} langue={langue} />
          <p className="field__aide" style={{ marginTop: "1.6rem" }}>
            {t("dash.serie_aide", langue)}
          </p>
        </div>

        <div className="sheet bloc">
          <div className="section-head">
            <h2>{t("dash.familles", langue)}</h2>
          </div>
          <div className="compte" style={{ marginTop: "1rem" }}>
            <div className="compte__case">
              <p className="compte__valeur">{tableau.effectif}</p>
              <span className="compte__legende">{t("dash.eleves_suivis", langue)}</span>
            </div>
            <div className="compte__case">
              <p
                className={`compte__valeur${tableau.en_retard > 0 ? " compte__valeur--alerte" : ""}`}
              >
                {tableau.en_retard}
              </p>
              <span className="compte__legende">{t("dash.en_retard", langue)}</span>
            </div>
            <div className="compte__case">
              <p className="compte__valeur">{tableau.suspendus}</p>
              <span className="compte__legende">{t("dash.suspendus", langue)}</span>
            </div>
            <div className="compte__case">
              <p className="compte__valeur">{tableau.relances_dues}</p>
              <span className="compte__legende">{t("dash.relances_dues", langue)}</span>
            </div>
          </div>
          <div className="form-stack" style={{ marginTop: "1.2rem" }}>
            <Link href="/app/eleves" className="btn btn--small btn--block">
              {t("dash.ouvrir_familles", langue)}
            </Link>
            <Link
              href="/app/reglages#feuilles"
              className="btn btn--small btn--block btn--quiet"
            >
              {t("dash.sortir_csv", langue)}
            </Link>
          </div>
        </div>
      </section>

      <section className="sheet bloc" aria-label={t("dash.classes_aria", langue)}>
        <div className="section-head">
          <h2>{t("dash.classes", langue)}</h2>
          <span className="section-head__aside">
            {t("dash.classes_aside", langue, { n: tableau.classes.length, annee: tableau.annee })}
          </span>
        </div>
        <table className="tableau-ecole">
          <thead>
            <tr>
              <th scope="col">{t("th.classe", langue)}</th>
              <th scope="col">{t("th.titulaire", langue)}</th>
              <th scope="col">{t("th.effectif", langue)}</th>
              <th scope="col">{t("th.par_eleve", langue)}</th>
              <th scope="col">{t("th.rentre", langue)}</th>
              <th scope="col">{t("th.reste", langue)}</th>
              <th scope="col">{t("th.recouvrement", langue)}</th>
            </tr>
          </thead>
          <tbody>
            {tableau.classes.map((classe) => (
              <tr key={classe.id}>
                <th scope="row" className="nom-classe">
                  <Link href={`/app/classes?classe=${classe.id}`} className="text-link">
                    {classe.label}
                  </Link>
                </th>
                <td>{classe.titulaire || t("dash.non_attribue", langue)}</td>
                <td className="chiffre">
                  {classe.effectif}/{classe.effectif_max}
                </td>
                <td className="chiffre">{fcfaCompact(classe.total)}</td>
                <td className="chiffre">{fcfaCompact(classe.rentre)}</td>
                <td className="chiffre">{fcfaCompact(classe.attendu - classe.rentre)}</td>
                <td className="chiffre">{pourcentage(classe.part)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grille-asso" aria-label={t("dash.aria_sections", langue)}>
        <div className="sheet bloc">
          <div className="section-head">
            <h2>{t("dash.retards", langue)}</h2>
            <Link href="/app/relances" className="section-head__aside text-link">
              {t("dash.relancer", langue)}
            </Link>
          </div>
          <div className="retards">
            {tableau.fiches_en_retard.length === 0 ? (
              <p className="vide-note">{t("dash.aucun_retard", langue)}</p>
            ) : null}
            {tableau.fiches_en_retard.map((eleve: Eleve) => (
              <div className="recu-ligne" key={eleve.id}>
                <span className="recu-ligne__numero mono">{eleve.classe}</span>
                <span className="recu-ligne__eleve">
                  <Link href={`/app/eleves/${eleve.id}`} className="text-link">
                    {eleve.nom_complet}
                  </Link>
                  <small>
                    {eleve.tuteur_nom || t("dash.parent_non_note", langue)} ·{" "}
                    {eleve.jours_retard} {t("dash.jours_retard", langue)}
                  </small>
                </span>
                <span className="ligne-ecolee__valeur money">
                  {fcfa(eleve.retard_montant)}
                </span>
                <span className={`tag ${eleve.statut === "suspendu" ? "tag--cut" : "tag--late"}`}>
                  {eleve.statut_label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="sheet bloc">
          <div className="section-head">
            <h2>{t("dash.termes", langue)}</h2>
            <span className="section-head__aside">{t("dash.six_proches", langue)}</span>
          </div>
          <div className="echeances-a-suivre">
            {tableau.prochaines_echeances.length === 0 ? (
              <p className="vide-note">
                {t("dash.aucun_terme", langue)}
              </p>
            ) : null}
            {tableau.prochaines_echeances.map((echeance) => (
              <div className="recu-ligne" key={`${echeance.id}-${echeance.eleve}`}>
                <span className="recu-ligne__numero mono">{echeance.classe}</span>
                <span className="recu-ligne__eleve">
                  {echeance.eleve}
                  <small>
                    {echeance.libelle} · {echeance.due_label}
                  </small>
                </span>
                <span className="ligne-ecolee__valeur money">
                  {fcfaCompact(echeance.reste)}
                </span>
                <EtiquetteEcheance statut={echeance.statut} langue={langue} />
              </div>
            ))}
          </div>
        </div>

        <div className="sheet bloc">
          <div className="section-head">
            <h2>{t("dash.derniers_recus", langue)}</h2>
            <Link href="/app/recus" className="section-head__aside text-link">
              {t("dash.tous_recus", langue)}
            </Link>
          </div>
          <div className="recus">
            {tableau.derniers_recus.length === 0 ? (
              <p className="vide-note">{t("dash.aucun_recu", langue)}</p>
            ) : null}
            {tableau.derniers_recus.map((recu) => (
              <div className="recu-ligne" key={recu.id}>
                <span className="recu-ligne__numero mono">{recu.numero}</span>
                <span className="recu-ligne__eleve">
                  {recu.eleve}
                  <small>
                    {recu.mode_label} · {recu.ago}
                  </small>
                </span>
                <span className="ligne-ecolee__valeur money">
                  {fcfaCompact(recu.montant)}
                </span>
                <EtiquetteRecu statut={recu.statut} langue={langue} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
