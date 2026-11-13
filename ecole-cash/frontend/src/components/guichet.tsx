"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { EtiquetteEcheance } from "@/components/etiquettes";
import { Icone } from "@/components/icone";
import { MentionDemo } from "@/components/mention-demo";
import { ecrire } from "@/lib/client-api";
import { ErreurCaisse } from "@/lib/errors";
import { canoniseTelephone, fcfa, pourcentage } from "@/lib/format";
import type { Classe, Ecole, Eleve, Encaissement, Mode, Recu } from "@/lib/types";

const MODES: { cle: Mode; libelle: string; aide: string; rails: keyof Ecole | null }[] = [
  { cle: "especes", libelle: "Espèces", aide: "tiroir", rails: "especes_actifs" },
  { cle: "momo_mtn", libelle: "MoMo MTN", aide: "référence opérateur", rails: "momo_actif" },
  {
    cle: "momo_orange",
    libelle: "Orange Money",
    aide: "référence opérateur",
    rails: "orange_actif",
  },
  { cle: "cheque", libelle: "Chèque", aide: "n° de chéquier", rails: null },
  { cle: "virement", libelle: "Virement", aide: "banque", rails: null },
];

const AUCUNE_REFERENCE: Mode[] = ["especes", "virement"];

export function Guichet({
  eleves,
  classes,
  ecole,
}: {
  eleves: Eleve[];
  classes: Classe[];
  ecole: Ecole;
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
      <section className="sheet bloc" aria-label="Familles à encaisser">
        <div className="section-head">
          <h2>Qui passe au guichet ?</h2>
          <span className="section-head__aside">
            {filtres.length} famille{filtres.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="form-grid form-grid--pair" style={{ marginTop: "1.1rem" }}>
          <div className="field">
            <label htmlFor="guichet-recherche">Nom, prénom ou matricule</label>
            <input
              id="guichet-recherche"
              type="search"
              value={recherche}
              placeholder="Ngo Bell, CP2-2027-004…"
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="guichet-classe">Classe</label>
            <select
              id="guichet-classe"
              value={classeActive}
              onChange={(e) => setClasseActive(e.target.value)}
            >
              <option value="">Toutes les classes</option>
              {classes.map((classe) => (
                <option key={classe.id} value={String(classe.id)}>
                  {classe.label} · {classe.effectif} élèves
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filer" style={{ marginTop: "1.1rem" }}>
          {filtres.length === 0 ? (
            <p className="vide-note">
              Personne ne correspond. Une faute dans le nom, ou l&apos;élève
              n&apos;est pas encore engagé pour {ecole.annee}.
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
                {carte.reste === 0 ? "solde" : fcfa(carte.reste)}
                <small>
                  {carte.reste === 0
                    ? "année réglée"
                    : `${pourcentage(carte.du > 0 ? (carte.rentre / carte.du) * 100 : 0)} réglé`}
                </small>
              </span>
            </button>
          ))}
          {filtres.length > 40 ? (
            <p className="vide-note">
              Les 40 premières sur {filtres.length}. Précisez la classe ou le
              nom.
            </p>
          ) : null}
        </div>
      </section>

      {!eleve ? (
        <section className="sheet bloc" aria-label="Ardoise">
          <div className="empty">
            <Icone nom="monnaie" taille={26} />
            <h3>Choisissez une famille</h3>
            <p>
              L&apos;ardoise s&apos;ouvre à droite : ce qui est dû, ce qui est
              réglé, terme par terme. Puis on encaisse.
            </p>
            <Link href="/app/eleves" className="text-link">
              Voir toutes les familles
            </Link>
          </div>
        </section>
      ) : (
        <FormulaireEncaissement
          key={`${eleve.id}-${eleve.reste}`}
          eleve={eleve}
          ecole={ecole}
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
  surReçu,
}: {
  eleve: Eleve;
  ecole: Ecole;
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
          : "La caisse ne répond pas.",
      );
    } finally {
      setEnCours(false);
    }
  }

  if (recu) {
    return <SortieDeReçu recu={recu} eleve={eleve} ecole={ecole} suite={() => setRecu(null)} />;
  }

  return (
    <section className="sheet bloc" aria-label="Ardoise et encaissement">
      <div className="section-head">
        <h2>{eleve.nom_complet}</h2>
        <span className="section-head__aside">{eleve.classe}</span>
      </div>

      <div className="ligne-ecolee" style={{ marginTop: "1rem" }}>
        <span className="ligne-ecolee__nom mono">{eleve.matricule}</span>
        <span className="ligne-ecolee__valeur">{eleve.tuteur_telephone_display || "aucun numéro"}</span>
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
            <EtiquetteEcheance statut={terme.statut} />
          </div>
        ))}
        {eleve.echeances.length === 0 ? (
          <p className="vide-note">
            Aucune ardoise posée pour {eleve.annee}. Engagement ou classe à
            traiter d&apos;abord.
          </p>
        ) : null}
      </div>

      <hr className="divider divider--ink" style={{ marginBlock: "1.2rem" }} />

      {eleve.reste === 0 ? (
        <div className="notice notice--success">
          L&apos;année est réglée, {fcfa(eleve.du)} encaissés. Rien à encaisser
          de plus : le backend refuserait tout versement.
        </div>
      ) : (
        <form onSubmit={encaisser}>
          <fieldset style={{ border: 0, padding: 0, margin: "0 0 1rem" }}>
            <legend className="field__label">Mode de règlement</legend>
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
                    title={coupe ? "Ce rail est coupé dans les réglages" : undefined}
                  >
                    {carte.libelle}
                    <small>{coupe ? "coupé" : carte.aide}</small>
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
            <label htmlFor="montant">Montant encaissé</label>
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
              Reste dû : {fcfa(eleve.reste)}.
              {trop ? " Ce versement dépasse ce qui est dû." : ""}
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
                    ? `terme · ${fcfa(preset.valeur)}`
                    : preset.cle === "tout"
                      ? `tout · ${fcfa(preset.valeur)}`
                      : `demi · ${fcfa(preset.valeur)}`}
                </button>
              ) : null,
            )}
          </div>

          {!AUCUNE_REFERENCE.includes(mode) ? (
            <div className="field" style={{ marginTop: "1rem" }}>
              <label htmlFor="reference">
                Référence {mode === "cheque" ? "du chèque" : "Mobile Money"}
              </label>
              <input
                id="reference"
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={mode === "cheque" ? "n° 04128 du chéquier" : "MTN6F2C19A0…"}
                maxLength={40}
              />
            </div>
          ) : null}

          <div className="field" style={{ marginTop: "1rem" }}>
            <label htmlFor="note">Observation de caisse</label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Payé par le grand-frère, billet de 10 000 rendu…"
              maxLength={400}
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn--ink"
              disabled={enCours || valeur <= 0 || trop || eleve.echeances.length === 0}
            >
              {enCours ? "Écriture…" : `Encaisser ${valeur > 0 ? fcfa(valeur) : ""}`}
            </button>
            <Link href={`/app/eleves/${eleve.id}`} className="btn btn--quiet">
              Fiche de l&apos;élève
            </Link>
          </div>

          <MentionDemo />
        </form>
      )}
    </section>
  );
}

