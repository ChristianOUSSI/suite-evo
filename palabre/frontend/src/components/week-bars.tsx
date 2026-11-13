import { fcfa } from "@/lib/format";
import type { Dashboard } from "@/lib/types";

function weekTag(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

export function WeekBars({
  points,
}: {
  points: Dashboard["collections"];
}) {
  const max = Math.max(...points.map((point) => point.amount), 1);
  const current = points[points.length - 1];

  return (
    <div className="week-chart">
      <div className="week-chart__plot">
        {points.map((point, index) => {
          const height =
            point.amount === 0 ? 2 : Math.max(6, Math.round((point.amount / max) * 100));
          return (
            <div
              className={`week-chart__column${index === points.length - 1 ? " is-current" : ""}`}
              key={point.week_start}
              title={`${weekTag(point.week_start)} : ${fcfa(point.amount)}`}
            >
              <span
                className="week-chart__bar"
                style={{ height: `${height}%` }}
              />
              <span className="week-chart__label">
                {index % 2 === 0 || index === points.length - 1
                  ? weekTag(point.week_start)
                  : "\u00a0"}
              </span>
              <span className="visually-hidden">{fcfa(point.amount)}</span>
            </div>
          );
        })}
      </div>
      <div className="week-chart__foot">
        <span>Huit semaines</span>
        <span>
          Cette semaine <strong>{fcfa(current?.amount ?? 0)}</strong>
        </span>
      </div>
    </div>
  );
}
