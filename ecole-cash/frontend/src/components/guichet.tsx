"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { EtiquetteEcheance } from "@/components/etiquettes";
import { Icone } from "@/components/icone";
import { MentionDemo } from "@/components/mention-demo";
import { ecrire } from "@/lib/client-api";
import { ErreurCaisse } from "@/lib/errors";
import { canoniseTelephone, fcfa, pourcentage } from "@/lib/format";
import { t, LANGUE_DEFAUT, type Langue } from "@/lib/langue";
import type { Classe, Ecole, Eleve, Encaissement, Mode, Recu } from "@/lib/types";

const MODES: {
  cle: Mode;
  cle_libelle: string;
  cle_aide: string;
  rails: keyof Ecole | null;
}[] = [
  { cle: "especes", cle_libelle: "guichet.mode.especes", cle_aide: "guichet.mode.especes_aide", rails: "especes_actifs" },
  { cle: "momo_mtn", cle_libelle: "guichet.mode.momo_mtn", cle_aide: "guichet.mode_ref_aide", rails: "momo_actif" },
  { cle: "momo_orange", cle_libelle: "guichet.mode.momo_orange", cle_aide: "guichet.mode_ref_aide", rails: "orange_actif" },
  { cle: "cheque", cle_libelle: "guichet.mode.cheque", cle_aide: "guichet.mode.cheque_aide", rails: null },
  { cle: "virement", cle_libelle: "guichet.mode.virement", cle_aide: "guichet.mode.virement_aide", rails: null },
];

const AUCUNE_REFERENCE: Mode[] = ["especes", "virement"];

