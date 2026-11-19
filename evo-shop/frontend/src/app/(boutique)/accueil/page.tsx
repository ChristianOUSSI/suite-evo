import type { Metadata } from "next";
import Link from "next/link";

import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { Etat, ListeProduits } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "The till" : "La caisse" };
}

export default async function PageAccueil() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);

  const [etat, produits] = await Promise.all([
    lire<Etat>("/etat", langue),
    lire<ListeProduits>("/produits", langue),
  ]);

  const manquants = produits.produits.filter(
    (un) => un.actif && (un.stock === 0 || un.stock <= un.seuil_alerte),
  );

  return (
    <div className="cadc-gabarit boutique">
      <div className="boutique__tete">
        <span className="cadc-badge cadc-badge--acier">{f.jourDate(etat.jour)}</span>
        <h1>{t("accueil.titre")}</h1>
        <p>{t("accueil.chapo")}</p>
      </div>

      <div className="portails">
        <div className="portail" aria-label={t("accueil.ca")}>
          <span>
            <strong
              style={{
                display: "block",
                fontFamily: "var(--cadc-mono)",
                fontSize: "clamp(1.9rem,8vw,2.8rem)",
                lineHeight: 1.1,
              }}
            >
              {f.fcfa(etat.ca_du_jour)}
            </strong>
            <span className="cadc-champ__aide">
              {t("accueil.ca")} · {etat.ventes_du_jour} {t("accueil.ventes")}
            </span>
          </span>
          <span className="portail__reste">
            {etat.ruptures} {t("accueil.ruptures")} · {etat.alertes}{" "}
            {t("accueil.alertes")}
          </span>
        </div>
      </div>

      <div className="cadc-acts">
        <Link href="/ventes" className="cadc-bouton cadc-bouton--grand cadc-bouton--premier">
          {t("ventes.nouveau")}
        </Link>
        <Link href="/produits" className="cadc-bouton cadc-bouton--doux">
          {t("nav.produits")}
        </Link>
      </div>

      {manquants.length > 0 ? (
        <section className="cadc-carte" aria-label={t("accueil.ruptures")}>
          <div className="cadc-tete">
            <h2>{t("accueil.ruptures")}</h2>
            <Link href="/produits" className="cadc-bouton cadc-bouton--doux cadc-bouton--petit">
              {t("nav.produits")}
            </Link>
          </div>
          <ul className="cadc-liste cadc-pile cadc-pile--serree">
            {manquants.slice(0, 10).map((un) => (
              <li className={`cadc-ligne${un.stock === 0 ? " produit--rupture" : " produit--alerte"}`} key={un.id}>
                <span className="cadc-ligne__nom">
                  {un.nom}
                  <small>
                    {un.stock} {t(`unite.${un.unite}`)}
                  </small>
                </span>
                <span className="cadc-ligne__valeur">
                  {f.fcfa(un.prix_vente)}
                  <br />
                  <small>{un.stock === 0 ? "-" : `≤ ${un.seuil_alerte}`}</small>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <MentionDemo langue={langue} />
    </div>
  );
}
