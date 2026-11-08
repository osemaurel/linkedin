import { Link } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CircleCheck,
  Circle,
  Coins,
  Compass,
  Gauge,
  PenLine,
  Users,
  type LucideIcon,
} from 'lucide-react';
import {
  timeAgo,
  type Activity,
  type ActivityKind,
  type AuditPoint,
  type NextAction,
  type Step,
} from '@/lib/dashboard';
import { ScoreTrend } from './ScoreTrend';

const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6';
const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });

export function NextActionCard({
  action,
  className = '',
}: {
  action: NextAction;
  className?: string;
}) {
  return (
    <section
      aria-labelledby="prochaine-etape"
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-600 to-sky-700 p-6 text-white shadow-md shadow-sky-900/10 sm:p-8 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl"
      />
      <p
        id="prochaine-etape"
        className="relative text-xs font-semibold uppercase tracking-wider text-sky-100"
      >
        Prochaine étape
      </p>
      <h2 className="relative mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
        {action.title}
      </h2>
      <p className="relative mt-2 max-w-xl text-sm text-sky-50 sm:text-base">{action.text}</p>
      <Link
        to={action.to}
        className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-sky-700 shadow-sm transition-colors hover:bg-sky-50"
      >
        {action.cta}
        <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
      </Link>
    </section>
  );
}

export function ScoreCard({ audits }: { audits: AuditPoint[] }) {
  const latest = audits.at(-1);
  const previous = audits.at(-2);
  const delta = latest && previous ? latest.score - previous.score : null;

  return (
    <section aria-labelledby="score-titre" className={`${card} flex flex-col`}>
      <h2 id="score-titre" className="text-sm font-medium text-slate-500">
        Score de ton profil
      </h2>
      {latest ? (
        <>
          <p className="mt-2 flex items-baseline gap-1">
            <span className="text-6xl font-semibold tracking-tight text-slate-900">
              {latest.score}
            </span>
            <span className="text-lg font-medium text-slate-400">/100</span>
          </p>
          {delta !== null ? (
            <p
              className={`mt-1 flex items-center gap-1 text-sm font-medium ${
                delta > 0 ? 'text-emerald-700' : delta < 0 ? 'text-red-700' : 'text-slate-600'
              }`}
            >
              {delta > 0 ? (
                <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
              ) : delta < 0 ? (
                <ArrowDownRight aria-hidden="true" className="h-4 w-4" />
              ) : null}
              {delta > 0 ? `+${delta}` : delta === 0 ? 'Stable' : `${delta}`}
              <span className="font-normal text-slate-500">
                {delta === 0 ? 'depuis l’audit précédent' : 'points depuis l’audit précédent'}
              </span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-500">Ton premier audit</p>
          )}
          <ScoreTrend points={audits} />
          <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-sm">
            <span className="text-slate-500">
              Audit du {dateFormat.format(new Date(latest.createdAt))}
            </span>
            <Link to="/audit" className="font-medium text-sky-700 hover:underline">
              Voir l’audit
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-6xl font-semibold tracking-tight text-slate-300">—</p>
          <p className="mt-2 text-sm text-slate-600">
            Ton score apparaîtra ici après ton premier audit.
          </p>
        </>
      )}
    </section>
  );
}

export function ProgressCard({ steps }: { steps: Step[] }) {
  const done = steps.filter((s) => s.done).length;
  const percent = Math.round((done / steps.length) * 100);

  return (
    <section aria-labelledby="avancement-titre" className={card}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="avancement-titre" className="font-semibold text-slate-900">
          Ton avancement
        </h2>
        <span className="text-sm text-slate-500">
          {done} étape{done > 1 ? 's' : ''} sur {steps.length}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Avancement du parcours"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={done}
        aria-valuetext={`${done} étapes sur ${steps.length}`}
        className="mt-3 h-2 rounded-full bg-sky-100"
      >
        <div
          className="h-2 rounded-full bg-sky-600 transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <ul className="mt-4 space-y-0.5">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              to={step.to}
              className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50"
            >
              {step.done ? (
                <CircleCheck aria-hidden="true" className="h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <Circle aria-hidden="true" className="h-5 w-5 shrink-0 text-slate-300" />
              )}
              <span className={`flex-1 text-sm ${step.done ? 'text-slate-500' : 'text-slate-900'}`}>
                <span className="sr-only">{step.done ? 'Fait : ' : 'À faire : '}</span>
                {step.label}
              </span>
              {!step.done && (
                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-sky-600"
                />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const ACTIVITY_ICONS: Record<ActivityKind, { icon: LucideIcon; tone: string }> = {
  audit: { icon: Gauge, tone: 'bg-sky-50 text-sky-700' },
  strategy: { icon: Compass, tone: 'bg-violet-50 text-violet-700' },
  plan: { icon: CalendarDays, tone: 'bg-amber-50 text-amber-700' },
  post: { icon: PenLine, tone: 'bg-emerald-50 text-emerald-700' },
  contact: { icon: Users, tone: 'bg-rose-50 text-rose-700' },
  credits: { icon: Coins, tone: 'bg-yellow-50 text-yellow-700' },
};

export function ActivityCard({ items }: { items: Activity[] }) {
  return (
    <section aria-labelledby="activite-titre" className={card}>
      <h2 id="activite-titre" className="font-semibold text-slate-900">
        Activité récente
      </h2>
      {items.length ? (
        <ul className="mt-3 space-y-0.5">
          {items.map((item, i) => {
            const { icon: Icon, tone } = ACTIVITY_ICONS[item.kind];
            return (
              <li key={`${item.kind}-${item.at}-${i}`}>
                <Link
                  to={item.to}
                  className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-slate-50"
                >
                  <span
                    aria-hidden="true"
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${tone}`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm text-slate-900">{item.text}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      <time dateTime={item.at}>{timeAgo(item.at)}</time>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          Ton activité apparaîtra ici : audits, posts, plan, contacts.
        </p>
      )}
    </section>
  );
}
