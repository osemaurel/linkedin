import { useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { svg } from '../assets';
import { Button, InlineSvg, Reveal, Section, SectionHeading } from '../components/primitives';

const toggleSpring = { type: 'spring', stiffness: 500, damping: 60, mass: 1 } as const;

const PLANS = [
  {
    name: 'Starter',
    monthly: '$39',
    yearly: '$139',
    text: 'Great for small teams getting started.',
    points: [
      '5,000 tracked users',
      'Core analytics',
      'Simple dashboards',
      'Email support',
      'Weekly reports',
    ],
  },
  {
    name: 'Growth',
    monthly: '$99',
    yearly: '$199',
    text: 'For fast-growing teams who are scaling.',
    points: [
      'Everything in starter',
      '50,000 tracked users',
      'Funnel & drop-off analysis',
      'Custom dashboards',
      'Team collaboration tools',
    ],
    popular: true,
  },
  {
    name: 'Premium',
    monthly: '$299',
    yearly: '$599',
    text: 'Great for enterprizes to convert more.',
    points: [
      'All Growth features',
      'Unlimited tracked users',
      'Dedicated account manager',
      'SLA & compliance support',
      'Advanced integrations',
    ],
  },
];

/** Interrupteur Mensuel / Annuel : la pastille bleue glisse sous l'option choisie. */
function BillingToggle({ yearly, onChange }: { yearly: boolean; onChange: (y: boolean) => void }) {
  return (
    <div className="flex rounded-2xl bg-white p-1 shadow-[0_1px_20px_rgba(0,0,0,0.03)]">
      <div
        role="radiogroup"
        aria-label="Facturation"
        className="relative flex gap-1 rounded-xl bg-al-page p-1"
      >
        <motion.div
          aria-hidden="true"
          className="absolute bottom-0.5 top-0.5 rounded-[10px] bg-al-blue/[0.12]"
          initial={false}
          animate={yearly ? { left: '46%', width: '53%' } : { left: '2px', width: '46%' }}
          transition={toggleSpring}
        />
        <button
          type="button"
          role="radio"
          aria-checked={!yearly}
          onClick={() => onChange(false)}
          className="relative flex h-10 items-center rounded-[10px] px-4"
        >
          <motion.span
            className="al-p"
            initial={false}
            animate={{ color: yearly ? '#575757cc' : '#126dfb' }}
            transition={toggleSpring}
          >
            Monthly
          </motion.span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={yearly}
          onClick={() => onChange(true)}
          className="relative flex h-10 items-center gap-2.5 rounded-[10px] pl-2.5 pr-1"
        >
          <motion.span
            className="al-p"
            initial={false}
            animate={{ color: yearly ? '#126dfb' : '#575757cc' }}
            transition={toggleSpring}
          >
            Yearly
          </motion.span>
          <span
            className="al-inner-border relative flex h-6 items-center overflow-hidden rounded-md px-1.5"
            style={{ '--al-border-color': '#126dfb' } as CSSProperties}
          >
            <motion.span
              aria-hidden="true"
              className="absolute inset-0 bg-al-blue"
              initial={false}
              animate={{ opacity: yearly ? 1 : 0 }}
              transition={toggleSpring}
            />
            <motion.span
              className="al-p12 relative"
              initial={false}
              animate={{ color: yearly ? '#ffffff' : '#126dfb' }}
              transition={toggleSpring}
            >
              -20%
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
          className="al-h2 block !normal-case"
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

function PlanCard({ plan, yearly }: { plan: (typeof PLANS)[number]; yearly: boolean }) {
  const body = (
    <div className={`flex w-full flex-col bg-white ${plan.popular ? 'rounded-[18px]' : ''}`}>
      <div className="flex w-full flex-col gap-6 p-5">
        <p className="al-p14 !text-al-ink">{plan.name}</p>
        <div className="flex w-full flex-col gap-2.5">
          <div className="flex items-center gap-1">
            <Price value={yearly ? plan.yearly : plan.monthly} />
            <span className="al-p14">/month</span>
          </div>
          <p className="al-p">{plan.text}</p>
        </div>
        <Button href="#pricing" className="w-full">
          Get Started
        </Button>
      </div>
      <div className="flex w-full flex-col gap-4 px-5 pb-5 pt-1">
        <p className="al-p12">What's included</p>
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
      <p className="al-p14 !text-white">Most Popular</p>
      {body}
    </article>
  );
}

export function Pricing() {
  const [yearly, setYearly] = useState(false);
  return (
    <Section id="pricing" containerClassName="gap-10 tab:gap-12 desk:gap-14">
      <SectionHeading
        tag="Our Pricing"
        title="Choose the best Plan that suites you"
        text="Flexible pricing built for every stage — from startup to scale, no hidden fees."
      />
      <Reveal y={60} delay={0.4} amount={0} className="flex w-full flex-col items-center gap-10">
        <BillingToggle yearly={yearly} onChange={setYearly} />
        <div className="flex w-full flex-col items-stretch gap-5 desk:flex-row desk:items-end">
          {PLANS.map((p) => (
            <div key={p.name} className="desk:flex-1">
              <PlanCard plan={p} yearly={yearly} />
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}

const OTHERS = [
  'Data lives in too many places',
  'Reporting eats up hours',
  'Insights are too generic',
  'No smart guidance for decisions',
  'Hard to see what’s really working',
];
const OURS = [
  'All your metrics, one platform',
  'Track what drives growth',
  'Insights tailored to your goals',
  'AI suggests your next move',
  'Clear path to consistent growth',
];

export function Comparison() {
  return (
    <Section id="why" containerClassName="gap-10 tab:gap-12 desk:gap-14">
      <SectionHeading
        tag="Why Alytics"
        title="A smarter way to grow with data"
        text="Turn complex metrics into clear insights that help you make better decisions, faster."
      />
      <Reveal y={60} delay={0.4} amount={0} className="flex w-full justify-center">
        <div className="al-card flex w-full max-w-[800px] flex-col gap-5 p-2.5 tab:flex-row">
          <div className="flex flex-1 flex-col gap-5 p-5">
            <h3 className="al-h3">Other Tools</h3>
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
              <h3 className="al-h3">Alytics</h3>
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
    q: 'How does your platform track feature usage?',
    a: 'We automatically collect interaction data across your product and visualize which features are being used most — no manual tagging needed.',
  },
  {
    q: 'Do I need technical skills to use Alytics?',
    a: "Not at all. Alytics is built for teams of all sizes. Whether you're in marketing, product, or operations, the interface is intuitive and requires no coding.",
  },
  {
    q: 'Can Alytics integrate with tools we already use?',
    a: 'Yes. Alytics integrates with major tools like Stripe, Google Analytics, HubSpot, and more. You can also connect via API or no-code platforms.',
  },
  {
    q: 'Is my data secure on Alytics?',
    a: 'Absolutely. We use enterprise-grade encryption and follow best practices in data privacy and compliance.',
  },
  {
    q: 'Can I try Alytics before committing?',
    a: 'Yes, we offer a free trial so you can explore all features before upgrading to a paid plan.',
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
        tag="FAQ's"
        title="Common questions with Clear answers"
        text="Here are answers to the most common things people ask before getting started."
      />
      <Reveal y={60} delay={0.4} amount={0} className="flex w-full max-w-[800px] flex-col gap-5">
        {FAQS.map((f, i) => (
          <FaqItem key={f.q} q={f.q} a={f.a} defaultOpen={i === 0} />
        ))}
      </Reveal>
    </Section>
  );
}
