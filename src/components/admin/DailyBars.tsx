import { useId, useState } from 'react';

type Point = { day: string; value: number };

const W = 600;
const H = 160;
const TOP = 12;
const BOTTOM = 22;
const LEFT = 28;
const dayFormat = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});
const fmt = (iso: string) => dayFormat.format(new Date(`${iso}T00:00:00Z`));

/**
 * Une série par jour, en barres fines (24 px au plus, haut arrondi, base nette), grille
 * discrète, valeur au survol ou au clavier ; le tableau des valeurs reste lisible par
 * les lecteurs d'écran.
 */
export function DailyBars({
  title,
  points,
  unit,
}: {
  title: string;
  points: Point[];
  unit: string;
}) {
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...points.map((p) => p.value));
  const plotW = W - LEFT;
  const plotH = H - TOP - BOTTOM;
  const slot = plotW / Math.max(1, points.length);
  const barW = Math.min(24, Math.max(2, slot - 2));
  const y = (v: number) => TOP + plotH - (v / max) * plotH;
  const total = points.reduce((s, p) => s + p.value, 0);

  return (
    <figure className="relative">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span id={`${id}-t`} className="text-sm font-semibold text-slate-900">
          {title}
        </span>
        <span className="text-xs text-slate-500">
          {total} sur {points.length} jours
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 h-40 w-full overflow-visible"
        role="group"
        aria-labelledby={`${id}-t`}
        onPointerLeave={() => setActive(null)}
      >
        {[0, max].map((v) => (
          <g key={v}>
            <line x1={LEFT} x2={W} y1={y(v)} y2={y(v)} stroke="#e2e8f0" strokeWidth={1} />
            <text x={LEFT - 6} y={y(v) + 4} textAnchor="end" className="fill-slate-400 text-[11px]">
              {v}
            </text>
          </g>
        ))}
        {points.map((p, i) => {
          const x = LEFT + i * slot + (slot - barW) / 2;
          const top = y(p.value);
          const h = Math.max(0, TOP + plotH - top);
          const r = Math.min(4, barW / 2, h);
          // Haut arrondi, base carrée posée sur la ligne de base.
          const d =
            h > 0
              ? `M${x},${TOP + plotH} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${TOP + plotH} Z`
              : '';
          return (
            <g key={p.day}>
              {d && <path d={d} fill={active === i ? '#0765e8' : '#126dfb'} />}
              <rect
                x={LEFT + i * slot}
                y={TOP}
                width={slot}
                height={plotH}
                fill="transparent"
                tabIndex={0}
                role="img"
                aria-label={`${fmt(p.day)} : ${p.value} ${unit}`}
                onPointerEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="cursor-default outline-none focus-visible:fill-brand-100/60"
              />
            </g>
          );
        })}
        {[0, Math.floor((points.length - 1) / 2), points.length - 1].map((i) =>
          points[i] ? (
            <text
              key={i}
              x={LEFT + i * slot + slot / 2}
              y={H - 4}
              textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
              className="fill-slate-400 text-[11px]"
            >
              {fmt(points[i].day)}
            </text>
          ) : null,
        )}
      </svg>
      {active !== null && points[active] && (
        <div
          role="status"
          className="pointer-events-none absolute top-6 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{
            left: `${Math.min(88, Math.max(12, ((LEFT + active * slot + slot / 2) / W) * 100))}%`,
          }}
        >
          <span className="font-semibold">
            {points[active].value} {unit}
          </span>
          <span className="ml-1.5 text-slate-300">{fmt(points[active].day)}</span>
        </div>
      )}
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Jour</th>
            <th scope="col">{unit}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.day}>
              <td>{fmt(p.day)}</td>
              <td>{p.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
