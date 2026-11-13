import type { Metadata } from "next";
import Link from "next/link";

import { AjoutClient } from "@/components/ajout-client";
import { SortieClient } from "@/components/sortie-client";
import { lire } from "@/lib/api";
import { formats, lienWhatsApp, nouvelles } from "@/lib/format";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeClients } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Customers" : "Les clients" };
}

const SEGMENTS = ["particulier", "revendeur", "grossiste", "institution"] as const;
const SEGMENTS_CONNUS = new Set<string>(SEGMENTS);

export default async function PageClients({
  searchParams,
}: {
  searchParams: Promise<{ texte?: string; segment?: string }>;
}) {
  const session = await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);
  const responsable = session.user.role === "responsable";

  const filtre = await searchParams;
  const texte = (filtre.texte ?? "").slice(0, 60);
  const segment = SEGMENTS_CONNUS.has(filtre.segment ?? "") ? filtre.segment : "";

  const query = new URLSearchParams();
  if (texte) query.set("texte", texte);
  if (segment) query.set("segment", segment);

  const carnet = await lire<ListeClients>(`/clients?${query.toString()}`, langue);

  return (
    <div className="cadc-gabarit cadc-pile">
      <div className="carnet__tete">
        <span className="cadc-badge cadc-badge--acier">
          {t("clients.trouves", { n: carnet.total })}
        </span>
        <h1>{t("clients.titre")}</h1>
        <p>{t("clients.chapo")}</p>
      </div>

      <form className="cadc-carte recherche" method="get" action="/clients">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("clients.recherche")}</span>
          <input
            name="texte"
            defaultValue={texte}
            maxLength={60}
            autoComplete="off"
            placeholder={langue === "en" ? "Ondoua, 6 99, Deido" : "Ondoua, 6 99, Deido"}
            aria-label={t("clients.recherche")}
          />
          <span className="cadc-champ__aide">{t("clients.recherche-aide")}</span>
        </label>

        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("clients.segment")}</span>
          <select name="segment" defaultValue={segment ?? ""}>
            <option value="">{langue === "en" ? "All segments" : "Tous les segments"}</option>
            {SEGMENTS.map((un) => (
              <option key={un} value={un}>
                {t(`segment.${un}`)}
              </option>
            ))}
          </select>
        </label>

        <div className="cadc-acts">
          <button type="submit" className="cadc-bouton cadc-bouton--premier">
            {t("clients.recherche")}
          </button>
          {texte || segment ? (
            <Link href="/clients" className="cadc-bouton cadc-bouton--doux">
              {langue === "en" ? "Clear" : "Effacer"}
            </Link>
          ) : null}
        </div>
      </form>

      {responsable ? (
        <section className="cadc-carte" aria-label={t("clients.nouveau")}>
          <div className="cadc-tete">
            <h2>{t("clients.nouveau")}</h2>
          </div>
          <AjoutClient langue={langue} ville={session.entreprise.ville} />
        </section>
      ) : null}

      {carnet.clients.length === 0 ? (
        <p className="cadc-vide">
          <h3>{t("clients.vide")}</h3>
        </p>
      ) : (
        <div className="cartes">
          {carnet.clients.map((client) => {
            const lien = lienWhatsApp(client.telephone);
            return (
              <article
                key={client.id}
                className={`carte-client${client.actif ? "" : " carte-client--sortie"}${
                  client.actif && (client.derniers_jours === null || client.derniers_jours >= session.entreprise.silence_jours)
                    ? " carte-client--oubliee"
                    : ""
                }${!client.actif || !client.joignable ? " carte-client--muette" : ""}`}
              >
                <div className="carte-client__tete">
                  <span className="carte-client__nom">
                    <Link href={`/clients/${client.id}`}>{client.nom}</Link>
                    <small>
                      {[client.quartier, client.telephone_display, client.operateur]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  </span>
                  <span className="cadc-badge cadc-badge--doux">
                    {t(`segment.${client.segment}`)}
                  </span>
                </div>

                {client.note ? (
                  <p className="cadc-champ__aide">{client.note}</p>
                ) : null}

                <div className="carte-client__ligne">
                  <span className="cadc-ligne__nom">
                    {client.dernier_type ? t(`type.${client.dernier_type}`) : t("fiche.jamais")}
                    <small>
                      {t("stat.echanges")} {client.echanges}
                    </small>
                  </span>
                  <span className="cadc-ligne__valeur">{nouvelles(client.derniers_jours, t)}</span>
                </div>

                {client.relance ? (
                  <p className="carnet__note">
                    {t("relance.due")} {f.date(client.relance.due_le)} ·{" "}
                    {client.relance.origine === "devis" && !client.relance.motif
                      ? t("relance.devis")
                      : client.relance.motif}
                  </p>
                ) : null}

                {client.joignable ? (
                  <div className="cadc-acts">
                    {lien ? (
                      <a
                        className="cadc-bouton cadc-bouton--premier cadc-bouton--petit"
                        href={lien}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t("fiche.whatsapp")}
                      </a>
                    ) : null}
                    <a className="cadc-bouton cadc-bouton--petit" href={`tel:${client.telephone}`}>
                      {t("fiche.appeler")}
                    </a>
                    <Link
                      href={`/clients/${client.id}`}
                      className="cadc-bouton cadc-bouton--doux cadc-bouton--petit"
                    >
                      {t("commun.voir")}
                    </Link>
                  </div>
                ) : (
                  <p className="cadc-champ__aide">{t("fiche.rien_a_rappeler")}</p>
                )}

                <SortieClient
                  clientId={client.id}
                  actif={client.actif}
                  langue={langue}
                  responsable={responsable}
                />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
