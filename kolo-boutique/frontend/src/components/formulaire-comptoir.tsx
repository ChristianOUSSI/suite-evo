"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icone } from "./icone";
import { MentionDemo } from "./mention-demo";
import { ecrire } from "@/lib/client-api";
import { ErreurComptoir } from "@/lib/errors";
import { canoniseTelephone, telephoneLocal } from "@/lib/format";
import { t, LANGUE_DEFAUT, type Langue } from "@/lib/langue";
import type { Boutique, BoutiqueEntree, Main, Role } from "@/lib/types";

const RAILS = [
  { cle: "especes_actifs" as const, labelCle: "vente.rail-especes", aideCle: "reglages-form.rail-especes-aide" },
  { cle: "momo_actif" as const, labelCle: null, aideCle: "reglages-form.rail-momo-aide" },
  { cle: "orange_actif" as const, labelCle: null, aideCle: "reglages-form.rail-orange-aide" },
  { cle: "credit_accorde" as const, labelCle: "vente.rail-credit", aideCle: "reglages-form.rail-credit-aide" },
];

const LABEL_RAIL: Record<string, string> = {
  momo_actif: "MTN MoMo",
  orange_actif: "Orange Money",
};

const ROLES = [
  { cle: "tenancier" as const, labelCle: "reglages-form.role-tenancier", texteCle: "reglages-form.role-tenancier-texte" },
  { cle: "vendeur" as const, labelCle: "reglages-form.role-vendeur", texteCle: "reglages-form.role-vendeur-texte" },
  { cle: "livreur" as const, labelCle: "reglages-form.role-livreur", texteCle: "reglages-form.role-livreur-texte" },
];

function entreeDepuis(boutique: Boutique): BoutiqueEntree {
  return {
    nom: boutique.nom,
    enseigne: boutique.enseigne,
    quartier: boutique.quartier,
    ville: boutique.ville,
    tenancier: boutique.tenancier,
    telephone: boutique.telephone,
    abonnement_hebdo: boutique.abonnement_hebdo,
    especes_actifs: boutique.especes_actifs,
    momo_actif: boutique.momo_actif,
    orange_actif: boutique.orange_actif,
    credit_accorde: boutique.credit_accorde,
    note: boutique.note,
  };
}

