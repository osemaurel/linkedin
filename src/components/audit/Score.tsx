function scoreTone(score: number | null): string {
  if (score === null) return 'bg-slate-100 text-slate-600';
  if (score >= 70) return 'bg-emerald-50 text-emerald-700';
  if (score >= 40) return 'bg-amber-50 text-amber-800';
  return 'bg-red-50 text-red-700';
}

export function BigScore({ score }: { score: number }) {
  const tone = score >= 70 ? 'text-emerald-600' : score >= 40 ? 'text-amber-600' : 'text-red-600';
  return (
    <p className="flex items-baseline gap-1">
      <span className={`text-5xl font-semibold tabular-nums tracking-tight ${tone}`}>{score}</span>
      <span className="text-lg font-medium text-slate-400">/100</span>
    </p>
  );
}

export function ScoreBadge({ score }: { score: number | null }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-sm font-semibold tabular-nums ${scoreTone(score)}`}
    >
      {score === null ? (
        'À vérifier'
      ) : (
        <>
          {score}
          <span className="font-normal opacity-70">/100</span>
        </>
      )}
    </span>
  );
}

type DeltaProps = {
  current: number | null;
  previous?: number | null;
  /** false quand le texte autour dit déjà « depuis l'audit précédent ». */
  srContext?: boolean;
};

export function Delta({ current, previous, srContext = true }: DeltaProps) {
  if (current === null || previous === null || previous === undefined) return null;
  const diff = current - previous;
  const label = diff > 0 ? `+${diff}` : diff < 0 ? `−${Math.abs(diff)}` : '=';
  const tone = diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-red-700' : 'text-slate-500';
  return (
    <span className={`shrink-0 text-sm font-medium tabular-nums ${tone}`}>
      {label}
      {srContext && <span className="sr-only"> depuis le dernier audit</span>}
    </span>
  );
}
