import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JournalEcriture } from "@/components/journal-ecriture";
import { RelanceActions } from "@/components/relance-actions";
import { RelanceForm } from "@/components/relance-form";
import { SortieClient } from "@/components/sortie-client";
import { MentionDemo } from "@/components/mention-demo";
import { lireOuRien } from "@/lib/api";
import { formats, lienWhatsApp, nouvelles, retard } from "@/lib/format";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { Fiche } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Customer card" : "Fiche client" };
}

export default async function PageFiche({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);
  const responsable = session.user.role === "responsable";

  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero < 1) {
    notFound();
  }

  const fiche = await lireOuRien<Fiche>(`/clients/${numero}`, langue);
  if (!fiche) {
    notFound();
  }

  const lien = lienWhatsApp(fiche.telephone);
  const ouvertes = fiche.relances.filter((un) => un.statut === "a_faire");
  const closes = fiche.relances.filter((un) => un.statut === "faite");

  return (
    <div className="cadc-gabarit cadc-pile">
      <div className="carnet__tete">
        <span className="cadc-badge cadc-badge--acier">
          {t(`segment.${fiche.segment}`)} · {nouvelles(fiche.derniers_jours, t)}
        </span>
        <h1>{fiche.nom}</h1>
        <p>
          {fiche.quartier ? `${fiche.quartier} · ` : ""}
          {fiche.telephone ? `${fiche.telephone_display} · ${fiche.operateur}` : t("fiche.rien_a_rappeler")}
        </p>
      </div>

      {fiche.note ? (
        <p className="carnet__note">{fiche.note}</p>
      ) : null}

      <div className="carnet__deux">
        <div className="carnet__file">
          <section className="cadc-carte" aria-label={t("fiche.journal")}>
            <div className="cadc-tete">
              <h2>{t("fiche.journal")}</h2>
              <span className="cadc-tete__cote">{fiche.historique.length}</span>
            </div>

            {fiche.historique.length === 0 ? (
              <p className="cadc-note">{t("fiche.journal_vide")}</p>
            ) : (
              <ul className="journal">
                {fiche.historique.map((echange) => (
                  <li className="journal__ligne" key={echange.id}>
                    <span className="journal__date">
                      {f.date(echange.jour)}
                      <br />
                      {f.heure(echange.moment)}
                    </span>
                    <span>
                      <span className="journal__que">
                        <span className="cadc-badge cadc-badge--doux">
                          {t(`type.${echange.type}`)}
                        </span>
                        {echange.montant > 0 ? (
                          <strong className="cadc-ligne__valeur">{f.fcfa(echange.montant)}</strong>
                        ) : null}
                      </span>
                      {echange.note ? (
                        <span className="journal__note">{echange.note}</span>
                      ) : null}
                      {echange.par ? (
                        <span className="cadc-champ__aide">
                          {t("echange.par")} {echange.par}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="cadc-acts" style={{ marginTop: 14 }}>
              <JournalEcriture
                clientId={fiche.id}
                rappelJours={session.entreprise.rappel_jours}
                langue={langue}
              />
            </div>
            <MentionDemo langue={langue} />
          </section>

          <section className="cadc-carte" aria-label={t("nav.relances")}>
            <div className="cadc-tete">
              <h2>{t("nav.relances")}</h2>
              <span className="cadc-tete__cote">{ouvertes.length}</span>
            </div>

            {ouvertes.length === 0 ? (
              <p className="cadc-note">{t("relance.aucune")}</p>
            ) : (
              <div className="file">
                {ouvertes.map((relance) => (
                  <div key={relance.id} className="cadc-pile cadc-pile--serree">
                    <div
                      className={`due${relance.retard > 0 ? " due--retard" : ""}${
                        relance.origine === "devis" ? " due--devis" : ""
                      }`}
                    >
                      <span className="due__rail" aria-hidden />
                      <span>
                        <span className="due__nom">
                          {relance.origine === "devis" && !relance.motif
                            ? t("relance.devis")
                            : relance.motif}
                        </span>
                        <span className="due__motif">
                          {t("relance.due")} {f.jourDate(relance.due_le)}
                        </span>
                      </span>
                      <span className="due__cote">{retard(relance.retard, t)}</span>
                    </div>
                    <RelanceActions relanceId={relance.id} langue={langue} />
                  </div>
                ))}
              </div>
            )}

            {closes.length > 0 ? (
              <>
                <div className="dite" style={{ marginTop: 16 }}>
                  <span>{t("relance.faite")}</span>
                </div>
                <ul className="cadc-liste">
                  {closes.slice(0, 6).map((relance) => (
                    <li className="cadc-ligne" key={relance.id}>
                      <span className="cadc-ligne__nom">
                        {relance.origine === "devis" && !relance.motif
                          ? t("relance.devis")
                          : relance.motif}
                        {relance.note ? <small>{relance.note}</small> : null}
                      </span>
                      <span className="cadc-ligne__valeur">
                        {relance.faite_le ? f.date(relance.faite_le) : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            <div className="cadc-acts" style={{ marginTop: 14 }}>
              <RelanceForm clientId={fiche.id} langue={langue} />
            </div>
          </section>
        </div>

        <div className="carnet__file">
          <section className="cadc-carte" aria-label={t("clients.telephone")}>
            <div className="cadc-tete">
              <h2>{t("clients.telephone")}</h2>
              <span className="cadc-tete__cote">{fiche.operateur}</span>
            </div>
            {fiche.joignable ? (
              <div className="cadc-pile cadc-pile--serree">
                <p className="cadc-stat__valeur">{fiche.telephone_display}</p>
                <div className="cadc-acts">
                  {lien ? (
                    <a
                      className="cadc-bouton cadc-bouton--premier"
                      href={lien}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("fiche.whatsapp")}
                    </a>
                  ) : null}
                  <a className="cadc-bouton" href={`tel:${fiche.telephone}`}>
                    {t("fiche.appeler")}
                  </a>
                </div>
                <p className="cadc-champ__aide">{t("fiche.demo-lien")}</p>
              </div>
            ) : (
              <p className="cadc-note">{t("fiche.rien_a_rappeler")}</p>
            )}

            {fiche.email ? (
              <>
                <div className="dite" style={{ marginTop: 14 }}>
                  <span>{t("clients.email")}</span>
                </div>
                <a href={`mailto:${fiche.email}`} className="cadc-ligne__valeur">
                  {fiche.email}
                </a>
              </>
            ) : null}
          </section>

          <section className="cadc-carte" aria-label={t("clients.titre")}>
            <div className="cadc-tete">
              <h2>{t("clients.dans")}</h2>
            </div>
            <ul className="cadc-liste">
              <li className="cadc-ligne">
                <span className="cadc-ligne__nom">{t("clients.entre_le")}</span>
                <span className="cadc-ligne__valeur">{f.date(fiche.cree_le)}</span>
              </li>
              <li className="cadc-ligne">
                <span className="cadc-ligne__nom">{t("stat.echanges")}</span>
                <span className="cadc-ligne__valeur">{fiche.echanges}</span>
              </li>
              <li className="cadc-ligne">
                <span className="cadc-ligne__nom">{t("clients.quartier")}</span>
                <span className="cadc-ligne__valeur">{fiche.quartier}</span>
              </li>
            </ul>
            <div className="cadc-acts" style={{ marginTop: 12 }}>
              <SortieClient
                clientId={fiche.id}
                actif={fiche.actif}
                langue={langue}
                responsable={responsable}
              />
            </div>
          </section>

          <div className="cadc-acts">
            <Link href="/clients" className="cadc-bouton">
              {t("nav.clients")}
            </Link>
            <Link href="/carnet" className="cadc-bouton cadc-bouton--doux">
              {t("nav.carnet")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