export function FormulaireComptoir({
  boutique,
  mains,
  autoriseEquipe,
  langue = LANGUE_DEFAUT,
}: {
  boutique: Boutique;
  mains: Main[];
  autoriseEquipe: boolean;
  langue?: Langue;
}) {
  const routeur = useRouter();
  const [champ, setChamp] = useState<BoutiqueEntree>(() => entreeDepuis(boutique));
  const [saisie, setSaisie] = useState(telephoneLocal(boutique.telephone));
  const [message, setMessage] = useState<string | null>(null);
  const [incident, setIncident] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const [nouvelle, setNouvelle] = useState(false);
  const [main, setMain] = useState<{
    nom: string;
    email: string;
    mot: string;
    role: Role;
  }>({ nom: "", email: "", mot: "", role: "vendeur" });
  const [messageEquipe, setMessageEquipe] = useState<string | null>(null);
  const [incidentEquipe, setIncidentEquipe] = useState<string | null>(null);
  const [enCoursEquipe, setEnCoursEquipe] = useState(false);

  const numeroInvalide =
    saisie.trim() !== "" && canoniseTelephone(saisie) === null;

  function texte(
    cle: "nom" | "enseigne" | "quartier" | "ville" | "tenancier" | "note",
  ) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setChamp((actuel) => ({ ...actuel, [cle]: e.target.value }));
  }

  function basculer(
    cle: "especes_actifs" | "momo_actif" | "orange_actif" | "credit_accorde",
  ) {
    return () => setChamp((actuel) => ({ ...actuel, [cle]: !actuel[cle] }));
  }

  async function enregistrer(evenement: React.FormEvent) {
    evenement.preventDefault();
    const canonique =
      champ.telephone.trim() === "" ? "" : canoniseTelephone(champ.telephone);
    if (champ.telephone.trim() !== "" && canonique === null) {
      setIncident(t("reglages-form.incident-tel", langue));
      return;
    }
    if (champ.nom.trim().length < 2) {
      setIncident(t("reglages-form.incident-nom", langue));
      return;
    }
    setEnCours(true);
    setMessage(null);
    setIncident(null);
    try {
      await ecrire<Boutique>("/boutique", {
        method: "PUT",
        body: { ...champ, telephone: canonique },
      });
      setMessage(t("reglages-form.message", langue));
      routeur.refresh();
    } catch (erreur) {
      setIncident(
        erreur instanceof ErreurComptoir
          ? erreur.message
          : t("reglages-form.incident", langue),
      );
    } finally {
      setEnCours(false);
    }
  }

  async function inscrire(evenement: React.FormEvent) {
    evenement.preventDefault();
    if (main.nom.trim().length < 2 || main.email.trim() === "" || main.mot.length < 6) {
      setIncidentEquipe(
        main.mot.length < 6
          ? t("reglages-form.incident-mot", langue)
          : t("reglages-form.incident-champs", langue),
      );
      return;
    }
    setEnCoursEquipe(true);
    setMessageEquipe(null);
    setIncidentEquipe(null);
    try {
      const creee = await ecrire<Main>("/mains", {
        body: {
          nom: main.nom.trim(),
          email: main.email.trim(),
          mot_de_passe: main.mot,
          role: main.role,
        },
      });
      setMessageEquipe(t("reglages-form.message-equipe", langue, { nom: creee.nom, role: creee.role_label }));
      setMain({ nom: "", email: "", mot: "", role: "vendeur" });
      setNouvelle(false);
      routeur.refresh();
    } catch (erreur) {
      setIncidentEquipe(
        erreur instanceof ErreurComptoir
          ? erreur.message
          : t("reglages-form.incident-equipe", langue),
      );
    } finally {
      setEnCoursEquipe(false);
    }
  }

  return (
    <div className="vitre">
      <form className="reglages-form" onSubmit={enregistrer}>
        <fieldset className="jeu-regle" id="comptoir">
          <legend>{t("reglages-form.legend-comptoir", langue)}</legend>
          <div className="grille-champs">
            <div className="champ champ--plein">
              <label htmlFor="boutique-nom">{t("reglages-form.nom", langue)}</label>
              <input
                id="boutique-nom"
                value={champ.nom}
                onChange={texte("nom")}
                maxLength={160}
                required
              />
            </div>
            <div className="champ">
              <label htmlFor="boutique-enseigne">{t("reglages-form.enseigne", langue)}</label>
              <input
                id="boutique-enseigne"
                value={champ.enseigne}
                onChange={texte("enseigne")}
                maxLength={40}
                placeholder="Tchuenté"
              />
              <span className="champ__aide">{t("reglages-form.enseigne-aide", langue)}</span>
            </div>
            <div className="champ">
              <label htmlFor="boutique-ville">{t("reglages-form.ville", langue)}</label>
              <input
                id="boutique-ville"
                value={champ.ville}
                onChange={texte("ville")}
                maxLength={60}
              />
            </div>
            <div className="champ">
              <label htmlFor="boutique-quartier">{t("reglages-form.quartier", langue)}</label>
              <input
                id="boutique-quartier"
                value={champ.quartier}
                onChange={texte("quartier")}
                maxLength={80}
                placeholder="Ndokoti"
              />
            </div>
            <div className="champ">
              <label htmlFor="boutique-tenancier">{t("reglages-form.tenancier", langue)}</label>
              <input
                id="boutique-tenancier"
                value={champ.tenancier}
                onChange={texte("tenancier")}
                maxLength={80}
              />
              <span className="champ__aide">{t("reglages-form.tenancier-aide", langue)}</span>
            </div>
            <div className="champ">
              <label htmlFor="boutique-tel">{t("reglages-form.tel", langue)}</label>
              <span className="champ__prefixe">
                <span aria-hidden="true">+237</span>
                <input
                  id="boutique-tel"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  value={saisie}
                  onChange={(e) => {
                    setSaisie(e.target.value);
                    setChamp((actuel) => ({ ...actuel, telephone: e.target.value }));
                  }}
                  placeholder="6 99 10 45 22"
                  aria-invalid={numeroInvalide || undefined}
                />
              </span>
              <span className="champ__aide">
                {numeroInvalide
                  ? t("reglages-form.tel-invalide", langue)
                  : t("reglages-form.tel-valide", langue)}
              </span>
            </div>
            <div className="champ">
              <label htmlFor="boutique-abo">{t("reglages-form.abo", langue)}</label>
              <input
                id="boutique-abo"
                inputMode="numeric"
                value={champ.abonnement_hebdo}
                onChange={(e) =>
                  setChamp((actuel) => ({
                    ...actuel,
                    abonnement_hebdo:
                      Number.parseInt(e.target.value.replace(/\D/g, ""), 10) || 0,
                  }))
                }
              />
              <span className="champ__aide">
                {t("reglages-form.abo-aide", langue, { label: boutique.abonnement_hebdo_label })}
              </span>
            </div>
            <div className="champ champ--plein">
              <label htmlFor="boutique-note">{t("reglages-form.note", langue)}</label>
              <textarea
                id="boutique-note"
                value={champ.note}
                onChange={texte("note")}
                maxLength={400}
                rows={2}
              />
              <span className="champ__aide">
                {t("reglages-form.note-compte", langue, { n: champ.note.length })}
              </span>
            </div>
          </div>
        </fieldset>

        <fieldset className="jeu-regle" id="rails">
          <legend>{t("reglages-form.legend-rails", langue)}</legend>
          <p className="champ__aide">{t("reglages-form.rails-aide", langue)}</p>
          <div className="rails">
            {RAILS.map((rail) => (
              <label className="cochet" key={rail.cle}>
                <input
                  type="checkbox"
                  checked={champ[rail.cle]}
                  onChange={basculer(rail.cle)}
                />
                <span className="cochet__box" aria-hidden="true" />
                <span className="cochet__texte">
                  {rail.labelCle ? t(rail.labelCle, langue) : LABEL_RAIL[rail.cle]}
                  <small>{t(rail.aideCle, langue)}</small>
                </span>
              </label>
            ))}
          </div>
          <MentionDemo langue={langue} />
        </fieldset>

        <div className="acts">
          <button type="submit" className="bouton bouton--encre" disabled={enCours}>
            {enCours ? t("rayon-console.ecriture", langue) : t("reglages-form.enregistrer", langue)}
            <span className="bouton__fleche">
              <Icone nom="check" taille={15} />
            </span>
          </button>
          <button
            type="button"
            className="bouton bouton--doux"
            onClick={() => {
              setChamp(entreeDepuis(boutique));
              setSaisie(telephoneLocal(boutique.telephone));
              setMessage(null);
              setIncident(null);
            }}
            disabled={enCours}
          >
            {t("reglages-form.revenir", langue)}
          </button>
        </div>

        {message ? (
          <p className="note-bas note-bas--tenu" role="status">
            {message}
          </p>
        ) : null}
        {incident ? (
          <p className="note-bas note-bas--tard" role="alert">
            {incident}
          </p>
        ) : null}
      </form>

      <section className="feuille bloc" id="mains" aria-label={t("reglages-form.aria-mains", langue)}>
        <div className="tete-feuille">
          <h2>{t("reglages-form.mains-titre", langue)}</h2>
          <span className="tete-feuille__cote">
            {t("reglages-form.mains-cote", langue, { n: mains.length })}
          </span>
        </div>

        <ul className="mains-liste">
          {mains.map((un) => (
            <li className="mains-ligne" key={un.id}>
              <span className="avatar" aria-hidden="true">
                {un.nom.slice(0, 1).toUpperCase()}
              </span>
              <span className="mains-texte">
                {un.nom}
                <small className="mono">{un.email}</small>
              </span>
              <span className="etiquette etiquette--douce">{un.role_label}</span>
            </li>
          ))}
        </ul>

        {messageEquipe ? (
          <p className="note-bas note-bas--tenu" role="status">
            {messageEquipe}
          </p>
        ) : null}
        {incidentEquipe ? (
          <p className="note-bas note-bas--tard" role="alert">
            {incidentEquipe}
          </p>
        ) : null}

        {!autoriseEquipe ? (
          <p className="champ__aide">{t("reglages-form.equipe-aide", langue)}</p>
        ) : nouvelle ? (
          <form className="mains-form" onSubmit={inscrire}>
            <div className="champ">
              <label htmlFor="main-nom">{t("reglages-form.nom-main", langue)}</label>
              <input
                id="main-nom"
                value={main.nom}
                onChange={(e) => setMain((actuel) => ({ ...actuel, nom: e.target.value }))}
                maxLength={120}
                required
              />
            </div>
            <div className="champ">
              <label htmlFor="main-email">{t("reglages-form.adresse", langue)}</label>
              <input
                id="main-email"
                type="email"
                autoComplete="off"
                value={main.email}
                onChange={(e) =>
                  setMain((actuel) => ({ ...actuel, email: e.target.value }))
                }
                maxLength={160}
                required
              />
              <span className="champ__aide">{t("reglages-form.adresse-aide", langue)}</span>
            </div>
            <div className="champ">
              <label htmlFor="main-mot">{t("reglages-form.mot-main", langue)}</label>
              <input
                id="main-mot"
                type="password"
                autoComplete="new-password"
                value={main.mot}
                onChange={(e) => setMain((actuel) => ({ ...actuel, mot: e.target.value }))}
                minLength={6}
                maxLength={120}
                required
              />
            </div>
            <div className="champ">
              <span className="champ__titre">{t("reglages-form.role", langue)}</span>
              <div className="dictee__exemples">
                {ROLES.map((role) => (
                  <button
                    type="button"
                    key={role.cle}
                    className="dictee__exemple"
                    style={
                      main.role === role.cle
                        ? { borderColor: "var(--encre)", color: "var(--encre)" }
                        : undefined
                    }
                    onClick={() =>
                      setMain((actuel) => ({ ...actuel, role: role.cle }))
                    }
                  >
                    {t(role.labelCle, langue)}
                  </button>
                ))}
              </div>
            </div>
            <div className="acts champ--plein">
              <button type="submit" className="bouton bouton--encre" disabled={enCoursEquipe}>
                {enCoursEquipe ? t("reglages-form.inscription", langue) : t("reglages-form.inscrire", langue)}
                <span className="bouton__fleche">
                  <Icone nom="rond" taille={15} />
                </span>
              </button>
              <button
                type="button"
                className="bouton bouton--doux"
                onClick={() => {
                  setNouvelle(false);
                  setIncidentEquipe(null);
                }}
              >
                {t("reglages-form.annuler", langue)}
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            className="bouton bouton--petit"
            onClick={() => {
              setNouvelle(true);
              setIncidentEquipe(null);
            }}
          >
            {t("reglages-form.ajouter-main", langue)}
          </button>
        )}

        <p className="champ__aide" style={{ marginTop: "1rem" }}>
          {t("reglages-form.mot-aide", langue)}
        </p>
      </section>
    </div>
  );
}
