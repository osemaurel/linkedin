import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { svg } from '../assets';
import { LOGIN_HREF, SIGNUP_HREF } from './links';
import { Button, InlineSvg } from './primitives';

const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Avantages', href: '#benefits' },
  { label: 'Pour qui', href: '#pour-qui' },
  { label: 'Tarifs', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Connexion', href: LOGIN_HREF },
];

const navSpring = { type: 'spring', stiffness: 500, damping: 60, mass: 1 } as const;

export function Logo({ className = '' }: { className?: string }) {
  return (
    <a
      href="#top"
      aria-label="Optimisation, retour en haut de page"
      className={`flex items-center gap-1.5 ${className}`}
    >
      <InlineSvg svg={svg.logo} className="h-[30px] w-[30px]" />
      <span className="al-h4 text-al-ink">Optimisation</span>
    </a>
  );
}

/** Lien du menu : un liseré gris de 2 px apparaît au survol. */
function NavLink({
  label,
  href,
  mobile,
  onClick,
}: (typeof NAV_LINKS)[number] & {
  mobile?: boolean;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.a
      href={href}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`flex h-10 items-center rounded-lg ${mobile ? '' : 'px-3'}`}
      initial={false}
      animate={{
        boxShadow:
          hovered && !mobile ? '0px 0px 0px 2px #e4e4e4' : '0px 0px 0px 0px rgba(228, 228, 228, 0)',
        opacity: mobile && !hovered ? 0.5 : 1,
      }}
      transition={navSpring}
    >
      {mobile ? (
        <span className="al-h5 text-al-ink">{label}</span>
      ) : (
        <span className="al-p">{label}</span>
      )}
    </motion.a>
  );
}

/**
 * Barre fixe en haut. Au-delà de 1200 px : liens et bouton en ligne. En dessous : bouton
 * à deux traits qui devient une croix et déroule le menu sur toute la hauteur.
 */
export function Navbar() {
  const [open, setOpen] = useState(false);

  // Le menu se ferme si la fenêtre repasse en mise en page ordinateur.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1200px)');
    const close = () => mq.matches && setOpen(false);
    mq.addEventListener('change', close);
    return () => mq.removeEventListener('change', close);
  }, []);

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 overflow-hidden bg-white shadow-[0_1px_20px_rgba(0,0,0,0.03)]"
      initial={false}
      animate={{ height: open ? '100vh' : 'auto' }}
      transition={navSpring}
    >
      <div className="mx-auto flex w-full max-w-[1200px] flex-col px-4 py-3.5 tab:px-8 desk:px-12">
        <div className="flex items-center justify-between">
          <Logo />

          <nav aria-label="Navigation principale" className="hidden items-center gap-2.5 desk:flex">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.href} {...l} />
            ))}
          </nav>
          <Button href={SIGNUP_HREF} className="hidden desk:flex">
            Créer mon compte
          </Button>

          <button
            type="button"
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="relative h-[30px] w-[30px] cursor-pointer desk:hidden"
          >
            <motion.span
              className="absolute left-1.5 h-0.5 w-[18px] rounded-[10px] bg-al-ink"
              initial={false}
              animate={{ top: open ? 14 : 10.25, rotate: open ? 45 : 0 }}
              transition={navSpring}
            />
            <motion.span
              className="absolute left-1.5 h-0.5 w-[18px] rounded-[10px] bg-al-ink"
              initial={false}
              animate={{ top: open ? 14 : 17.75, rotate: open ? -45 : 0 }}
              transition={navSpring}
            />
          </button>
        </div>

        {open && (
          <nav
            aria-label="Menu"
            className="flex flex-col items-start gap-2.5 pb-8 pt-7 desk:hidden"
          >
            {NAV_LINKS.map((l) => (
              <NavLink key={l.href} {...l} mobile onClick={() => setOpen(false)} />
            ))}
            <Button href={SIGNUP_HREF} className="mt-[18px] w-full">
              Créer mon compte
            </Button>
          </nav>
        )}
      </div>
    </motion.header>
  );
}
