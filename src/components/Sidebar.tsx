import { NavLink } from 'react-router-dom';
import { Coins, LogOut, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { formatCredits } from '@/lib/credits';
import { MENU_SECTIONS, type MenuItem } from '@/lib/menus';
import { supabase } from '@/lib/supabase';
import { Logo } from './Logo';

type Props = {
  /** Réduite aux icônes (ordinateur). */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Tiroir mobile : bouton de fermeture, fermeture à chaque navigation. */
  onClose?: () => void;
};

function initials(name: string, email: string): string {
  const source = name.trim() || email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

function NavItem({
  item,
  collapsed,
  onNavigate,
}: {
  item: MenuItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  if (item.soon) {
    return (
      <span
        aria-disabled="true"
        title={collapsed ? `${item.label} (bientôt)` : undefined}
        className={`flex cursor-default items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sky-200/50 ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        <Icon aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.8} />
        {!collapsed && (
          <>
            <span className="truncate">{item.label}</span>
            <span className="ml-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]">
              Bientôt
            </span>
          </>
        )}
      </span>
    );
  }
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        [
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
          collapsed ? 'justify-center' : '',
          isActive
            ? 'bg-white text-sky-700 shadow-md shadow-sky-950/20'
            : 'text-sky-50 hover:bg-white/10 hover:text-white',
        ].join(' ')
      }
    >
      <Icon aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.8} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

function CreditsCard({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { data, isPending, isError } = useProfile();
  const balance = isPending ? '…' : isError || !data ? '—' : formatCredits(data.credits_balance);

  if (collapsed) {
    return (
      <NavLink
        to="/compte"
        onClick={onNavigate}
        title={`Solde : ${balance}`}
        className="flex flex-col items-center gap-1 rounded-xl bg-white/10 py-2 text-xs font-semibold text-white ring-1 ring-white/15 hover:bg-white/15"
      >
        <Coins aria-hidden="true" className="h-5 w-5 text-amber-300" strokeWidth={1.8} />
        <span className="sr-only">Solde : </span>
        <span className="tabular-nums">
          {isPending || isError || !data ? '…' : data.credits_balance}
        </span>
      </NavLink>
    );
  }

  return (
    <div className="rounded-2xl bg-white/10 p-3.5 ring-1 ring-white/15">
      <div className="flex items-center gap-2 text-xs font-medium text-sky-100">
        <Coins aria-hidden="true" className="h-4 w-4 text-amber-300" strokeWidth={1.8} />
        Solde
      </div>
      <p className="mt-1 text-lg font-semibold tabular-nums text-white">{balance}</p>
      <NavLink
        to="/compte"
        onClick={onNavigate}
        className="mt-2.5 flex w-full items-center justify-center rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-sky-700 hover:bg-sky-50"
      >
        Recharger
      </NavLink>
    </div>
  );
}

/** Navigation principale : barre latérale bleue (ordinateur) ou tiroir (mobile). */
export function Sidebar({ collapsed = false, onToggleCollapse, onClose }: Props) {
  const { user } = useAuth();
  const profile = useProfile();
  const name = profile.data?.full_name?.trim() ?? '';
  const email = user?.email ?? '';

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-sky-700 to-sky-800 text-white">
      {/* Halo décoratif */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-sky-400/30 blur-3xl"
      />

      <div
        className={`relative flex h-16 shrink-0 items-center gap-2 ${collapsed ? 'justify-center px-2' : 'justify-between px-5'}`}
      >
        <NavLink to="/" onClick={onClose} className="min-w-0 rounded-lg">
          <Logo inverted compact={collapsed} />
        </NavLink>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className="grid h-9 w-9 place-items-center rounded-lg text-sky-100 hover:bg-white/10 hover:text-white"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav
        aria-label="Menu principal"
        className={`relative flex-1 space-y-5 overflow-y-auto py-3 ${collapsed ? 'px-3' : 'px-4'}`}
      >
        {MENU_SECTIONS.map((section) => (
          <div key={section.title}>
            {collapsed ? (
              <div aria-hidden="true" className="mx-2 mb-2 border-t border-white/10" />
            ) : (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-sky-100">
                {section.title}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.path}>
                  <NavItem item={item} collapsed={collapsed} onNavigate={onClose} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className={`relative space-y-3 pb-4 pt-2 ${collapsed ? 'px-3' : 'px-4'}`}>
        <CreditsCard collapsed={collapsed} onNavigate={onClose} />

        <div className={`flex items-center gap-3 rounded-xl ${collapsed ? 'flex-col' : 'px-1'}`}>
          <span
            aria-hidden="true"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-xs font-semibold text-white ring-1 ring-white/20"
          >
            {initials(name, email)}
          </span>
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-white">{name || email}</span>
              {name && <span className="block truncate text-xs text-sky-100">{email}</span>}
            </span>
          )}
          <button
            type="button"
            onClick={() => void supabase.auth.signOut()}
            title="Se déconnecter"
            aria-label="Se déconnecter"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sky-100 hover:bg-white/10 hover:text-white"
          >
            <LogOut aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Déplier la barre latérale' : 'Réduire la barre latérale'}
            title={collapsed ? 'Déplier' : 'Réduire'}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-sky-100 hover:bg-white/10 hover:text-white ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden="true" className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose aria-hidden="true" className="h-4 w-4" />
                Réduire
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
