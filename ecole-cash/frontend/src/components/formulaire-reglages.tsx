"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ChampTelephone } from "@/components/champ-telephone";
import { Icone } from "@/components/icone";
import { MentionDemo } from "@/components/mention-demo";
import { ecrire } from "@/lib/client-api";
import { ErreurCaisse } from "@/lib/errors";
import { canoniseTelephone, fcfa } from "@/lib/format";
import type { Ecole, EcoleEntree } from "@/lib/types";

const GENRES = [
  { cle: "maternelle", label: "Maternelle" },
  { cle: "primaire", label: "Primaire" },
  { cle: "secondaire", label: "Secondaire" },
  { cle: "groupe", label: "Groupe scolaire" },
];

const TONS = [
  {
    cle: "courtois" as const,
    label: "Courtois",
    texte: "On rappelle le rendez-vous sans le reprocher. Pour la première relance.",
  },
  {
    cle: "ferme" as const,
    label: "Fermé",
    texte: "On nomme le retard et la date limite. Pour les avis après tolérance.",
  },
];

const RAILS = [
  { cle: "especes_actifs" as const, label: "Espèces", aide: "La main à la main au guichet." },
  { cle: "momo_actif" as const, label: "MTN MoMo", aide: "Le reçu porte le numéro de transaction." },
  { cle: "orange_actif" as const, label: "Orange Money", aide: "Même guichet, autre réseau." },
  { cle: "whatsapp_actif" as const, label: "WhatsApp", aide: "Le canal le plus lu par les parents." },
  { cle: "sms_actif" as const, label: "SMS", aide: "Payant à l'envoi : à n'ouvrir qu'avec un contrat." },
];

function entreeDepuis(ecole: Ecole): EcoleEntree {
  return {
    nom: ecole.nom,
    sigle: ecole.sigle,
    genre: ecole.genre,
    ville: ecole.ville,
    quartier: ecole.quartier,
    direction: ecole.direction,
    comptable: ecole.comptable,
    telephone: ecole.telephone,
    date_rentree: ecole.date_rentree,
    fin_annee: ecole.fin_annee,
    relance_avance: ecole.relance_avance,
    tolerance_retard: ecole.tolerance_retard,
    ton: ecole.ton,
    mention_recu: ecole.mention_recu,
    whatsapp_actif: ecole.whatsapp_actif,
    sms_actif: ecole.sms_actif,
    especes_actifs: ecole.especes_actifs,
    momo_actif: ecole.momo_actif,
    orange_actif: ecole.orange_actif,
  };
}