export function Guichet({
  eleves,
  classes,
  ecole,
  langue = LANGUE_DEFAUT,
}: {
  eleves: Eleve[];
  classes: Classe[];
  ecole: Ecole;
  langue?: Langue;
}) {
  const [recherche, setRecherche] = useState("");
  const [classeActive, setClasseActive] = useState<string>("");
  const [choisi, setChoisi] = useState<number | null>(null);
  const [cartes, setCartes] = useState<Record<number, Eleve>>(
    () => Object.fromEntries(eleves.map((e) => [e.id, e])),
  );

  const filtres = useMemo(() => {
    const motif = recherche.trim().toLowerCase();
    return Object.values(cartes).filter((eleve) => {
      if (classeActive && `${eleve.classe_id ?? ""}` !== classeActive) {
        return false;
      }
      if (!motif) {
        return true;
      }
      return (
        eleve.nom_complet.toLowerCase().includes(motif) ||
        eleve.matricule.toLowerCase().includes(motif) ||
        eleve.tuteur_nom.toLowerCase().includes(motif)
      );
    });
  }, [cartes, classeActive, recherche]);

  const eleve = choisi === null ? null : (cartes[choisi] ?? null);

  return (
    <div className="guichet">
      <section className="sheet bloc" aria-label={t("guichet.aria_familles", langue)}>
        <div className="section-head">
          <h2>{t("guichet.titre_familles", langue)}</h2>
          <span className="section-head__aside">
            {t(filtres.length > 1 ? "guichet.nb_familles" : "guichet.nb_famille", langue, { n: filtres.length })}
          </span>
        </div>

        <div className="form-grid form-grid--pair" style={{ marginTop: "1.1rem" }}>
          <div className="field">
            <label htmlFor="guichet-recherche">{t("guichet.recherche", langue)}</label>
            <input
              id="guichet-recherche"
              type="search"
              value={recherche}
              placeholder={t("guichet.placeholder_recherche", langue)}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="guichet-classe">{t("guichet.classe", langue)}</label>
            <select
              id="guichet-classe"
              value={classeActive}
              onChange={(e) => setClasseActive(e.target.value)}
            >
              <option value="">{t("guichet.toutes_classes", langue)}</option>
              {classes.map((classe) => (
                <option key={classe.id} value={String(classe.id)}>
                  {t("guichet.classe_option", langue, { classe: classe.label, n: classe.effectif })}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filer" style={{ marginTop: "1.1rem" }}>
          {filtres.length === 0 ? (
            <p className="vide-note">
              {t("guichet.aucun", langue, { annee: ecole.annee })}
            </p>
          ) : null}
          {filtres.slice(0, 40).map((carte) => (
            <button
              type="button"
              key={carte.id}
              className={`filer__ligne${choisi === carte.id ? " is-choisi" : ""}`}
              onClick={() => setChoisi(carte.id)}
              aria-pressed={choisi === carte.id}
            >
              <span className="filer__nom">
                {carte.nom_complet}
                <small>
                  {carte.classe} · {carte.matricule}
                  {carte.tuteur_nom ? ` · ${carte.tuteur_nom}` : ""}
                </small>
              </span>
              <span
                className={`filer__reste money${
                  carte.reste === 0
                    ? " filer__reste--solde"
                    : carte.en_retard
                      ? " filer__reste--retard"
                      : ""
                }`}
              >
                {carte.reste === 0 ? t("guichet.solde", langue) : fcfa(carte.reste)}
                <small>
                  {carte.reste === 0
                    ? t("guichet.annee_reglee", langue)
                    : t("guichet.pct_regle", langue, { pct: pourcentage(carte.du > 0 ? (carte.rentre / carte.du) * 100 : 0) })}
                </small>
              </span>
            </button>
          ))}
          {filtres.length > 40 ? (
            <p className="vide-note">
              {t("guichet.plus_40", langue, { n: filtres.length })}
            </p>
          ) : null}
        </div>
      </section>

      {!eleve ? (
        <section className="sheet bloc" aria-label={t("guichet.vide_titre", langue)}>
          <div className="empty">
            <Icone nom="monnaie" taille={26} />
            <h3>{t("guichet.vide_titre", langue)}</h3>
            <p>
              {t("guichet.vide_texte", langue)}
            </p>
            <Link href="/app/eleves" className="text-link">
              {t("guichet.toutes_familles", langue)}
            </Link>
          </div>
        </section>
      ) : (
        <FormulaireEncaissement
          key={`${eleve.id}-${eleve.reste}`}
          eleve={eleve}
          ecole={ecole}
          langue={langue}
          surReçu={(mis) => {
            setCartes((actuel) => ({ ...actuel, [mis.id]: mis }));
          }}
        />
      )}
    </div>
  );
}

function FormulaireEncaissement({
  eleve,
  ecole,
  langue,
  surReçu,
}: {
  eleve: Eleve;
  ecole: Ecole;
  langue: Langue;
  surReçu: (eleve: Eleve) => void;
}) {
  const premiere = eleve.echeances.find((e) => e.statut !== "solde") ?? null;
  const [mode, setMode] = useState<Mode>("especes");
  const [montant, setMontant] = useState<string>(
    String(premiere ? premiere.reste : eleve.reste),
  );
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [recu, setRecu] = useState<Recu | null>(null);

  const valeur = Number.parseInt(montant.replace(/\D/g, ""), 10) || 0;
  const trop = valeur > eleve.reste;

  async function encaisser(event: React.FormEvent) {
    event.preventDefault();
    setEnCours(true);
    setMessage(null);
    try {
      const rendu = await ecrire<Encaissement>("/paiements", {
        method: "POST",
        body: {
          eleve_id: eleve.id,
          montant: valeur,
          mode,
          reference: reference.trim(),
          note: note.trim(),
        },
      });
      surReçu(rendu.eleve);
      setRecu(rendu.recu);
      setReference("");
      setNote("");
      const suite = rendu.eleve.echeances.find((e) => e.statut !== "solde") ?? null;
      setMontant(String(suite ? suite.reste : rendu.eleve.reste));
    } catch (erreur) {
      setMessage(
        erreur instanceof ErreurCaisse
          ? erreur.message
          : t("connexion.erreur", langue),
      );
    } finally {
      setEnCours(false);
    }
  }

  if (recu) {
    return <SortieDeReçu recu={recu} eleve={eleve} ecole={ecole} langue={langue} suite={() => setRecu(null)} />;
  }

  return (
    <section className="sheet bloc" aria-label={t("guichet.aria_encaissement", langue)}>
      <div className="section-head">
        <h2>{eleve.nom_complet}</h2>
        <span className="section-head__aside">{eleve.classe}</span>
      </div>

      <div className="ligne-ecolee" style={{ marginTop: "1rem" }}>
        <span className="ligne-ecolee__nom mono">{eleve.matricule}</span>
        <span className="ligne-ecolee__valeur">{eleve.tuteur_telephone_display || t("guichet.aucun_numero", langue)}</span>
      </div>

      <div className="ardoise">
        {eleve.echeances.map((terme) => (
          <div
            className={`ardoise__terme${
              terme.statut === "retard"
                ? " ardoise__terme--retard"
                : terme.statut === "solde"
                  ? " ardoise__terme--solde"
                  : ""
            }`}
            key={terme.id}
          >
            <span className="ardoise__libelle">
              {terme.libelle}
              <small>{terme.due_label}</small>
            </span>
            <span className="ardoise__montant money">
              {fcfa(terme.impute)} / {fcfa(terme.montant)}
            </span>
            <EtiquetteEcheance statut={terme.statut} langue={langue} />
          </div>
        ))}
        {eleve.echeances.length === 0 ? (
          <p className="vide-note">
            {t("guichet.aucune_ardoise", langue, { annee: eleve.annee })}
          </p>
        ) : null}
      </div>

      <hr className="divider divider--ink" style={{ marginBlock: "1.2rem" }} />

      {eleve.reste === 0 ? (
        <div className="notice notice--success">
          {t("guichet.annee_reglee_notice", langue, { montant: fcfa(eleve.du) })}
        </div>
      ) : (
        <form onSubmit={encaisser}>
          <fieldset style={{ border: 0, padding: 0, margin: "0 0 1rem" }}>
            <legend className="field__label">{t("guichet.mode_reglement", langue)}</legend>
            <div className="paire-boutons">
              {MODES.map((carte) => {
                const coupe = carte.rails !== null && ecole[carte.rails] === false;
                return (
                  <button
                    type="button"
                    key={carte.cle}
                    className={`bouton-mode${mode === carte.cle ? " is-choisi" : ""}`}
                    onClick={() => setMode(carte.cle)}
                    disabled={coupe}
                    title={coupe ? t("guichet.rail_cope", langue) : undefined}
                  >
                    {t(carte.cle_libelle, langue)}
                    <small>{coupe ? t("guichet.cope", langue) : t(carte.cle_aide, langue)}</small>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {message ? (
            <p className="notice notice--error" role="alert" style={{ marginBottom: "1rem" }}>
              {message}
            </p>
          ) : null}

          <div className="field aide-chiffre">
            <label htmlFor="montant">{t("guichet.montant", langue)}</label>
            <input
              id="montant"
              type="text"
              inputMode="numeric"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              className="money"
              required
            />
            <span className="aide-chiffre__unite">FCFA</span>
            <span className="field__aide">
              {t("guichet.reste_du", langue, { montant: fcfa(eleve.reste) })}
              {trop ? t("guichet.trop", langue) : ""}
            </span>
          </div>

          <div className="presets" style={{ marginBlock: "0.7rem" }}>
            {[
              { cle: "terme", valeur: premiere ? premiere.reste : eleve.reste },
              { cle: "tout", valeur: eleve.reste },
              { cle: "moitié", valeur: Math.round(eleve.reste / 2) },
            ].map((preset) =>
              preset.valeur > 0 ? (
                <button
                  type="button"
                  key={preset.cle}
                  onClick={() => setMontant(String(preset.valeur))}
                >
                  {preset.cle === "terme"
                    ? `${t("guichet.preset_terme", langue)} · ${fcfa(preset.valeur)}`
                    : preset.cle === "tout"
                      ? `${t("guichet.preset_tout", langue)} · ${fcfa(preset.valeur)}`
                      : `${t("guichet.preset_demi", langue)} · ${fcfa(preset.valeur)}`}
                </button>
              ) : null,
            )}
          </div>

          {!AUCUNE_REFERENCE.includes(mode) ? (
            <div className="field" style={{ marginTop: "1rem" }}>
              <label htmlFor="reference">
                {mode === "cheque" ? t("guichet.reference_cheque", langue) : t("guichet.reference_momo", langue)}
              </label>
              <input
                id="reference"
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={mode === "cheque" ? t("guichet.ph_cheque", langue) : t("guichet.ph_momo", langue)}
                maxLength={40}
              />
            </div>
          ) : null}

          <div className="field" style={{ marginTop: "1rem" }}>
            <label htmlFor="note">{t("guichet.note", langue)}</label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("guichet.ph_note", langue)}
              maxLength={400}
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn--ink"
              disabled={enCours || valeur <= 0 || trop || eleve.echeances.length === 0}
            >
              {enCours
                ? t("guichet.ecriture", langue)
                : t("guichet.encaisser", langue, { montant: valeur > 0 ? fcfa(valeur) : "" })}
            </button>
            <Link href={`/app/eleves/${eleve.id}`} className="btn btn--quiet">
              {t("guichet.fiche_eleve", langue)}
            </Link>
          </div>

          <MentionDemo langue={langue} />
        </form>
      )}
    </section>
  );
}

function SortieDeReçu({
  recu,
  eleve,
  ecole,
  langue,
  suite,
}: {
  recu: Recu;
  eleve: Eleve;
  ecole: Ecole;
  langue: Langue;
  suite: () => void;
}) {
  const numero = canoniseTelephone(recu.destinataire);
  return (
    <section className="sheet bloc" aria-label={t("guichet.aria_recu", langue)}>
      <div className="reçu-sortie">
        <div className="reçu-sortie__entete">
          <span className="stamp stamp--moss stamp--straight">
            {t("guichet.recu_consigne", langue)}
          </span>
          <span className="mono">{recu.numero}</span>
        </div>

        <p className="recu-public__montant money" style={{ marginTop: "1rem" }}>
          {fcfa(recu.montant)}
        </p>
        <p className="prix__suite">
          {eleve.nom_complet} · {eleve.classe} · {recu.mode_label} ·{" "}
          {recu.statut_label}
        </p>

        <div className="reçu-sortie__corps">{recu.corps}</div>

        <p className="field__aide" style={{ marginTop: "0.9rem" }}>
          {t("guichet.ecrit_sur", langue, { dest: recu.destinataire_display || t("guichet.le_carnet", langue) })}
          {numero ? t("guichet.canal_prevu", langue) : t("guichet.rien_envoyer", langue)}.
          {t("guichet.parent_verifie", langue)}
          <span className="mono">{recu.jeton}</span>.
        </p>

        <div className="form-actions" style={{ marginTop: "1.1rem" }}>
          <button type="button" className="btn btn--ink" onClick={suite}>
            {t("guichet.suivant", langue)}
          </button>
          <Link href={recu.verif_url} className="btn btn--quiet">
            {t("guichet.voir_verif", langue)}
          </Link>
        </div>

        <MentionDemo
          langue={langue}
          texte={t("guichet.demo_sortie", langue, { ecole: ecole.sigle || ecole.nom })}
        />
      </div>
    </section>
  );
}
