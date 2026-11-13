"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icone } from "./icone";
import { MentionDemo } from "./mention-demo";
import { ecrire } from "@/lib/client-api";
import { ErreurComptoir } from "@/lib/errors";
import { canoniseTelephone, telephoneLocal } from "@/lib/format";
import type { Boutique, BoutiqueEntree, Main, Role } from "@/lib/types";

const RAILS = [
  { cle: "especes_actifs" as const, label: "Espèces", aide: "la main à la main au comptoir" },
  { cle: "momo_actif" as const, label: "MTN MoMo", aide: "le repère de la vente est noté" },
  { cle: "orange_actif" as const, label: "Orange Money", aide: "même caisse, autre réseau" },
  { cle: "credit_accorde" as const, label: "À crédit", aide: "à n'ouvrir que si tu sais qui doit" },
];

const ROLES = [
  { cle: "tenancier" as const, label: "Tenancier", texte: "tient le cahier et les réglages" },
  { cle: "vendeur" as const, label: "Vendeur", texte: "écrit les ventes, ne touche pas aux rails" },
  { cle: "livreur" as const, label: "Livreur", texte: "note les sorties et les transports" },
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
}: {
  boutique: Boutique;
  mains: Main[];
  autoriseEquipe: boolean;
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
      setIncident("Le numéro du comptoir n'est pas valide : neuf chiffres après +237.");
      return;
    }
    if (champ.nom.trim().length < 2) {
      setIncident("Le nom du comptoir fait au moins deux lettres.");
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
      setMessage("Les mots du comptoir sont enregistrés.");
      routeur.refresh();
    } catch (erreur) {
      setIncident(
        erreur instanceof ErreurComptoir
          ? erreur.message
          : "Le cahier n'a pas accepté ces réglages.",
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
          ? "Six caractères au minimum pour le mot de passe."
          : "Le nom, l'adresse et le mot de passe sont nécessaires.",
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
      setMessageEquipe(`${creee.nom} tient le comptoir sous ${creee.role_label}.`);
      setMain({ nom: "", email: "", mot: "", role: "vendeur" });
      setNouvelle(false);
      routeur.refresh();
    } catch (erreur) {
      setIncidentEquipe(
        erreur instanceof ErreurComptoir
          ? erreur.message
          : "Le cahier n'a pas retenu ce nom.",
      );
    } finally {
      setEnCoursEquipe(false);
    }
  }

  return (
    <div className="vitre">
      <form className="reglages-form" onSubmit={enregistrer}>
        <fieldset className="jeu-regle" id="comptoir">
          <legend>Le comptoir tel qu&apos;il apparaît sur les feuilles</legend>
          <div className="grille-champs">
            <div className="champ champ--plein">
              <label htmlFor="boutique-nom">Nom du comptoir</label>
              <input
                id="boutique-nom"
                value={champ.nom}
                onChange={texte("nom")}
                maxLength={160}
                required
              />
            </div>
            <div className="champ">
              <label htmlFor="boutique-enseigne">Enseigne</label>
              <input
                id="boutique-enseigne"
                value={champ.enseigne}
                onChange={texte("enseigne")}
                maxLength={40}
                placeholder="Tchuenté"
              />
              <span className="champ__aide">Elle tient dans le bandeau du haut.</span>
            </div>
            <div className="champ">
              <label htmlFor="boutique-ville">Ville</label>
              <input
                id="boutique-ville"
                value={champ.ville}
                onChange={texte("ville")}
                maxLength={60}
              />
            </div>
            <div className="champ">
              <label htmlFor="boutique-quartier">Quartier</label>
              <input
                id="boutique-quartier"
                value={champ.quartier}
                onChange={texte("quartier")}
                maxLength={80}
                placeholder="Ndokoti"
              />
            </div>
            <div className="champ">
              <label htmlFor="boutique-tenancier">Tenancier</label>
              <input
                id="boutique-tenancier"
                value={champ.tenancier}
                onChange={texte("tenancier")}
                maxLength={80}
              />
              <span className="champ__aide">Le nom qui signe les feuilles.</span>
            </div>
            <div className="champ">
              <label htmlFor="boutique-tel">Numéro du comptoir</label>
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
                  ? "Neuf chiffres commençant par 2, 6 ou 7."
                  : "Le numéro que le client rappellera."}
              </span>
            </div>
            <div className="champ">
              <label htmlFor="boutique-abo">Abonnement hebdomadaire</label>
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
                Affiché en pied de page. {boutique.abonnement_hebdo_label} par
                semaine, à régler au bureau de l&apos;agence.
              </span>
            </div>
            <div className="champ champ--plein">
              <label htmlFor="boutique-note">Note du comptoir</label>
              <textarea
                id="boutique-note"
                value={champ.note}
                onChange={texte("note")}
                maxLength={400}
                rows={2}
              />
              <span className="champ__aide">
                {champ.note.length} / 400 caractères.
              </span>
            </div>
          </div>
        </fieldset>

        <fieldset className="jeu-regle" id="rails">
          <legend>Les rails ouverts à la caisse</legend>
          <p className="champ__aide">
            Un rail fermé disparaît des écritures du comptoir. Les ventes déjà
            consignées ne changent pas.
          </p>
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
                  {rail.label}
                  <small>{rail.aide}</small>
                </span>
              </label>
            ))}
          </div>
          <MentionDemo />
        </fieldset>

        <div className="acts">
          <button type="submit" className="bouton bouton--encre" disabled={enCours}>
            {enCours ? "Écriture" : "Enregistrer les réglages"}
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
            Revenir à la version tenue
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

      <section className="feuille bloc" id="mains" aria-label="Les mains du comptoir">
        <div className="tete-feuille">
          <h2>Qui tient le comptoir</h2>
          <span className="tete-feuille__cote">
            {mains.length} main{mains.length > 1 ? "s" : ""}
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
          <p className="champ__aide">
            Seul le tenancier ajoute une main au comptoir. Cette séance est
            ouverte sous un autre rôle : le rayon se lit, l&apos;équipe se
            regarde, rien ne se touche ici.
          </p>
        ) : nouvelle ? (
          <form className="mains-form" onSubmit={inscrire}>
            <div className="champ">
              <label htmlFor="main-nom">Nom</label>
              <input
                id="main-nom"
                value={main.nom}
                onChange={(e) => setMain((actuel) => ({ ...actuel, nom: e.target.value }))}
                maxLength={120}
                required
              />
            </div>
            <div className="champ">
              <label htmlFor="main-email">Adresse</label>
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
              <span className="champ__aide">Elle sert seule de connexion.</span>
            </div>
            <div className="champ">
              <label htmlFor="main-mot">Mot de passe</label>
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
              <span className="champ__titre">Rôle</span>
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
                    {role.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="acts champ--plein">
              <button type="submit" className="bouton bouton--encre" disabled={enCoursEquipe}>
                {enCoursEquipe ? "Inscription" : "Inscrire cette main"}
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
                Annuler
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
            Ajouter une main au comptoir
          </button>
        )}

        <p className="champ__aide" style={{ marginTop: "1rem" }}>
          Le mot de passe oublié se règle pour l&apos;instant au bureau de
          l&apos;agence : la réinitialisation par SMS n&apos;est pas branchée.
        </p>
      </section>
    </div>
  );
}
