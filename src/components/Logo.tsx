type Props = {
  /** Sur fond bleu : version claire. */
  inverted?: boolean;
  /** Barre latérale réduite : le symbole seul. */
  compact?: boolean;
};

/** Symbole de la marque, le même que sur la page d'accueil : une flèche qui monte. */
function Mark({ inverted }: { inverted: boolean }) {
  const stroke = inverted ? 'stroke-brand-600' : 'stroke-white';
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-8 w-8 shrink-0 rounded-lg shadow-sm"
      fill="none"
      strokeWidth={2.1}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" rx="5" className={inverted ? 'fill-white' : 'fill-brand-600'} />
      <path d="M13.9 7.2A5 5 0 1 0 14.75 10" className={stroke} />
      <path d="M11.2 8.6 15.3 4.5M12.4 4.5h2.9v2.9" className={stroke} />
    </svg>
  );
}

export function Logo({ inverted = false, compact = false }: Props) {
  return (
    <span
      className={`flex items-center gap-2.5 font-semibold tracking-tight ${
        inverted ? 'text-white' : 'text-slate-900'
      }`}
    >
      <Mark inverted={inverted} />
      <span className={compact ? 'sr-only' : 'truncate text-[15px] leading-tight'}>
        Optimisation
      </span>
    </span>
  );
}
