import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { svg } from '../assets';
import { SIGNUP_HREF } from '../components/links';
import { Button, InlineSvg, Reveal, Section, SectionHeading } from '../components/primitives';

const toggleSpring = { type: 'spring', stiffness: 500, damping: 60, mass: 1 } as const;

/**
 * Packs de crédits, aux prix enregistrés au centre de contrôle au moment de l'écriture.
 * Les prix sont recopiés ici : la page d'accueil est publique et ne les lit pas encore en base.
 */
const PLANS = [
  {
    name: 'Découverte',
    credits: 10,
    price: 1000,
    text: 'Pour lancer ton premier audit.',
    points: [
      '10 crédits',
      'Ton audit et tes réécritures',
      'Toutes les fonctionnalités',
      'Paiement mobile money',
      'Sans abonnement',
    ],
  },
  {
    name: 'Essentiel',
    credits: 30,
    price: 2500,
    text: 'Pour optimiser ton profil et publier.',
    points: [
      '30 crédits',
      'Audit, stratégie et plan éditorial',
      'Des posts rédigés dans ta voix',
      'Paiement mobile money',
      'Sans abonnement',
    ],
    popular: true,
  },
  {
    name: 'Pro',
    credits: 80,
    price: 6000,
    text: 'Pour aller jusqu’à la prospection.',
    points: [
      '80 crédits, le meilleur prix',
      'Tout le parcours, plusieurs fois',
      'Images et carrousels pour tes posts',
      'Messages d’approche personnalisés',
      'Sans abonnement',
    ],
  },
];

/** Parité fixe du franc CFA : 1 € = 655,957 F CFA. */
const XOF_PER_EUR = 655.957;
// Espace insécable pleine largeur : l'espace fine d'Intl disparaît presque à cette taille.
const fcfa = new Intl.NumberFormat('fr-FR');
const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const formatPrice = (xof: number, inEuro: boolean) =>
  inEuro
    ? euro.format(xof / XOF_PER_EUR)
    : `${fcfa.format(xof).replace(/\u202f/g, '\u00a0')}\u00a0F`;

