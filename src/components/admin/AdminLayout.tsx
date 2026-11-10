import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  BrainCircuit,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  ShieldCheck,
  Tags,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const NAV: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/admin', label: 'Vue d’ensemble', icon: LayoutDashboard, end: true },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
  { to: '/admin/paiements', label: 'Paiements', icon: CreditCard },
  { to: '/admin/tarifs', label: 'Tarifs', icon: Tags },
  { to: '/admin/ia', label: 'IA & générations', icon: BrainCircuit },
  { to: '/admin/journal', label: 'Journal', icon: ScrollText },
];

function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const { user } = useAuth();
  return (
    <div className="flex h-full flex-col bg-slate-900 text-white">
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 px-5">
        <span className="flex items-center gap-2.5 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-white">
            <ShieldCheck aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
          </span>
          <span className="leading-tight">
            Centre de contrôle
            <span className="block text-[11px] font-medium text-slate-400">Administration</span>
          </span>
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav aria-label="Administration" className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-950/30'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-2 border-t border-white/10 px-3 py-4">
        <NavLink
          to="/"
          onClick={onClose}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
          Retour à l’application
        </NavLink>
        <div className="flex items-center gap-3 px-3">
          <span className="min-w-0 flex-1 truncate text-xs text-slate-400">{user?.email}</span>
          <button
            type="button"
            onClick={() => void supabase.auth.signOut()}
            aria-label="Se déconnecter"
            title="Se déconnecter"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <LogOut aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const close = useCallback(() => setOpen(false), []);

  useEffect(close, [pathname, close]);
  useEffect(() => {
    if (!open) return;
    const trigger = button.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawer.current?.querySelector<HTMLElement>('a, button')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
      trigger?.focus();
    };
  }, [open, close]);

  return (
    <div className="min-h-dvh bg-slate-100 lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 lg:block">
        <AdminSidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-slate-800 bg-slate-900 px-3 text-white lg:hidden">
          <button
            ref={button}
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
            className="grid h-10 w-10 place-items-center rounded-lg hover:bg-white/10"
          >
            <Menu aria-hidden="true" className="h-5 w-5" />
          </button>
          <ShieldCheck aria-hidden="true" className="h-5 w-5 text-brand-400" />
          <span className="font-semibold">Centre de contrôle</span>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div aria-hidden="true" onClick={close} className="absolute inset-0 bg-slate-950/60" />
          <div
            ref={drawer}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-[slide-in_200ms_ease-out] shadow-2xl motion-reduce:animate-none"
          >
            <AdminSidebar onClose={close} />
          </div>
        </div>
      )}
    </div>
  );
}
