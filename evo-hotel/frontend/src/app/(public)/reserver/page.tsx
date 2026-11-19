import type { Metadata } from "next";

import { Bascules } from "@/components/bascules";
import { FormulaireReservation } from "@/components/formulaire-reservation";
import { NomProduit } from "@/components/marque";
import { MentionDemo } from "@/components/mention-demo";
import { lirePublique } from "@/lib/api";
import { lienWhatsApp } from "@/lib/format";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { HotelPublique } from "@/lib/types";

import "../../../styles/hotel.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Book a room" : "Réserver une chambre" };
}

export default async function PageReserver() {
  const langue = await langueCourante();
  const t = traduire(langue).t;

  let fiche: HotelPublique | null = null;
  try {
    fiche = await lirePublique<HotelPublique>("/public/hotel", langue);
  } catch {
    fiche = null;
  }

  const hotel = fiche?.hotel ?? null;
  const whatsapp = hotel ? lienWhatsApp(hotel.telephone) : "";

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" sous={hotel?.nom ?? "evo-hotel"} />
          <Bascules langue={langue} />
        </div>
      </header>
      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit standard">
          <div className="standard__tete">
            <span className="cadc-badge cadc-badge--acier">
              {hotel?.nom ?? "evo-hotel"}
            </span>
            <h1>{t("reserver.titre")}</h1>
            <p>{t("reserver.chapo")}</p>
          </div>

          {hotel ? (
            <FormulaireReservation langue={langue} />
          ) : (
            <p className="cadc-note">{t("reserver.vide")}</p>
          )}

          {hotel?.telephone ? (
            <div className="cadc-acts">
              <a
                className="cadc-bouton cadc-bouton--doux"
                href={`tel:${hotel.telephone.replace(/\D/g, "")}`}
              >
                {hotel.telephone_display}
              </a>
              {whatsapp ? (
                <a
                  className="cadc-bouton cadc-bouton--doux"
                  href={whatsapp}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              ) : null}
            </div>
          ) : null}

          <MentionDemo langue={langue} />
        </div>
      </main>
    </div>
  );
}