function SortieDeReçu({
  recu,
  eleve,
  ecole,
  suite,
}: {
  recu: Recu;
  eleve: Eleve;
  ecole: Ecole;
  suite: () => void;
}) {
  const numero = canoniseTelephone(recu.destinataire);
  return (
    <section className="sheet bloc" aria-label="Reçu remis">
      <div className="reçu-sortie">
        <div className="reçu-sortie__entete">
          <span className="stamp stamp--moss stamp--straight">
            Reçu consigné
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
          Écrit sur {recu.destinataire_display || "le carnet"}
          {numero ? " · canal prévu" : " · aucun numéro valide, rien à envoyer"}.
          Le parent peut faire vérifier ce reçu avec le code{" "}
          <span className="mono">{recu.jeton}</span>.
        </p>

        <div className="form-actions" style={{ marginTop: "1.1rem" }}>
          <button type="button" className="btn btn--ink" onClick={suite}>
            Encaisser la famille suivante
          </button>
          <Link href={recu.verif_url} className="btn btn--quiet">
            Voir la page de vérification
          </Link>
        </div>

        <MentionDemo texte={`Démo : le message ci-dessus n'a pas quitté cette machine. ${ecole.sigle || ecole.nom} n'a envoyé aucun WhatsApp.`} />
      </div>
    </section>
  );
}
