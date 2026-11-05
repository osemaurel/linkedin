import {
  CalendarDays,
  Compass,
  Gauge,
  LayoutDashboard,
  PenLine,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export type MenuItem = {
  path: string;
  label: string;
  short: string;
  icon: LucideIcon;
  /** Module pas encore construit : affiché grisé, avec « Bientôt ». */
  soon?: boolean;
};

export type MenuSection = { title: string; items: readonly MenuItem[] };

/** Les huit menus du cadrage, regroupés par étape du parcours. */
export const MENU_SECTIONS: readonly MenuSection[] = [
  {
    title: 'Pilotage',
    items: [
      { path: '/', label: 'Tableau de bord', short: 'Accueil', icon: LayoutDashboard },
      { path: '/profil', label: 'Mon profil', short: 'Profil', icon: UserRound },
      { path: '/audit', label: 'Audit & optimisation', short: 'Audit', icon: Gauge },
    ],
  },
  {
    title: 'Contenu',
    items: [
      { path: '/strategie', label: 'Stratégie de contenu', short: 'Stratégie', icon: Compass },
      { path: '/plan', label: 'Plan éditorial', short: 'Plan', icon: CalendarDays },
      { path: '/studio', label: 'Studio', short: 'Studio', icon: PenLine },
    ],
  },
  {
    title: 'Prospection',
    items: [{ path: '/reseau', label: 'Mon réseau', short: 'Réseau', icon: Users }],
  },
  {
    title: 'Compte',
    items: [{ path: '/compte', label: 'Compte', short: 'Compte', icon: Wallet }],
  },
];
