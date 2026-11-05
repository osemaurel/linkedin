type Props = {
  /** Sur fond bleu : version claire. */
  inverted?: boolean;
  /** Barre latérale réduite : le symbole seul. */
  compact?: boolean;
};

export function Logo({ inverted = false, compact = false }: Props) {
  return (
    <span
      className={`flex items-center gap-2.5 font-semibold tracking-tight ${
        inverted ? 'text-white' : 'text-slate-900'
      }`}
    >
      <span
        aria-hidden="true"
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-bold shadow-sm ${
          inverted ? 'bg-white text-blue-700' : 'bg-blue-700 text-white'
        }`}
      >
        in
      </span>
      <span className={compact ? 'sr-only' : 'truncate text-[15px] leading-tight'}>
        Optimisation LinkedIn
      </span>
    </span>
  );
}
