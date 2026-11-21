import { fcfaCompact } from "@/lib/format";
import { t, LANGUE_DEFAUT, type Langue } from "@/lib/langue";
import type { SerieJour } from "@/lib/types";

const JOURS_FR = ["D", "L", "M", "M", "J", "V", "S"];
const JOURS_EN = ["S", "M", "T", "W", "T", "F", "S"];

export function Semaine({
  serie,
  langue = LANGUE_DEFAUT,
}: {
  serie: SerieJour[];
  langue?: Langue;
}) {
  const plafond = Math.max(...serie.map((jour) => jour.total), 1);
  const journee = langue === "en" ? JOURS_EN : JOURS_FR;

  return (
    <div className="semaine" role="img" aria-label={t("semaine.aria", langue)}>
      {serie.map((jour) => {
        const d = new Date(`${jour.day}T12:00:00`);
        const instable = Number.isNaN(d.getTime());
        const hauteur = Math.max(4, Math.round((jour.total / plafond) * 100));
        const partEspeces = jour.total > 0 ? (jour.especes / jour.total) * 100 : 0;
        return (
          <div className="semaine__jour" key={jour.day}>
            <span className="semaine__total mono">
              {jour.total > 0 ? fcfaCompact(jour.total) : ""}
            </span>
            <div className="semaine__barre" style={{ height: `${hauteur}%` }}>
              <span
                className="semaine__especes"
                style={{ height: `${partEspeces}%` }}
              />
            </div>
            <span className="semaine__lettre mono">
              {instable ? "?" : journee[d.getDay()]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
