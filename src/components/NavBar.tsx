import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MENUS } from '@/lib/menus';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/hooks/useProfile';
import { Logo } from './Logo';

const numberFormat = new Intl.NumberFormat('fr-FR');

function formatCredits(n: number) {
  return `${numberFormat.format(n)} ${n > 1 ? 'crédits' : 'crédit'}`;
}

function signOut() {
  void supabase.auth.signOut();
}

function CreditsBadge({ onNavigate }: { onNavigate: () => void }) {
  const { data, isPending, isError } = useProfile();
  const label = isPending ? '…' : isError || !data ? '—' : formatCredits(data.credits_balance);

  return (
    <NavLink
      to="/compte"
      onClick={onNavigate}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-white"
    >
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
        className="h-4 w-4 text-amber-500"
      >
        <circle cx="10" cy="10" r="8" />
        <circle cx="10" cy="10" r="4.5" fill="white" fillOpacity="0.35" />
      </svg>
      <span className="sr-only">Solde : </span>
      <span className="tabular-nums">{label}</span>
    </NavLink>
  );
}

export function NavBar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <NavLink to="/" onClick={close} className="min-w-0">
          <Logo />
        </NavLink>

        <div className="flex items-center gap-2">
          <CreditsBadge onNavigate={close} />
          <button
            type="button"
            onClick={signOut}
            className="hidden h-9 items-center rounded-md px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:inline-flex"
          >
            Se déconnecter
          </button>
          <button
            type="button"
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            aria-controls="menu-mobile"
            onClick={() => setOpen((v) => !v)}
            className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
              className="h-5 w-5"
            >
              {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      <nav aria-label="Menu principal" className="hidden border-t border-slate-100 lg:block">
        <ul className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6">
          {MENUS.map((item) => (
            <li key={item.path} className="shrink-0">
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  [
                    'inline-flex h-11 items-center whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-sky-600 text-sky-700'
                      : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {open && (
        <nav
          id="menu-mobile"
          aria-label="Menu principal"
          className="max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-slate-200 lg:hidden"
        >
          <ul className="mx-auto flex w-full max-w-6xl flex-col gap-0.5 px-2 py-2 sm:px-4">
            {MENUS.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  onClick={close}
                  className={({ isActive }) =>
                    [
                      'block rounded-md px-3 py-2.5 text-base font-medium transition-colors',
                      isActive
                        ? 'bg-sky-50 text-sky-700'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mx-auto w-full max-w-6xl border-t border-slate-200 px-2 py-2 sm:px-4">
            <button
              type="button"
              onClick={signOut}
              className="block w-full rounded-md px-3 py-2.5 text-left text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            >
              Se déconnecter
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
