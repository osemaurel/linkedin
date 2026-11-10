import { useEffect, useState, type CSSProperties } from 'react';
import { animate, motion, useMotionValue } from 'motion/react';
import { img, integrationLogos } from '../assets';
import { PathTicker } from '../components/PathTicker';
import { Button, Reveal, Section, SectionHeading, Tag } from '../components/primitives';
import { Ticker } from '../components/Ticker';

/** Suit une requête média (ex. « téléphone ») pour les rares choix faits en JavaScript. */
function useMedia(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);
  return matches;
}

const integrationTiles = integrationLogos.map((l) => (
  <div
    key={l.name}
    className="flex h-[66px] w-[66px] items-center justify-center overflow-hidden rounded-xl bg-al-tile"
  >
    <img src={l.src} alt={l.name} className="h-10 w-10" draggable={false} />
  </div>
));

export function Integrations() {
  const phone = useMedia('(max-width: 809.98px)');
  return (
    <Section id="integrations">
      <Reveal y={60} delay={0.2} className="w-full">
        <div className="al-card relative flex min-h-[550px] w-full items-center justify-center overflow-hidden p-10">
          {/* Logos sur la spirale, effacés au centre (derrière le texte) et sur les bords. */}
          <PathTicker
            items={integrationTiles}
            repeat={phone ? 5 : 4}
            scale={phone ? 0.6 : 1}
            className="pointer-events-none absolute left-[-60%] top-[calc(50%-70vh)] z-[1] h-[140vh] w-[220%] tab:left-[-25%] tab:w-[150%] desk:left-[-20%] desk:w-[140%]"
            style={
              {
                maskImage:
                  'radial-gradient(43% 54% at 46.5% 45.2%, #0000 10.1967%, #000000d6 70%, #0000 100%)',
                WebkitMaskImage:
                  'radial-gradient(43% 54% at 46.5% 45.2%, #0000 10.1967%, #000000d6 70%, #0000 100%)',
              } as CSSProperties
            }
          />
          <div className="relative z-[2] flex w-full flex-col items-center gap-5 text-center">
            <div className="flex flex-col items-center gap-2.5">
              <Tag>Integrations</Tag>
              <div className="flex flex-col items-center gap-2">
                <h2 className="al-h2 max-w-[500px] text-balance">Seamless Integrations</h2>
                <p className="al-p max-w-[450px] text-balance">
                  Connect Alytics with your favorite tools to streamline workflows and keep
                  everything running smoothly.
                </p>
              </div>
            </div>
            <Button href="#pricing">Get Started Now</Button>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

const TESTIMONIALS = [
  {
    quote:
      '"I’ve tried nearly every analytics tool out there, and Alytics is by far the most intuitive. No need for devs to set things up—our marketing team was running insights independently in hours."',
    name: 'Carter June',
    role: 'Support Lead, Peakflow',
    avatar: img.avatarCarterJune,
  },
  {
    quote:
      '"It’s like product analytics finally caught up with design. We use Alytics not just for numbers—but to tell the story behind them. It’s become our go-to tool for every launch."',
    name: 'Elena Park',
    role: 'Growth Lead, Launchpad',
    avatar: img.avatarElenaPark,
  },
  {
    quote:
      '"We used Alytics to track onboarding drop-off and spotted a friction point instantly. After one small UX tweak, our activation rate jumped by 23%."',
    name: 'James Nair',
    role: 'Lead Developer, Driftwave',
    avatar: img.avatarJamesNair,
  },
  {
    quote:
      '"Alytics gave us visibility we didn’t even know we were missing. Within the first week, we discovered which features were actually driving retention. It’s clean and fast."',
    name: 'Sarah Bond',
    role: 'CEO, NovaCo',
    avatar: img.avatarSarahBond,
  },
  {
    quote:
      '"Since switching to Alytics, we finally understand how users interact with our product. The event tracking is super intuitive and actionable."',
    name: 'Marcus Lee',
    role: 'Head of Design, Stackly',
    avatar: img.avatarMarcusLee,
  },
];

function TestimonialCard({
  t,
  className = '',
  style,
}: {
  t: (typeof TESTIMONIALS)[number];
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <figure
      className={`al-card flex min-h-[320px] shrink-0 flex-col justify-between ${className}`}
      style={style}
    >
      <div className="flex flex-col gap-4 p-6">
        <img
          src={img.stars}
          alt="5 étoiles sur 5"
          className="h-[18px] w-[98px]"
          draggable={false}
        />
        <blockquote className="al-p text-balance">{t.quote}</blockquote>
      </div>
      <figcaption className="flex items-center gap-3 p-6">
        <img
          src={t.avatar}
          alt=""
          className="h-12 w-12 rounded-xl object-cover"
          draggable={false}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="al-p !text-al-ink">{t.name}</p>
          <p className="al-p14">{t.role}</p>
        </div>
      </figcaption>
    </figure>
  );
}

function Arrow({ dir, onClick }: { dir: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={dir === 'left' ? 'Témoignage précédent' : 'Témoignage suivant'}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-al-blue text-white"
    >
      <svg width="12" height="20" viewBox="0 0 12 20" fill="none" aria-hidden="true">
        <path
          d={dir === 'left' ? 'M10 2 2 10l8 8' : 'm2 2 8 8-8 8'}
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

/** Téléphone : une carte à la fois, flèches en bas à droite, glisser au doigt, sans fin. */
function TestimonialSlider() {
  const n = TESTIMONIALS.length;
  const [index, setIndex] = useState(n); // on part de la copie du milieu
  const [width, setWidth] = useState(358);
  const x = useMotionValue(0);
  const gap = 20;
  const step = width + gap;

  useEffect(() => {
    const controls = animate(x, -index * step, {
      type: 'spring',
      stiffness: 200,
      damping: 40,
      mass: 1,
      onComplete: () => {
        // Retour silencieux sur la copie du milieu : la boucle paraît sans fin.
        if (index < n || index >= 2 * n) {
          const wrapped = (((index % n) + n) % n) + n;
          x.set(-wrapped * step);
          setIndex(wrapped);
        }
      },
    });
    return () => controls.stop();
  }, [index, step, n, x]);

  return (
    <div
      className="flex w-full flex-col gap-[46px]"
      ref={(el) => {
        if (el && el.offsetWidth && el.offsetWidth !== width) setWidth(el.offsetWidth);
      }}
    >
      <div className="w-full overflow-visible">
        <motion.div
          className="flex"
          style={{ x, gap }}
          drag="x"
          dragMomentum={false}
          onDragEnd={(_, info) => {
            if (info.offset.x < -50) setIndex((i) => i + 1);
            else if (info.offset.x > 50) setIndex((i) => i - 1);
            else animate(x, -index * step, { type: 'spring', stiffness: 200, damping: 40 });
          }}
        >
          {[...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
            <TestimonialCard key={i} t={t} style={{ width }} />
          ))}
        </motion.div>
      </div>
      <div className="flex justify-end gap-2.5 p-1">
        <Arrow dir="left" onClick={() => setIndex((i) => i - 1)} />
        <Arrow dir="right" onClick={() => setIndex((i) => i + 1)} />
      </div>
    </div>
  );
}

export function Testimonials() {
  const phone = useMedia('(max-width: 809.98px)');
  return (
    <Section id="testimonials" containerClassName="gap-10 tab:gap-12 desk:gap-14">
      <SectionHeading
        tag="Testimonials"
        title="Hear what others say about us"
        text="See what top teams say after switching to a smarter product analytics platform."
      />
      <div className="flex w-full flex-col items-center gap-4 desk:gap-6">
        {phone ? (
          <TestimonialSlider />
        ) : (
          <Ticker
            gap={20}
            velocity={50}
            className="w-full rounded-[10px]"
            style={
              {
                maskImage: 'linear-gradient(270deg, #0000 0%, #000 7.47% 92.53%, #0000 100%)',
                WebkitMaskImage: 'linear-gradient(270deg, #0000 0%, #000 7.47% 92.53%, #0000 100%)',
              } as CSSProperties
            }
            items={TESTIMONIALS.map((t) => (
              <TestimonialCard key={t.name} t={t} className="w-[340px]" />
            ))}
          />
        )}
      </div>
    </Section>
  );
}
