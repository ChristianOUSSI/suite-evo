import type { Metadata } from "next";
import Link from "next/link";

import { EtiquetteEcheance, EtiquetteRecu } from "@/components/etiquettes";
import { Icone } from "@/components/icone";
import { Semaine } from "@/components/semaine";
import { lire } from "@/lib/api";
import { fcfa, fcfaCompact, pourcentage } from "@/lib/format";
import { seanceObligatoire } from "@/lib/session";
import type { Eleve, Tableau } from "@/lib/types";

import "../../../styles/tableau.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "La journée",
};

export default async function Journee() {
  const [tableau, session] = await Promise.all([
    lire<Tableau>("/dashboard"),
    seanceObligatoire(),
  ]);
  const caisse = tableau.caisse;
  const recouvrement = tableau.recouvrement;

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
            {session.user.nom}, {session.user.role_label.toLowerCase()} ·{" "}
            {tableau.effectif} élèves suivis cette année.{" "}
            {caisse.nb_entries > 0
              ? `${caisse.nb_entries} versement${caisse.nb_entries > 1 ? "s" : ""} encaissé${caisse.nb_entries > 1 ? "s" : ""} aujourd'hui.`
              : "Rien n'a encore été encaissé aujourd'hui."}
          </p>
        </div>
        <div className="page-head__aside">
          <Link href="/app/guichet" className="btn btn--ink">
            Encaisser au guichet
            <span className="btn__fleche" aria-hidden="true">
              <Icone nom="fleche" taille={15} />
            </span>
          </Link>
          {tableau.relances_dues > 0 ? (
            <Link href="/app/relances" className="btn btn--stamp">
              {tableau.relances_dues} relance
              {tableau.relances_dues > 1 ? "s" : ""} à envoyer
            </Link>
          ) : null}
        </div>
      </div>

      <section className="jumelee" aria-label="La caisse et le recouvrement">
        <div className="sheet bloc">
          <div className="section-head">
            <h2>Caisse du jour</h2>
            <span className="section-head__aside">
              {caisse.declaree ? "comptée" : "tiroir ouvert"}
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
            {caisse.nb_entries === 0 ? (
              <p className="vide-note">
                Aucune entrée au tiroir depuis ce matin.
              </p>
            ) : null}
          </div>

          <hr className="divider divider--ink" style={{ marginBlock: "1.2rem" }} />

          <div className="ligne-ecolee">
            <span className="ligne-ecolee__nom">Fond du tiroir</span>
            <span className="ligne-ecolee__valeur">{fcfa(caisse.fond)}</span>
          </div>
          <div className="ligne-ecolee">
            <span className="ligne-ecolee__nom">La caisse annonce</span>
            <span className="ligne-ecolee__valeur">{fcfa(caisse.attendu)}</span>
          </div>
          <div className="ligne-ecolee">
            <span className="ligne-ecolee__nom">Comptage du soir</span>
            <span className="ligne-ecolee__valeur">
              {caisse.comptage === null ? "pas encore compté" : fcfa(caisse.comptage)}
            </span>
          </div>

          {caisse.ecart === null ? (
            <p className="tiroir__ferme">
              {caisse.tenu_par
                ? `Tenu par ${caisse.tenu_par} · `
                : "Le comptage du soir reste à faire. "}
              <Link href="/app/journal" className="text-link">
                Compter le tiroir
              </Link>
            </p>
          ) : (
            <p
              className={`tiroir__ecart${caisse.ecart === 0 ? " tiroir__ecart--net" : ""}`}
            >
              {caisse.ecart === 0
                ? "Rien à redire : le tiroir rend exactement ce qu'il annonçait."
                : `Écart de ${fcfa(Math.abs(caisse.ecart))} ${caisse.ecart > 0 ? "en trop" : "manquant"}. La journée reste ouverte tant que ce n'est pas expliqué.`}
            </p>
          )}
        </div>

        <div className="sheet bloc">
          <div className="section-head">
            <h2>Recouvrement</h2>
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
              <span className="ligne-ecolee__nom">Attendu sur l'année</span>
              <span className="ligne-ecolee__valeur">{fcfa(recouvrement.attendu)}</span>
            </div>
            <div className="ligne-ecolee">
              <span className="ligne-ecolee__nom">Déjà rentré</span>
              <span className="ligne-ecolee__valeur">{fcfa(recouvrement.rentre)}</span>
            </div>
            <div className="ligne-ecolee">
              <span className="ligne-ecolee__nom">Ce qui reste dû</span>
              <span className="ligne-ecolee__valeur">{fcfa(recouvrement.reste)}</span>
            </div>
          </div>

          <Semaine serie={tableau.serie} />
          <p className="field__aide" style={{ marginTop: "1.6rem" }}>
            La partie sombre des barres, ce sont les espèces : ce que le tiroir
            doit rendre le soir.
          </p>
        </div>

        <div className="sheet bloc">
          <div className="section-head">
            <h2>Familles</h2>
          </div>
          <div className="compte" style={{ marginTop: "1rem" }}>
            <div className="compte__case">
              <p className="compte__valeur">{tableau.effectif}</p>
              <span className="compte__legende">élèves suivis</span>
            </div>
            <div className="compte__case">
              <p
                className={`compte__valeur${tableau.en_retard > 0 ? " compte__valeur--alerte" : ""}`}
              >
                {tableau.en_retard}
              </p>
              <span className="compte__legende">en retard</span>
            </div>
            <div className="compte__case">
              <p className="compte__valeur">{tableau.suspendus}</p>
              <span className="compte__legende">suspendus</span>
            </div>
            <div className="compte__case">
              <p className="compte__valeur">{tableau.relances_dues}</p>
              <span className="compte__legende">relances dues</span>
            </div>
          </div>
          <div className="form-stack" style={{ marginTop: "1.2rem" }}>
            <Link href="/app/eleves" className="btn btn--small btn--block">
              Ouvrir les familles
            </Link>
            <Link
              href="/app/reglages#feuilles"
              className="btn btn--small btn--block btn--quiet"
            >
              Sortir une feuille CSV
            </Link>
          </div>
        </div>
      </section>

      <section className="sheet bloc" aria-label="Classes de l'année">
        <div className="section-head">
          <h2>Les classes</h2>
          <span className="section-head__aside">
            {tableau.classes.length} classes · {tableau.annee}
          </span>
        </div>
        <table className="tableau-ecole">
          <thead>
            <tr>
              <th scope="col">Classe</th>
              <th scope="col">Titulaire</th>
              <th scope="col">Effectif</th>
              <th scope="col">Par élève</th>
              <th scope="col">Rentré</th>
              <th scope="col">Reste</th>
              <th scope="col">Recouvrement</th>
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
                <td>{classe.titulaire || "non attribué"}</td>
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

      <section className="grille-asso" aria-label="Reçus, retards et termes à venir">
        <div className="sheet bloc">
          <div className="section-head">
            <h2>Retards à traiter</h2>
            <Link href="/app/relances" className="section-head__aside text-link">
              Relancer
            </Link>
          </div>
          <div className="retards">
            {tableau.fiches_en_retard.length === 0 ? (
              <p className="vide-note">Aucune échéance en retard. La caisse respire.</p>
            ) : null}
            {tableau.fiches_en_retard.map((eleve: Eleve) => (
              <div className="recu-ligne" key={eleve.id}>
                <span className="recu-ligne__numero mono">{eleve.classe}</span>
                <span className="recu-ligne__eleve">
                  <Link href={`/app/eleves/${eleve.id}`} className="text-link">
                    {eleve.nom_complet}
                  </Link>
                  <small>
                    {eleve.tuteur_nom || "parent non noté"} ·{" "}
                    {eleve.jours_retard} jours de retard
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
            <h2>Termes à venir</h2>
            <span className="section-head__aside">six plus proches</span>
          </div>
          <div className="echeances-a-suivre">
            {tableau.prochaines_echeances.length === 0 ? (
              <p className="vide-note">
                Aucun engagement posé cette année. Engagez d'abord les classes.
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
                <EtiquetteEcheance statut={echeance.statut} />
              </div>
            ))}
          </div>
        </div>

        <div className="sheet bloc">
          <div className="section-head">
            <h2>Derniers reçus</h2>
            <Link href="/app/recus" className="section-head__aside text-link">
              Tous les reçus
            </Link>
          </div>
          <div className="recus">
            {tableau.derniers_recus.length === 0 ? (
              <p className="vide-note">Rien n'a été encaissé pour l'instant.</p>
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
                <EtiquetteRecu statut={recu.statut} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
