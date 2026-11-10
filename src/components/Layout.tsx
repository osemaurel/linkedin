import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Coins, Menu } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { RechargeProvider } from './credits/RechargeProvider';
import { Logo } from './Logo';
import { Sidebar } from './Sidebar';

const COLLAPSE_KEY = 'sidebar-collapsed';

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

function MobileTopBar({
  onOpen,
  buttonRef,
}: {
  onOpen: () => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
}) {
  const { data } = useProfile();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-3 backdrop-blur supports-[backdrop-filter]:bg-white/75 lg:hidden">
      <div className="flex min-w-0 items-center gap-1">
        <button
          ref={buttonRef}
          type="button"
          onClick={onOpen}
          aria-label="Ouvrir le menu"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-700 hover:bg-slate-100"
        >
          <Menu aria-hidden="true" className="h-5 w-5" />
        </button>
        <NavLink to="/" className="min-w-0">
          <Logo />
        </NavLink>
      </div>
      <NavLink
        to="/compte"
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand-50 px-3 text-sm font-semibold text-brand-800 ring-1 ring-brand-100"
      >
        <Coins aria-hidden="true" className="h-4 w-4 text-amber-500" strokeWidth={2} />
        <span className="sr-only">Solde : </span>
        <span className="tabular-nums">{data ? data.credits_balance : '…'}</span>
      </NavLink>
    </header>
  );
}

export function Layout() {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1');
      } catch {
        // Préférence non mémorisée (navigation privée) : sans conséquence.
      }
      return !c;
    });
  }

  // Changer de page referme le tiroir mobile.
  useEffect(closeDrawer, [pathname, closeDrawer]);

  // Tiroir ouvert : Échap le ferme, la page ne défile plus, le focus y entre puis revient.
  useEffect(() => {
    if (!drawerOpen) return;
    const button = menuButton.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawer.current?.querySelector<HTMLElement>('a, button')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeDrawer();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
      button?.focus();
    };
  }, [drawerOpen, closeDrawer]);

  return (
    <RechargeProvider>
      <div className="min-h-dvh bg-slate-50 lg:flex">
        <aside
          className={`sticky top-0 hidden h-dvh shrink-0 transition-[width] duration-200 lg:block ${
            collapsed ? 'w-[84px]' : 'w-64'
          }`}
        >
          <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <MobileTopBar onOpen={() => setDrawerOpen(true)} buttonRef={menuButton} />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
            <Outlet />
          </main>
        </div>

        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              aria-hidden="true"
              onClick={closeDrawer}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <div
              ref={drawer}
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-[slide-in_200ms_ease-out] shadow-2xl motion-reduce:animate-none"
            >
              <Sidebar onClose={closeDrawer} />
            </div>
          </div>
        )}
      </div>
    </RechargeProvider>
  );
}
