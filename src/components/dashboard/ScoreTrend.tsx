import { useId, useState } from 'react';
import type { AuditPoint } from '@/lib/dashboard';

const WIDTH = 280;
const HEIGHT = 64;
const PAD = 8;
const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });

/**
 * Évolution du score, audit par audit : ligne discrète (gris), dernier point en accent.
 * Chaque point se lit au survol ou au clavier ; l'historique complet reste dans une
 * liste lisible par les lecteurs d'écran.
 */
export function ScoreTrend({ points }: { points: AuditPoint[] }) {
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  if (points.length < 2) return null;

  const scores = points.map((p) => p.score);
  // Échelle resserrée autour des valeurs, avec une marge, pour que l'évolution se voie.
  const min = Math.max(0, Math.min(...scores) - 10);
  const max = Math.min(100, Math.max(...scores) + 10);
  const x = (i: number) => PAD + (i * (WIDTH - PAD * 2)) / (points.length - 1);
  const y = (v: number) => PAD + ((max - v) * (HEIGHT - PAD * 2)) / Math.max(1, max - min);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.score)}`).join(' ');
  const last = points.length - 1;
  const shown = active ?? null;

  return (
    <figure className="relative mt-4">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-16 w-full overflow-visible"
        role="group"
        aria-labelledby={`${id}-cap`}
        onPointerLeave={() => setActive(null)}
      >
        <path
          d={path}
          fill="none"
          stroke="#94a3b8"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p, i) => (
          <g key={p.id}>
            <circle
              cx={x(i)}
              cy={y(p.score)}
              r={i === last || i === shown ? 5 : 4}
              fill={i === last ? '#126dfb' : '#94a3b8'}
              stroke="#ffffff"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
            {/* Zone de survol plus large que le point. */}
            <circle
              cx={x(i)}
              cy={y(p.score)}
              r={14}
              fill="transparent"
              tabIndex={0}
              role="img"
              aria-label={`Audit du ${dateFormat.format(new Date(p.createdAt))} : ${p.score} sur 100`}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="cursor-default outline-none focus-visible:stroke-brand-500"
              strokeWidth={2}
            />
          </g>
        ))}
      </svg>

      {shown !== null && (
        <div
          role="status"
          className={`pointer-events-none absolute -top-2 z-10 -translate-y-full whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg ${
            // Près d'un bord, l'infobulle s'aligne sur lui pour ne pas sortir de la carte.
            x(shown) / WIDTH < 0.25
              ? ''
              : x(shown) / WIDTH > 0.75
                ? '-translate-x-full'
                : '-translate-x-1/2'
          }`}
          style={{
            left: `${(x(shown) / WIDTH) * 100}%`,
            marginLeft: x(shown) / WIDTH < 0.25 ? -PAD : x(shown) / WIDTH > 0.75 ? PAD : 0,
          }}
        >
          <span className="font-semibold">{points[shown].score}/100</span>
          <span className="ml-1.5 text-slate-300">
            {dateFormat.format(new Date(points[shown].createdAt))}
          </span>
        </div>
      )}

      <figcaption id={`${id}-cap`} className="sr-only">
        Évolution du score sur les {points.length} derniers audits :{' '}
        {points
          .map((p) => `${dateFormat.format(new Date(p.createdAt))}, ${p.score} sur 100`)
          .join(' ; ')}
        .
      </figcaption>
    </figure>
  );
}
