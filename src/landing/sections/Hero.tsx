import { useRef, type CSSProperties } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import {
  Briefcase,
  Calculator,
  CalendarDays,
  CodeXml,
  Gauge,
  GraduationCap,
  Handshake,
  Laptop,
  Lightbulb,
  PenLine,
  Rocket,
  Scale,
  Stethoscope,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { img, svg } from '../assets';
import { FRAMER_EASE } from '../components/anim';
import { FLAGS } from '../components/flagData';
import { Flag } from '../components/Illustrations';
import { SIGNUP_HREF } from '../components/links';
import { Button, InlineSvg } from '../components/primitives';
import { Ticker } from '../components/Ticker';

/** Apparition au chargement (effet « Appear » de Framer) : ressort, délai et décalage exacts. */
const appear = (y: number, delay: number, extra: Record<string, number> = {}) => ({
  initial: { opacity: 0.001, y },
  animate: { opacity: 1, y: 0, ...extra },
  transition: { type: 'spring' as const, stiffness: 500, damping: 60, mass: 1, delay },
});

/**
 * Icônes flottantes, une par grand module (audit, réseau, Studio, plan éditorial) :
 * inclinaison d'arrivée, puis deux boucles aller-retour (rotation de l'enveloppe, montée et
 * descente du contenu), aux durées de l'original.
 */
const FLOATING: {
  pos: string;
  tilt: number;
  spin: number;
  spinFor: number;
  lift: number;
  liftFor: number;
  delay: number;
  icon: LucideIcon;
  color: string;
}[] = [
  {
    pos: 'top-[30px] left-[60px] tab:max-desk:-top-8 tab:max-desk:left-7',
    tilt: -8,
    spin: 18,
    spinFor: 3.5,
    lift: -15,
    liftFor: 2.5,
    delay: 0.5,
    icon: Gauge,
    color: '#126dfb',
  },
  {
    pos: 'top-[250px] left-[60px] tab:max-desk:left-10',
    tilt: -8,
    spin: -10,
    spinFor: 3,
    lift: 25,
    liftFor: 2,
    delay: 0.5,
    icon: Users,
    color: '#121212',
  },
  {
    pos: 'top-[30px] right-[60px] tab:max-desk:-top-8 tab:max-desk:right-8',
    tilt: 8,
    spin: -18,
    spinFor: 4,
    lift: -22,
    liftFor: 3,
    delay: 0.6,
    icon: PenLine,
    color: '#ff5a1f',
  },
  {
    pos: 'top-[250px] right-[80px] tab:max-desk:right-10',
    tilt: 8,
    spin: 14,
    spinFor: 3.5,
    lift: 25,
    liftFor: 2.5,
    delay: 0.5,
    icon: CalendarDays,
    color: '#2236f2',
  },
];

function FloatingIcon({ index }: { index: number }) {
  const f = FLOATING[index];
  return (
    <motion.div
      aria-hidden="true"
      className={`absolute z-[3] hidden tab:flex ${f.pos}`}
      initial={{ opacity: 0.001, y: 20, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate: f.tilt }}
      transition={{ type: 'spring', stiffness: 500, damping: 60, mass: 1, delay: f.delay }}
    >
      <motion.div
        animate={{ rotate: [0, f.spin] }}
        transition={{
          duration: f.spinFor,
          ease: FRAMER_EASE,
          repeat: Infinity,
          repeatType: 'mirror',
        }}
      >
        <motion.div
          animate={{ y: [0, f.lift] }}
          transition={{
            duration: f.liftFor,
            ease: FRAMER_EASE,
            repeat: Infinity,
            repeatType: 'mirror',
          }}
        >
          <div className="al-mirror relative flex h-[65px] w-[65px] items-center justify-center overflow-hidden rounded-xl bg-al-page desk:h-20 desk:w-20">
            <f.icon
              aria-hidden="true"
              className="h-8 w-8 desk:h-10 desk:w-10"
              style={{ color: f.color }}
              strokeWidth={2.2}
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Tableau de bord incliné de 30° qui se redresse en défilant, de l'entrée en bas de
 * l'écran jusqu'à ce que son bas atteigne le bas de l'écran (ressort de l'original).
 */
function Dashboard() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const tilt = useTransform(scrollYProgress, [0, 1], [30, 0]);
  const rotateX = useSpring(tilt, { stiffness: 1000, damping: 100, mass: 1 });
  return (
    <div ref={ref} className="flex w-full flex-col items-center">
      <motion.div
        className="w-full"
        style={{ rotateX, transformPerspective: 1200 }}
        initial={{ opacity: 0.001, y: 150 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 80, mass: 2, delay: 0.6 }}
      >
        <div className="al-dash-glow relative aspect-[1.53333] w-full rounded-lg tab:rounded-[19px] desk:rounded-[28px]">
          <img
            src={img.heroDashboard}
            alt="Tableau de bord d’Uptimizz : prochaine étape, score du profil, avancement et activité récente"
            className="absolute inset-0 h-full w-full rounded-[inherit] object-cover"
          />
        </div>
      </motion.div>
    </div>
  );
}

const PROFILES: { icon: LucideIcon; label: string }[] = [
  { icon: GraduationCap, label: 'Étudiants' },
  { icon: Scale, label: 'Juristes' },
  { icon: Wrench, label: 'Ingénieurs' },
  { icon: Handshake, label: 'Commerciaux' },
  { icon: Lightbulb, label: 'Consultants' },
  { icon: Laptop, label: 'Freelances' },
  { icon: Rocket, label: 'Entrepreneurs' },
  { icon: Briefcase, label: 'Cadres' },
  { icon: Calculator, label: 'Comptables' },
  { icon: CodeXml, label: 'Développeurs' },
  { icon: Stethoscope, label: 'Santé' },
];

/** Bandeau des profils visés, à la place des logos clients de l'original. */
function Profiles() {
  return (
    <div className="flex w-full flex-col items-center gap-5 desk:gap-6">
      <h5 className="al-h5 text-center text-al-ink">Pensé pour tous les profils</h5>
      <div className="w-[calc(100%-20px)] tab:w-[72%]">
        <div className="px-4 opacity-70 tab:px-5">
          <Ticker
            gap={64}
            velocity={50}
            style={
              {
                maskImage:
                  'linear-gradient(270deg, #0000 0%, #000 20.6%, #000 50%, #000 80%, #0000 100%)',
                WebkitMaskImage:
                  'linear-gradient(270deg, #0000 0%, #000 20.6%, #000 50%, #000 80%, #0000 100%)',
              } as CSSProperties
            }
            items={PROFILES.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex h-[35px] items-center gap-2 whitespace-nowrap text-[22px] tracking-[-0.04em] text-[#0a0d12]"
              >
                <Icon aria-hidden="true" className="h-6 w-6" strokeWidth={2.4} />
                {label}
              </span>
            ))}
          />
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section id="top" className="flex w-full justify-center">
      <div className="relative flex w-full max-w-[1200px] flex-col items-center gap-10 px-4 pb-[60px] pt-[120px] tab:gap-12 tab:px-8 tab:pb-20 tab:pt-[140px] desk:gap-14 desk:px-12 desk:pb-[100px] desk:pt-40">
        {/* Repère des icônes : le conteneur de 1200 px sans ses marges, comme l'original. */}
        <div className="pointer-events-none absolute inset-x-0 top-[120px] tab:top-[140px] desk:top-40">
          {FLOATING.map((_, i) => (
            <FloatingIcon key={i} index={i} />
          ))}
        </div>

        <div className="flex w-full flex-col items-center gap-5">
          <div className="flex w-full flex-col items-center gap-2.5 tab:gap-5">
            <motion.div
              {...appear(40, 0.1)}
              className="al-inner-border flex items-center gap-1.5 overflow-hidden rounded-xl bg-al-tag py-2 pl-2 pr-3"
              style={{ '--al-border-color': '#126dfb' } as CSSProperties}
            >
              <div className="relative h-[22px] w-[58px]">
                {FLAGS.slice(0, 3).map((f, i) => (
                  <span
                    key={f.code}
                    className="absolute top-0 h-[22px] w-[22px]"
                    style={{ left: [0, 18, 34][i] }}
                  >
                    <Flag
                      art={f.art}
                      label={f.name}
                      className="block h-[22px] w-[22px] overflow-hidden rounded-[20%] shadow-[0_0_0_2px_#e1eaf8]"
                    />
                  </span>
                ))}
              </div>
              <p className="al-p14 whitespace-pre !text-al-blue">
                Pensé pour l’Afrique francophone
              </p>
            </motion.div>

            <div className="flex w-full flex-col items-center gap-2.5 text-center">
              <motion.h1 {...appear(60, 0.2)} className="al-h1 w-full max-w-[700px] text-balance">
                Transforme ton profil LinkedIn en opportunités
              </motion.h1>
              <motion.p
                {...appear(80, 0.3)}
                className="al-p w-full max-w-[300px] text-balance tab:max-w-[400px]"
              >
                Audit, réécritures prêtes à copier, posts et prospection&nbsp;: tout pour décrocher
                un poste ou des clients.
              </motion.p>
            </div>
          </div>

          <motion.div {...appear(60, 0.4)} className="flex flex-col items-center gap-2.5">
            <Button href={SIGNUP_HREF}>Créer mon compte</Button>
            <div className="flex items-center gap-[5px]">
              <InlineSvg svg={svg.creditCard} className="h-[21px] w-[21px] text-al-blue" />
              <p className="al-p14 !text-al-ink">
                Sans carte bancaire&nbsp;: paiement mobile money
              </p>
            </div>
          </motion.div>
        </div>

        <Dashboard />
        <Profiles />
      </div>
    </section>
  );
}
