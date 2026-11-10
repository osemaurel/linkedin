import { useEffect, useState, type CSSProperties } from 'react';
import { animate, motion, useMotionValue } from 'motion/react';
import {
  Briefcase,
  Building2,
  GraduationCap,
  Megaphone,
  Shuffle,
  type LucideIcon,
} from 'lucide-react';
import { FLAGS } from '../components/flagData';
import { Flag } from '../components/Illustrations';
import { SIGNUP_HREF } from '../components/links';
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

/** Drapeaux de l'Afrique francophone sur la spirale, à la place des logos d'intégration. */
const flagTiles = FLAGS.map((f) => (
  <div
    key={f.code}
    className="flex h-[66px] w-[66px] items-center justify-center overflow-hidden rounded-xl bg-al-tile"
  >
    <Flag art={f.art} label={f.name} className="h-[27px] w-10 overflow-hidden rounded-[4px]" />
  </div>
));

export function Africa() {
  const phone = useMedia('(max-width: 809.98px)');
  return (
    <Section id="afrique">
      <Reveal y={60} delay={0.2} className="w-full">
        <div className="al-card relative flex min-h-[550px] w-full items-center justify-center overflow-hidden p-10">
          {/* Drapeaux sur la spirale, effacés au centre (derrière le texte) et sur les bords. */}
          <PathTicker
            items={flagTiles}
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
              <Tag>Afrique francophone</Tag>
              <div className="flex flex-col items-center gap-2">
                <h2 className="al-h2 max-w-[500px] text-balance">Pensé pour ton marché</h2>
                <p className="al-p max-w-[450px] text-balance">
                  Des exemples, des métiers et des entreprises qui te parlent. Un outil conçu en
                  français dès le départ, pas une simple traduction.
                </p>
              </div>
            </div>
            <Button href={SIGNUP_HREF}>Créer mon compte</Button>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

/**
 * Situations types, à la place des témoignages de l'original : rien n'est présenté comme
 * l'avis d'un vrai client. Chaque carte décrit un objectif et ce que l'outil apporte.
 */
const AUDIENCES: {
  goal: string;
  text: string;
  who: string;
  detail: string;
  icon: LucideIcon;
}[] = [
  {
    goal: 'Décrocher un poste',
    text: 'Tu sors d’école ou tu veux changer de poste. L’audit te montre ce que voient les recruteurs, puis réécrit ton titre et ton résumé pour qu’ils te trouvent.',
    who: 'Étudiants et jeunes diplômés',
    detail: 'Premier emploi, stage, alternance',
    icon: GraduationCap,
  },
  {
    goal: 'Trouver des clients',
    text: 'Tu es freelance ou consultant. Ton profil devient la vitrine claire de ton offre, et Mon réseau t’aide à aborder les bons décideurs.',
    who: 'Freelances et consultants',
    detail: 'Prestataires de services',
    icon: Briefcase,
  },
  {
    goal: 'Développer ta visibilité',
    text: 'Tu veux devenir une référence dans ton domaine. Tes piliers de contenu et ton plan éditorial t’aident à publier avec régularité, dans ta voix.',
    who: 'Experts et cadres',
    detail: 'Image et autorité sur un sujet',
    icon: Megaphone,
  },
  {
    goal: 'Trouver des clients',
    text: 'Tu lances ou fais grandir ton entreprise. Tu cibles les bons profils, tu reçois des recherches LinkedIn prêtes à coller et des messages qui donnent envie de répondre.',
    who: 'Entrepreneurs',
    detail: 'PME et jeunes entreprises',
    icon: Building2,
  },
  {
    goal: 'Décrocher un poste',
    text: 'Tu changes de secteur. Ton profil raconte ton parcours sous un angle neuf, et tes posts installent ta crédibilité dans ton nouveau domaine.',
    who: 'Profils en reconversion',
    detail: 'Nouveau secteur, nouveau métier',
    icon: Shuffle,
  },
];

function AudienceCard({
  t,
  className = '',
  style,
}: {
  t: (typeof AUDIENCES)[number];
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <article
      className={`al-card flex min-h-[320px] shrink-0 flex-col justify-between ${className}`}
      style={style}
    >
      <div className="flex flex-col items-start gap-4 p-6">
        <span className="rounded-md bg-al-tag px-2 py-0.5 text-[12px] leading-[14px] tracking-[-0.04em] text-al-blue">
          {t.goal}
        </span>
        <p className="al-p text-balance">{t.text}</p>
      </div>
      <div className="flex items-center gap-3 p-6">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-al-tag text-al-blue">
          <t.icon aria-hidden="true" className="h-6 w-6" strokeWidth={2} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="al-p !text-al-ink">{t.who}</p>
          <p className="al-p14">{t.detail}</p>
        </div>
      </div>
    </article>
  );
}

function Arrow({ dir, onClick }: { dir: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={dir === 'left' ? 'Profil précédent' : 'Profil suivant'}
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
  const n = AUDIENCES.length;
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
          {[...AUDIENCES, ...AUDIENCES, ...AUDIENCES].map((t, i) => (
            <AudienceCard key={i} t={t} style={{ width }} />
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

export function Audiences() {
  const phone = useMedia('(max-width: 809.98px)');
  return (
    <Section id="pour-qui" containerClassName="gap-10 tab:gap-12 desk:gap-14">
      <SectionHeading
        tag="Pour qui ?"
        title="Un outil pour chaque objectif"
        text="Un poste, des clients ou de la visibilité : les recommandations suivent ton objectif."
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
            items={AUDIENCES.map((t) => (
              <AudienceCard key={t.who} t={t} className="w-[340px]" />
            ))}
          />
        )}
      </div>
    </Section>
  );
}
