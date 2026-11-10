import { LOGIN_HREF, SIGNUP_HREF } from './links';
import { Button } from './primitives';
import { Logo } from './Navbar';

const COLUMNS = [
  {
    title: 'Sections',
    links: [
      { label: 'Fonctionnalités', href: '#features' },
      { label: 'Avantages', href: '#benefits' },
      { label: 'Pour qui', href: '#pour-qui' },
      { label: 'Tarifs', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    title: 'Compte',
    links: [
      { label: 'Créer un compte', href: SIGNUP_HREF },
      { label: 'Se connecter', href: LOGIN_HREF },
    ],
  },
  {
    title: 'Ressources',
    links: [
      { label: 'Comment ça marche', href: '#how-it-works' },
      { label: 'Conseils', href: '#blogs' },
      { label: 'Afrique francophone', href: '#afrique' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="flex w-full justify-center bg-white shadow-[0_-1px_20px_rgba(0,0,0,0.03)]">
      <div className="flex w-full max-w-[1200px] flex-col gap-5 px-[21px] pb-5 pt-12 tab:px-8 desk:px-12">
        <div className="flex flex-col gap-5 tab:flex-row tab:gap-8">
          <div className="flex flex-col gap-5 tab:flex-1">
            <div className="flex flex-col gap-2.5">
              <Logo className="self-start" />
              <p className="al-p max-w-[340px] tab:max-w-[300px] desk:max-w-[340px]">
                L’outil qui transforme ton profil LinkedIn en opportunités&nbsp;: un poste, des
                clients, des conversations.
              </p>
            </div>
            <Button href={SIGNUP_HREF} className="self-start">
              Créer mon compte
            </Button>
          </div>

          {/* Sur tablette, les colonnes prennent la largeur de leurs liens (libellés français plus longs). */}
          <div className="flex flex-col gap-5 tab:flex-row tab:gap-8 desk:w-[500px] desk:gap-0">
            {COLUMNS.map((col) => (
              <div key={col.title} className="flex flex-col gap-3 desk:flex-1 desk:gap-4">
                <h5 className="al-h5 text-al-ink">{col.title}</h5>
                <ul className="flex flex-col gap-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        className="al-p block w-fit transition-colors duration-[400ms] [transition-timing-function:cubic-bezier(0.44,0,0.56,1)] hover:text-[#575757]"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2.5 border-t border-al-line pt-5 tab:flex-row tab:items-center tab:justify-between">
          <p className="al-p !text-al-ink">© 2026 Uptimizz</p>
          <p className="al-p !text-al-ink">Non affilié à LinkedIn</p>
        </div>
      </div>
    </footer>
  );
}