export function FormulaireReglages({
  ecole,
  telephoneLocal,
}: {
  ecole: Ecole;
  telephoneLocal: string;
}) {
  const routeur = useRouter();
  const [champ, setChamp] = useState<EcoleEntree>(() => entreeDepuis(ecole));
  const [saisie, setSaisie] = useState(telephoneLocal);
  const [message, setMessage] = useState<string | null>(null);
  const [incident, setIncident] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  function change(
    cle: "nom" | "sigle" | "ville" | "quartier" | "direction" | "comptable" | "mention_recu" | "date_rentree" | "fin_annee",
  ) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setChamp((actuel) => ({ ...actuel, [cle]: event.target.value }));
  }

  function changeNombre(cle: "relance_avance" | "tolerance_retard") {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setChamp((actuel) => ({
        ...actuel,
        [cle]: Number.parseInt(event.target.value.replace(/\D/g, ""), 10) || 0,
      }));
  }

  function basculer(cle: "whatsapp_actif" | "sms_actif" | "especes_actifs" | "momo_actif" | "orange_actif") {
    return () =>
      setChamp((actuel) => ({ ...actuel, [cle]: !actuel[cle] }));
  }

  const rappelTropTard = champ.relance_avance >= champ.tolerance_retard;
  const finTropTot = champ.fin_annee <= champ.date_rentree;
  const nomTropCourt = champ.nom.trim().length < 2;

  async function enregistrer(event: React.FormEvent) {
    event.preventDefault();
    const canonique = champ.telephone.trim() === "" ? "" : canoniseTelephone(champ.telephone);
    if (champ.telephone.trim() !== "" && canonique === null) {
      setIncident("Le numéro de l'école n'est pas valide : neuf chiffres après +237.");
      return;
    }
    if (rappelTropTard || finTropTot || nomTropCourt) {
      setIncident(
        nomTropCourt
          ? "Le nom de l'école fait au moins deux lettres."
          : finTropTot
            ? "La fin d'année vient après la rentrée."
            : "Le rappel avant échéance doit tomber avant le premier avis de retard.",
      );
      return;
    }
    setEnCours(true);
    setMessage(null);
    setIncident(null);
    try {
      await ecrire<Ecole>("/settings", {
        method: "PUT",
        body: { ...champ, telephone: canonique },
      });
      setMessage("Les mots de l'école sont enregistrés.");
      routeur.refresh();
    } catch (erreur) {
      setIncident(
        erreur instanceof ErreurCaisse ? erreur.message : "Le registre n'a pas accepté la page.",
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form className="reglages-form" onSubmit={enregistrer}>
      <fieldset className="regle-jeu" id="ecole">
        <legend>L&apos;école telle qu&apos;elle apparaît sur les feuilles</legend>
        <div className="form-grid">
          <div className="field field--full">
            <label htmlFor="nom">Nom de l&apos;école</label>
            <input
              id="nom"
              value={champ.nom}
              onChange={change("nom")}
              maxLength={160}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="sigle">Sigle</label>
            <input
              id="sigle"
              value={champ.sigle}
              onChange={change("sigle")}
              maxLength={24}
              placeholder="ECE"
            />
            <span className="field__aide">Il tient dans le coin du reçu.</span>
          </div>
          <div className="field">
            <label htmlFor="genre">Genre</label>
            <select
              id="genre"
              value={GENRES.some((un) => un.cle === champ.genre) ? champ.genre : "primaire"}
              onChange={(event) =>
                setChamp((actuel) => ({ ...actuel, genre: event.target.value }))
              }
            >
              {GENRES.map((un) => (
                <option key={un.cle} value={un.cle}>
                  {un.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="ville">Ville</label>
            <input id="ville" value={champ.ville} onChange={change("ville")} maxLength={60} />
          </div>
          <div className="field">
            <label htmlFor="quartier">Quartier</label>
            <input
              id="quartier"
              value={champ.quartier}
              onChange={change("quartier")}
              maxLength={80}
            />
          </div>
          <div className="field">
            <label htmlFor="direction">Direction</label>
            <input
              id="direction"
              value={champ.direction}
              onChange={change("direction")}
              maxLength={80}
              placeholder="Nom de la directrice"
            />
            <span className="field__aide">Signature du reçu.</span>
          </div>
          <div className="field">
            <label htmlFor="comptable">Comptable</label>
            <input
              id="comptable"
              value={champ.comptable}
              onChange={change("comptable")}
              maxLength={80}
              placeholder="Nom de la caissière"
            />
            <span className="field__aide">Celui qui tient la caisse du jour.</span>
          </div>
          <ChampTelephone
            id="telephone-ecole"
            label="Numéro de l'école"
            value={saisie}
            onChange={(valeur) => {
              setSaisie(valeur);
              setChamp((actuel) => ({ ...actuel, telephone: valeur }));
            }}
            aide="Le numéro que le parent peut rappeler au bas du reçu."
          />
        </div>
      </fieldset>

      <fieldset className="regle-jeu" id="calendrier">
        <legend>Le calendrier de l&apos;année</legend>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="rentree">Rentrée</label>
            <input
              id="rentree"
              type="date"
              value={champ.date_rentree}
              onChange={change("date_rentree")}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="fin">Fin d&apos;année</label>
            <input
              id="fin"
              type="date"
              value={champ.fin_annee}
              onChange={change("fin_annee")}
              required
              aria-invalid={finTropTot || undefined}
            />
            {finTropTot ? (
              <span className="field__aide field__aide--tard">
                Elle doit tomber après la rentrée.
              </span>
            ) : null}
          </div>
        </div>
        <p className="regle-note">
          L&apos;année scolaire va de septembre à août. Le change d&apos;année ne
          se règle pas ici : il suit ces deux dates. Année en cours :{" "}
          <strong className="mono">{ecole.annee}</strong>.
        </p>
      </fieldset>

      <fieldset className="regle-jeu" id="ton">
        <legend>Le ton et les délais de relance</legend>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="avance">Rappel avant échéance (jours)</label>
            <input
              id="avance"
              type="text"
              inputMode="numeric"
              value={champ.relance_avance}
              onChange={changeNombre("relance_avance")}
              maxLength={2}
            />
            <span className="field__aide">
              Le parent est prévenu {champ.relance_avance} jour
              {champ.relance_avance > 1 ? "s" : ""} avant le terme.
            </span>
          </div>
          <div className="field">
            <label htmlFor="tolerance">Tolérance avant avis de retard (jours)</label>
            <input
              id="tolerance"
              type="text"
              inputMode="numeric"
              value={champ.tolerance_retard}
              onChange={changeNombre("tolerance_retard")}
              maxLength={3}
              aria-invalid={rappelTropTard || undefined}
            />
            <span
              className={
                rappelTropTard
                  ? "field__aide field__aide--tard"
                  : "field__aide"
              }
            >
              {rappelTropTard
                ? "Le rappel doit tomber avant le premier avis de retard."
                : `Le retard est annoncé ${champ.tolerance_retard} jours après le terme.`}
            </span>
          </div>
        </div>
        <div className="tons">
          {TONS.map((un) => (
            <label className={`ton${champ.ton === un.cle ? " ton--choisi" : ""}`} key={un.cle}>
              <input
                type="radio"
                name="ton"
                value={un.cle}
                checked={champ.ton === un.cle}
                onChange={() => setChamp((actuel) => ({ ...actuel, ton: un.cle }))}
              />
              <span className="ton__marque" aria-hidden="true" />
              <span className="ton__texte">
                <strong>{un.label}</strong>
                <small>{un.texte}</small>
              </span>
            </label>
          ))}
        </div>
        <div className="field field--full">
          <label htmlFor="mention">Mention imprimée au bas du reçu</label>
          <textarea
            id="mention"
            value={champ.mention_recu}
            onChange={change("mention_recu")}
            maxLength={400}
            rows={3}
            placeholder="Merci de conserver ce reçu. Il prouve le versement."
          />
          <span className="field__aide">{champ.mention_recu.length} / 400 caractères.</span>
        </div>
      </fieldset>

      <fieldset className="regle-jeu" id="rails">
        <legend>Les rails ouverts au guichet</legend>
        <p className="regle-note">
          Un rail fermé disparaît des boutons d&apos;encaissement. Les reçus déjà
          partis ne changent pas.
        </p>
        <div className="rails">
          {RAILS.map((un) => (
            <label className="check" key={un.cle}>
              <input
                type="checkbox"
                checked={champ[un.cle]}
                onChange={basculer(un.cle)}
              />
              <span className="check__box" aria-hidden="true" />
              <span className="check__text">
                {un.label}
                <small>{un.aide}</small>
              </span>
            </label>
          ))}
        </div>
        <MentionDemo />
      </fieldset>

      <div className="form-actions">
        <button type="submit" className="btn btn--ink" disabled={enCours}>
          {enCours ? "Écriture" : "Enregistrer les réglages"}
          <span className="btn__fleche" aria-hidden="true">
            <Icone nom="check" taille={15} />
          </span>
        </button>
        <button
          type="button"
          className="btn btn--quiet"
          onClick={() => {
            setChamp(entreeDepuis(ecole));
            setSaisie(telephoneLocal);
            setMessage(null);
            setIncident(null);
          }}
          disabled={enCours}
        >
          Revenir à la version enregistrée
        </button>
      </div>

      {message ? (
        <p className="notice notice--success" role="status">
          {message} Abonnement en cours : {fcfa(ecole.abonnement)} pour l&apos;année,
          à régler au bureau de l&apos;agence.
        </p>
      ) : null}
      {incident ? (
        <p className="notice notice--error" role="alert">
          {incident}
        </p>
      ) : null}
    </form>
  );
}
