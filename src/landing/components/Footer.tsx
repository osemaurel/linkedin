import { Button } from './primitives';
import { Logo } from './Navbar';

const COLUMNS = [
  {
    title: 'Sections',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Benefits', href: '#benefits' },
      { label: 'Integrations', href: '#integrations' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    title: 'Socials',
    links: [
      { label: 'Instagram', href: 'https://www.instagram.com/' },
      { label: 'Twitter/X', href: 'https://x.com/' },
      { label: 'Linkedin', href: 'https://www.linkedin.com/' },
    ],
  },
  {
    title: 'Pages',
    links: [
      { label: 'Home', href: '#top' },
      { label: 'Newsletter', href: '#newsletter' },
      { label: 'Blogs', href: '#blogs' },
      { label: '404', href: '#top' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="flex w-full justify-center bg-white shadow-[0_-1px_20px_rgba(0,0,0,0.03)]">
      <div className="flex w-full max-w-[1200px] flex-col gap-5 px-[21px] pb-5 pt-12 tab:px-8 desk:px-12">
        <div className="flex flex-col gap-5 tab:flex-row tab:gap-0">
          <div className="flex flex-col gap-5 tab:flex-1">
            <div className="flex flex-col gap-2.5">
              <Logo className="self-start" />
              <p className="al-p max-w-[340px] tab:max-w-[300px] desk:max-w-[340px]">
                Turn complex data into clear, actionable insights so you can make smarter decisions
                and drive growth with confidence
              </p>
            </div>
            <Button href="#pricing" className="self-start">
              Get Template
            </Button>
          </div>

          <div className="flex flex-col gap-5 tab:w-1/2 tab:flex-row desk:w-[500px]">
            {COLUMNS.map((col) => (
              <div key={col.title} className="flex flex-col gap-3 tab:flex-1 desk:gap-4">
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
          <a href="https://x.com/axadkhaleel" className="al-p !text-al-ink">
            Template by Asad Khaleel
          </a>
          <p className="al-p !text-al-ink">
            <a href="https://framer.link/asadkhaleel">Built in Framer</a> . © 2024 Alytics
          </p>
        </div>
      </div>
    </footer>
  );
}