/** Interrupteur F CFA / euros : la pastille bleue glisse sous l'option choisie. */
function CurrencyToggle({ inEuro, onChange }: { inEuro: boolean; onChange: (v: boolean) => void }) {
  const left = useRef<HTMLButtonElement>(null);
  const right = useRef<HTMLButtonElement>(null);
  const [boxes, setBoxes] = useState<{ x: number; w: number }[]>([]);

  // La pastille épouse la largeur réelle de chaque option (textes de longueurs différentes).
  useLayoutEffect(() => {
    const measure = () =>
      setBoxes(
        [left.current, right.current].map((el) => ({
          x: (el?.offsetLeft ?? 0) - 2,
          w: (el?.offsetWidth ?? 0) + 4,
        })),
      );
    measure();
    void document.fonts?.ready.then(measure);
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  const target = boxes[inEuro ? 1 : 0];

  return (
    <div className="flex rounded-2xl bg-white p-1 shadow-[0_1px_20px_rgba(0,0,0,0.03)]">
      <div
        role="radiogroup"
        aria-label="Monnaie d’affichage"
        className="relative flex gap-1 rounded-xl bg-al-page p-1"
      >
        {target && (
          <motion.div
            aria-hidden="true"
            className="absolute bottom-0.5 top-0.5 rounded-[10px] bg-al-blue/[0.12]"
            initial={false}
            animate={{ left: target.x, width: target.w }}
            transition={toggleSpring}
          />
        )}
        <button
          ref={left}
          type="button"
          role="radio"
          aria-checked={!inEuro}
          onClick={() => onChange(false)}
          className="relative flex h-10 items-center rounded-[10px] px-4"
        >
          <motion.span
            className="al-p"
            initial={false}
            animate={{ color: inEuro ? '#575757cc' : '#126dfb' }}
            transition={toggleSpring}
          >
            F CFA
          </motion.span>
        </button>
        <button
          ref={right}
          type="button"
          role="radio"
          aria-checked={inEuro}
          onClick={() => onChange(true)}
          className="relative flex h-10 items-center gap-2.5 rounded-[10px] pl-2.5 pr-1"
        >
          <motion.span
            className="al-p"
            initial={false}
            animate={{ color: inEuro ? '#126dfb' : '#575757cc' }}
            transition={toggleSpring}
          >
            Euros
          </motion.span>
          <span
            className="al-inner-border relative flex h-6 items-center overflow-hidden rounded-md px-1.5"
            style={{ '--al-border-color': '#126dfb' } as CSSProperties}
          >
            <motion.span
              aria-hidden="true"
              className="absolute inset-0 bg-al-blue"
              initial={false}
              animate={{ opacity: inEuro ? 1 : 0 }}
              transition={toggleSpring}
            />
            <motion.span
              className="al-p12 relative whitespace-nowrap"
              initial={false}
              animate={{ color: inEuro ? '#ffffff' : '#126dfb' }}
              transition={toggleSpring}
            >
              1 € = 656 F
            </motion.span>
          </span>
        </button>
      </div>
    </div>
  );
}

/** Prix qui change : l'ancien monte et s'efface, le nouveau arrive d'en bas. */
function Price({ value }: { value: string }) {
  return (
    <div className="relative h-[1.2em] overflow-visible text-[28px] tab:text-[38px] desk:text-[48px]">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          className="al-h2 block whitespace-nowrap"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={toggleSpring}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function PlanCard({ plan, inEuro }: { plan: (typeof PLANS)[number]; inEuro: boolean }) {
  const body = (
    <div className={`flex w-full flex-col bg-white ${plan.popular ? 'rounded-[18px]' : ''}`}>
      <div className="flex w-full flex-col gap-6 p-5">
        <p className="al-p14 !text-al-ink">Pack {plan.name}</p>
        <div className="flex w-full flex-col gap-2.5">
          <div className="flex items-center gap-1">
            <Price value={formatPrice(plan.price, inEuro)} />
            <span className="al-p14 whitespace-nowrap">/ {plan.credits} crédits</span>
          </div>
          <p className="al-p">{plan.text}</p>
        </div>
        <Button href={SIGNUP_HREF} className="w-full">
          Choisir ce pack
        </Button>
      </div>
      <div className="flex w-full flex-col gap-4 px-5 pb-5 pt-1">
        <p className="al-p12">Ce que tu peux en faire</p>
        <ul className="flex w-full flex-col gap-3">
          {plan.points.map((p) => (
            <li key={p} className="flex items-center gap-1.5">
              <InlineSvg svg={svg.check} className="h-3.5 w-3.5 text-al-ink" />
              <span className="al-p14 !text-al-ink">{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  if (!plan.popular) return <article className="al-card w-full overflow-hidden">{body}</article>;
  return (
    <article className="al-pop flex w-full flex-col items-center gap-2 rounded-[20px] bg-al-blue px-1 pb-1 pt-2">
      <p className="al-p14 !text-white">Recommandé</p>
      {body}
    </article>
  );
}

export function Pricing() {
  const [inEuro, setInEuro] = useState(false);
  return (
    <Section id="pricing" containerClassName="gap-10 tab:gap-12 desk:gap-14">
      <SectionHeading
        tag="Tarifs"
        title="Des crédits, sans abonnement"
        text="Tu recharges quand tu en as besoin. Une action n’est débitée que si elle réussit."
      />
      <Reveal y={60} delay={0.4} amount={0} className="flex w-full flex-col items-center gap-10">
        <CurrencyToggle inEuro={inEuro} onChange={setInEuro} />
        <div className="flex w-full flex-col items-stretch gap-5 desk:flex-row desk:items-end">
          {PLANS.map((p) => (
            <div key={p.name} className="desk:flex-1">
              <PlanCard plan={p} inEuro={inEuro} />
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}

const OTHERS = [
  'Un profil qui ne dit pas ce que tu cherches',
  'Des heures à chercher quoi écrire',
  'Des conseils génériques, souvent en anglais',
  'Des messages qui restent sans réponse',
  'Aucune idée de ce qui progresse',
];
const OURS = [
  'Un audit et des réécritures à copier',
  'Une stratégie et un plan de publication',
  'Des posts rédigés dans ta voix',
  'Les bonnes personnes, les bons messages',
  'Un score qui montre tes progrès',
];

export function Comparison() {
  return (
    <Section id="why" containerClassName="gap-10 tab:gap-12 desk:gap-14">
      <SectionHeading
        tag="Pourquoi nous"
        title="Arrête de deviner ce qui marche"
        text="Un parcours guidé plutôt que des conseils épars et des essais au hasard."
      />
      <Reveal y={60} delay={0.4} amount={0} className="flex w-full justify-center">
        <div className="al-card flex w-full max-w-[800px] flex-col gap-5 p-2.5 tab:flex-row">
          <div className="flex flex-1 flex-col gap-5 p-5">
            <h3 className="al-h3">Seul face à LinkedIn</h3>
            <ul className="flex flex-col gap-3">
              {OTHERS.map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <InlineSvg svg={svg.cross} className="h-4 w-4 text-al-gray" />
                  <span className="al-p">{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="al-ours flex flex-1 flex-col gap-5 rounded-[14px] bg-white p-5 tab:rounded-[20px]">
            <div className="flex items-center gap-1.5">
              <InlineSvg svg={svg.logo} className="h-[30px] w-[30px]" />
              <h3 className="al-h3">Uptimizz</h3>
            </div>
            <ul className="flex flex-col gap-3">
              {OURS.map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <InlineSvg svg={svg.check} className="h-4 w-4 text-al-ink" />
                  <span className="al-p !text-al-ink">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

const FAQS = [
  {
    q: 'Faut-il donner mon mot de passe LinkedIn ?',
    a: 'Non, jamais. Tu importes le PDF de ton profil, que LinkedIn génère en un clic, ou tu colles tes sections. L’outil ne se connecte pas à ton compte.',
  },
  {
    q: 'Comment fonctionnent les crédits ?',
    a: 'Tu achètes un pack, sans abonnement. Chaque action affiche son coût avant que tu la lances, et les crédits ne sont débités que si elle réussit.',
  },
  {
    q: 'Comment se passe le paiement ?',
    a: 'Par mobile money, sur la page sécurisée de notre partenaire de paiement. Pas besoin de carte bancaire, et rien n’est prélevé automatiquement.',
  },
  {
    q: 'Je n’ai pas encore de profil LinkedIn. Ça marche quand même ?',
    a: 'Oui. Indique-le au démarrage : l’outil construit ton profil avec toi, section par section, prêt à copier sur LinkedIn.',
  },
  {
    q: 'L’outil publie-t-il à ma place ?',
    a: 'Non, tu gardes la main. Tu copies tes textes, tes posts et tes messages, puis tu les publies toi-même sur LinkedIn.',
  },
];

/** Question dépliable : le « + » tourne en « – », la réponse s'ouvre en hauteur. */
function FaqItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  return (
    <div className="w-full overflow-hidden rounded-2xl bg-white shadow-[0_1px_20px_rgba(0,0,0,0.03)]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 px-5 py-4 text-left"
      >
        <span className="al-h6 flex-1 text-al-ink">{q}</span>
        <span aria-hidden="true" className="relative h-[30px] w-[30px] shrink-0">
          <motion.span
            className="absolute left-[calc(53.33%-1px)] top-2 h-3.5 w-0.5 bg-al-ink"
            initial={false}
            animate={{ rotate: open ? 270 : 0 }}
            transition={toggleSpring}
          />
          <motion.span
            className="absolute left-[calc(53.33%-1px)] top-2 h-3.5 w-0.5 bg-al-ink"
            initial={false}
            animate={{ rotate: open ? 270 : 90 }}
            transition={toggleSpring}
          />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={toggleSpring}
            className="overflow-hidden"
          >
            <div className="h-px w-full bg-al-line" />
            <div className="px-5 py-4">
              <p className="al-p text-balance">{a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Faq() {
  return (
    <Section id="faq" containerClassName="gap-10 tab:gap-12 desk:gap-14">
      <SectionHeading
        tag="FAQ"
        title="Tes questions, nos réponses"
        text="Ce qu’on nous demande le plus souvent avant de commencer."
      />
      <Reveal y={60} delay={0.4} amount={0} className="flex w-full max-w-[800px] flex-col gap-5">
        {FAQS.map((f, i) => (
          <FaqItem key={f.q} q={f.q} a={f.a} defaultOpen={i === 0} />
        ))}
      </Reveal>
    </Section>
  );
}
