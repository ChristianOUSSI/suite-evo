import Link from "next/link";
import type { Metadata } from "next";
import { Dictee } from "@/components/dictee";
import { Semaines } from "@/components/semaines";
import { lire } from "@/lib/api";
import { fcfa } from "@/lib/format";
import { seance } from "@/lib/session";
import type { Tableau } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Tableau du matin',
};

export default async function Matin() {
  await seance();
  const tableau = await lire<Tableau>("/dashboard");

  return (
    <>
      <header className="entete-page">
        <div>
          <h1>Tableau du matin</h1>
          <p className="note">
            {tableau.day}. Ce que le standard a tenu pendant la nuit et ce qui
            attend au guichet.
          </p>
        </div>
        <span className="temoignage">
          <span className="feu" /> Démo, appels simulés
        </span>
      </header>

      <section className="panneaux">
        <div className="panneau">
          <h2>La journée qui commence</h2>
          <div className="compteurs">
            <div className="compteur">
              <b className="chiffre">{tableau.calls_today}</b>
              <span>appels depuis minuit</span>
            </div>
            <div className="compteur mousse">
              <b className="chiffre">{tableau.calls_by_voice}</b>
              <span>tenus par la voix</span>
            </div>
            <div className="compteur ambre">
              <b className="chiffre">{tableau.share_voice}%</b>
              <span>part de la voix</span>
            </div>
            <div className="compteur">
              <b className="chiffre">{tableau.minutes_saved}</b>
              <span>minutes non tenues au téléphone</span>
            </div>
          </div>
          <p className="note" style={{ marginTop: 14 }}>
            Hier : {tableau.calls_yesterday} appels, {tableau.voice_yesterday}{" "}
            tenus par la voix.
          </p>
          <Semaines barres={tableau.week} />
          <p className="note" style={{ marginTop: 12 }}>
            Sept jours : {tableau.week_calls} appels,{" "}
            {tableau.week_saturations}{" "}
            {tableau.week_saturations === 1
              ? "ligne saturée"
              : "lignes saturées"}
            , {tableau.week_english} appels en anglais,{" "}
            {fcfa(tableau.week_sms_cost)} de SMS à la caisse. Le plus fort
            passage est à {tableau.rush.hour}
            {tableau.rush.touches.length > 0 &&
              `, touches ${tableau.rush.touches
                .map((touche) => touche.digit)
                .join(", ")}`}
            .
          </p>
        </div>

        <div className="panneau">
          <h2>Plaque des postes</h2>
          <div className="plaque">
            {tableau.lines.map((poste) => (
              <div className="ligne-poste" key={poste.id}>
                <div>
                  <div className="nom">{poste.label}</div>
                  <div className="detail">
                    {poste.number_display}
                    {poste.human ? "" : " · tenu par la voix"}
                  </div>
                </div>
                <div className="etat">
                  <div className={poste.open ? "ouvert" : "ferme"}>
                    {poste.open ? "décroche" : "fermé"}
                  </div>
                  <div className="detail">{poste.today}</div>
                  {!poste.open && (
                    <div className="detail">reprise {poste.next_label}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {tableau.closures.length > 0 && (
            <p className="note" style={{ marginTop: 14 }}>
              Prochaine fermeture : {tableau.closures[0].period},{" "}
              {tableau.closures[0].reason}.
            </p>
          )}
          {tableau.next_holiday && (
            <p className="note" style={{ marginTop: 6 }}>
              Prochain jour férié du calendrier camerounais :{" "}
              {tableau.next_holiday.label}, dans {tableau.next_holiday.days_away}{" "}
              {tableau.next_holiday.days_away > 1 ? "jours" : "jour"}. Il n'est
              pas encore posé dans les fermetures.
            </p>
          )}
        </div>
      </section>

      <section className="panneaux" style={{ marginTop: 22 }}>
        <div className="panneau">
          <h2>
            Dernières fiches d'appel ·{" "}
            <Link className="lien-fiche" href="/journal">
              tout le journal
            </Link>
          </h2>
          <table className="tableau">
            <thead>
              <tr>
                <th scope="col">Heure</th>
                <th scope="col">Appelant</th>
                <th scope="col">Poste</th>
                <th scope="col">Issue</th>
                <th scope="col" className="droite">
                  Durée
                </th>
              </tr>
            </thead>
            <tbody>
              {tableau.recent_calls.map((appel) => (
                <tr key={appel.id}>
                  <td className="mono">{appel.clock}</td>
                  <td>
                    {appel.caller_name || "Appelant sans nom"}
                    <div className="detail">{appel.caller_phone_display}</div>
                  </td>
                  <td>{appel.line_label}</td>
                  <td>
                    <span
                      className={`pastille ${
                        appel.outcome === "rendezvous"
                          ? "mousse"
                          : appel.outcome === "message"
                            ? "ambre"
                            : appel.outcome === "raccroche" ||
                              appel.outcome === "hors_horaires"
                              ? "rouille"
                              : ""
                      }`}
                    >
                      {appel.outcome_label}
                    </span>
                  </td>
                  <td className="mono droite">{appel.duration_label}</td>
                </tr>
              ))}
              {tableau.recent_calls.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <p className="vide">Aucun appel enregistré aujourd'hui.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="panneau">
          <h2>À rappeler</h2>
          <div className="compteurs">
            <div className="compteur ambre">
              <b className="chiffre">{tableau.waiting_messages}</b>
              <span>messages en attente</span>
            </div>
            <div className="compteur rouille">
              <b className="chiffre">{tableau.overdue_messages}</b>
              <span>promesses dépassées</span>
            </div>
          </div>
          <p className="note" style={{ marginTop: 12 }}>
            <Link className="lien-fiche" href="/main-courante">
              Ouvrir la main courante
            </Link>
          </p>
          <h2 style={{ marginTop: 22 }}>Places tenues</h2>
          <table className="tableau">
            <tbody>
              {tableau.upcoming.map((place) => (
                <tr key={place.id}>
                  <td>
                    {place.day}
                    <div className="detail mono">
                      {place.clock} · {place.reference}
                    </div>
                  </td>
                  <td className="droite">
                    {place.service_name}
                    <div className="detail">{place.caller_name}</div>
                  </td>
                </tr>
              ))}
              {tableau.upcoming.length === 0 && (
                <tr>
                  <td colSpan={2}>
                    <p className="vide">Rien de retenu pour les deux jours.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panneau" style={{ marginTop: 22 }}>
        <h2>La dernière dictée en entier</h2>
        {tableau.recent_calls[0] ? (
          <Dictee lignes={tableau.recent_calls[0].script} />
        ) : (
          <p className="vide">
            Testez un appel depuis l'écran « Appel testé » pour voir la
            transcription complète.
          </p>
        )}
        <h2 style={{ marginTop: 22 }}>Fiches les plus lues</h2>
        <table className="tableau">
          <thead>
            <tr>
              <th scope="col">Question notée</th>
              <th scope="col">Domaine</th>
              <th scope="col" className="droite">
                Lectures
              </th>
            </tr>
          </thead>
          <tbody>
            {tableau.top_answers.map((fiche) => (
              <tr key={fiche.id}>
                <td>
                  <Link className="lien-fiche" href="/repertoire">
                    {fiche.statement}
                  </Link>
                </td>
                <td>{fiche.area}</td>
                <td className="mono droite">{fiche.hits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
