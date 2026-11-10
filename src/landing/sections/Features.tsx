import { img, svg } from '../assets';
import { InlineSvg, Reveal, Section, SectionHeading } from '../components/primitives';

const FEATURES: { image: string; title: string; text: string; tabletText?: string }[] = [
  {
    image: img.featureUnifiedMetrics,
    title: 'Unified Metrics',
    text: 'See your MRR and active users in one clean, unified view — no more switching tabs.',
  },
  {
    image: img.featureAiInsights,
    title: 'AI Growth Insights',
    text: 'Actionable suggestions from your data, without digging into spreadsheets or dashboards.',
    // Sur tablette, l'original raccourcit ce texte.
    tabletText: 'Actionable suggestions from your data, without digging into spreadsheets .',
  },
  {
    image: img.featureUsageTracking,
    title: 'Product Usage Tracking',
    text: 'Track how users engage with your app live to uncover patterns and optimize features.',
  },
  {
    image: img.featureImpactAnalysis,
    title: 'Feature Impact Analysis',
    text: 'Know exactly which features drive long-term retention—and which ones don’t.',
  },
];

export function Features() {
  return (
    <Section id="features" containerClassName="gap-10 tab:gap-12 desk:gap-14">
      <SectionHeading
        tag="Unique Features"
        title="Make your platform work harder for you"
        text="Streamline your business with unified metrics and AI-powered analytics—all in one place."
      />
      <div className="grid w-full grid-cols-1 gap-5 tab:grid-cols-2">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} y={80} delay={i % 2 === 0 ? 0.2 : 0.4} className="h-full">
            <article className="al-card flex h-full flex-col gap-4 px-2.5 pb-6 pt-2.5 tab:gap-5 tab:px-4 tab:pt-4">
              <div className="aspect-[1.80695] w-full overflow-hidden rounded-xl tab:rounded-[10px]">
                <img src={f.image} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col gap-1 px-2 tab:gap-2">
                <h4 className="al-h4">{f.title}</h4>
                <p className="al-p max-w-[400px] text-balance">
                  {f.tabletText ? (
                    <>
                      <span className="tab:max-desk:hidden">{f.text}</span>
                      <span className="hidden tab:max-desk:inline">{f.tabletText}</span>
                    </>
                  ) : (
                    f.text
                  )}
                </p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

const BENEFITS = [
  {
    icon: svg.benefitRealtime,
    title: 'Real-Time Tracking',
    text: 'Monitor user activity instantly for smarter decision-making.',
  },
  {
    icon: svg.benefitAllInOne,
    title: 'All-in-One View',
    text: 'Keep all your analytics in one place, without jumping between tools.',
  },
  {
    icon: svg.benefitActionable,
    title: 'Actionable Insights',
    text: 'Track the metrics that matter most for sustainable business growth.',
  },
  {
    icon: svg.benefitSecure,
    title: 'Secure Data',
    text: 'Keep your analytics safe with advanced security and strong encryption.',
  },
  {
    icon: svg.benefitReports,
    title: 'Custom Reports',
    text: 'Create tailored reports that fit your needs and highlight key insights.',
  },
  {
    icon: svg.benefitSimple,
    title: 'Simple to Use',
    text: 'Navigate easily—no steep learning curve, start making better decisions quickly.',
  },
];

function BenefitCard({ benefit, delay }: { benefit: (typeof BENEFITS)[number]; delay: number }) {
  return (
    <Reveal y={60} delay={delay} className="h-full">
      <article className="al-card flex h-full flex-col gap-10 px-5 pb-6 pt-5">
        <div className="al-icon-glow flex h-10 w-10 items-center justify-center rounded-md bg-al-tag">
          <InlineSvg svg={benefit.icon} className="h-7 w-7 text-al-blue" />
        </div>
        <div className="flex flex-col gap-2">
          <h5 className="al-h5">{benefit.title}</h5>
          <p className="al-p text-balance">{benefit.text}</p>
        </div>
      </article>
    </Reveal>
  );
}

export function Benefits() {
  const rows = [BENEFITS.slice(0, 3), BENEFITS.slice(3)];
  return (
    <Section id="benefits" containerClassName="gap-10 tab:gap-12 desk:gap-14">
      <SectionHeading
        tag="Benefits"
        title="Benefits That Truly Matter to You"
        text="Monitor metrics as they happen, so you can respond quickly and keep your goals on track."
      />
      <div className="flex w-full flex-col gap-5">
        {rows.map((row, r) => {
          const cards = (
            <div className="grid w-full grid-cols-1 gap-5 tab:grid-cols-3">
              {row.map((b, i) => (
                <BenefitCard key={b.title} benefit={b} delay={0.1 * (i + 1)} />
              ))}
            </div>
          );
          // La seconde rangée a, en plus, sa propre apparition (comme l'original).
          return r === 0 ? (
            <div key={r}>{cards}</div>
          ) : (
            <Reveal key={r} y={60} delay={0.1} amount={0.5}>
              {cards}
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

const STEPS = [
  {
    image: img.stepConnect,
    title: 'Connect your product',
    text: 'Integrate in minutes with your existing stack—no engineering lift required.',
  },
  {
    image: img.stepAnalyze,
    title: 'Analyze User Behavior',
    text: 'Track user activity, uncover trends, and turn complex data into actionable insights.',
  },
  {
    image: img.stepOptimize,
    title: 'Optimize & Grow',
    text: 'Use AI recommendations to improve retention & drive sustainable growth.',
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works" containerClassName="gap-10 tab:gap-12 desk:gap-14">
      <SectionHeading
        tag="How It Works"
        title="Get clear answers in 3 simple steps"
        text="From data to clarity—uncover insights, take action, and grow smarter in three simple steps."
      />
      <div className="grid w-full grid-cols-1 gap-5 tab:grid-cols-2 desk:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.title} y={60} delay={0.2 * (i + 1)} className="h-full">
            <article className="al-card flex h-full flex-col gap-4 px-2.5 pb-6 pt-2.5 tab:gap-5 tab:px-4 tab:pt-4">
              <div className="aspect-[1.318] w-full overflow-hidden rounded-xl tab:rounded-[10px]">
                <img src={s.image} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col gap-1 px-2 tab:gap-2">
                <h4 className="al-h4">{s.title}</h4>
                <p className="al-p">{s.text}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
