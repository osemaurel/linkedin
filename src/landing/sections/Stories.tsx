import { useState } from 'react';
import { motion } from 'motion/react';
import { img, svg } from '../assets';
import { FRAMER_EASE } from '../components/anim';
import { Button, InlineSvg, Reveal, Section, SectionHeading, Tag } from '../components/primitives';

const hoverSpring = { type: 'spring', stiffness: 500, damping: 60, mass: 1 } as const;

const FEATURED = {
  category: 'Operations',
  title: 'Streamlining SaaS Without Adding Overhead',
  text: 'A clear look at how efficient operations help SaaS teams reduce friction, stay aligned, and scale without unnecessary complexity.',
  image: img.blogStreamlining,
  readTime: '5 min read',
};

const POSTS = [
  {
    category: 'Growth',
    title: 'Growing a SaaS Without Breaking Systems',
    text: 'How sustainable growth comes from strong foundations, clear processes, and systems that scale as your product and team expand.',
    image: img.blogGrowing,
  },
  {
    category: 'Workflows',
    title: 'Designing SaaS Workflows That Scale',
    text: 'A practical guide to building clear, reliable workflows that support growth without adding complexity or slowing teams down.',
    image: img.blogWorkflows,
  },
  {
    category: 'Automation',
    title: 'The Real Cost of Manual SaaS Work',
    text: 'A practical look at simplifying workflows, reducing manual work, and scaling efficiently with smart automation.',
    image: img.blogManualWork,
  },
];

/** Image d'article qui grossit légèrement au survol de la carte. */
function ZoomImage({ src, hovered }: { src: string; hovered: boolean }) {
  return (
    <motion.img
      src={src}
      alt=""
      className="h-full w-full object-cover"
      initial={false}
      animate={{ scale: hovered ? 1.08 : 1 }}
      transition={hoverSpring}
    />
  );
}

function FeaturedPost() {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href="#blogs"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="al-card flex w-full flex-col gap-2 overflow-hidden p-4 tab:h-[400px] tab:flex-row tab:gap-5 desk:p-5"
    >
      <div className="h-[225px] w-full overflow-hidden rounded-xl tab:h-full tab:flex-1">
        <ZoomImage src={FEATURED.image} hovered={hovered} />
      </div>
      <div className="flex flex-col justify-start gap-8 p-2 tab:h-full tab:flex-1 tab:justify-between tab:px-4 tab:pb-0 tab:pt-4 desk:px-5 desk:pt-5">
        <div className="flex flex-col items-start gap-4 tab:gap-5">
          <Tag>{FEATURED.category}</Tag>
          <div className="flex flex-col gap-2 tab:gap-2.5">
            <h3 className="al-h3b text-balance">{FEATURED.title}</h3>
            <p className="al-p line-clamp-2 max-w-[450px]">{FEATURED.text}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-al-blue" />
          <span className="al-p14 !text-al-blue">{FEATURED.readTime}</span>
        </div>
      </div>
    </a>
  );
}

function PostCard({ post }: { post: (typeof POSTS)[number] }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href="#blogs"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="al-card flex h-full w-full flex-col gap-2 overflow-hidden p-4"
    >
      <div className="relative h-[225px] w-full overflow-hidden rounded-xl">
        <ZoomImage src={post.image} hovered={hovered} />
        <div className="absolute right-3 top-3 z-[1]">
          <Tag>{post.category}</Tag>
        </div>
      </div>
      <div className="flex flex-col gap-2 p-3">
        <h4 className="al-h4 text-balance">{post.title}</h4>
        <p className="al-p line-clamp-2 text-balance">{post.text}</p>
      </div>
    </a>
  );
}

/** Lien « View all » : il pâlit et la flèche pivote de 45° au survol. */
function ViewAll() {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.a
      href="#blogs"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-2.5"
      initial={false}
      animate={{ opacity: hovered ? 0.64 : 1 }}
      transition={hoverSpring}
    >
      <span className="al-h4 text-al-ink">View all</span>
      <motion.span
        className="block h-5 w-5"
        initial={false}
        animate={{ rotate: hovered ? -45 : 0 }}
        transition={hoverSpring}
      >
        <InlineSvg svg={svg.arrowRight} className="h-5 w-5 text-al-ink" />
      </motion.span>
    </motion.a>
  );
}

export function Blogs() {
  return (
    <Section id="blogs" containerClassName="gap-10 tab:gap-12 desk:gap-14">
      <SectionHeading
        tag="Blogs"
        title="Helpful insights to help you grow"
        text="Explore our latest articles to help your SaaS product succeed and scale smarter."
      />
      <Reveal y={60} delay={0.2} className="flex w-full flex-col gap-5">
        <FeaturedPost />
        <div className="grid w-full grid-cols-1 gap-5 tab:grid-cols-2 desk:grid-cols-3">
          {POSTS.map((p) => (
            <PostCard key={p.title} post={p} />
          ))}
        </div>
      </Reveal>
      <ViewAll />
    </Section>
  );
}

/** Enveloppe flottante : arrivée, puis rotation et montée en boucle aller-retour. */
function Envelope({
  className,
  tilt,
  spin,
  delay,
}: {
  className: string;
  tilt: number;
  spin: number;
  delay: number;
}) {
  return (
    <div aria-hidden="true" className={`absolute z-[1] ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ type: 'spring', stiffness: 500, damping: 60, mass: 1, delay }}
      >
        <div style={{ rotate: `${tilt}deg` }}>
          <motion.div
            animate={{ rotate: [0, spin] }}
            transition={{
              duration: 3.5,
              ease: FRAMER_EASE,
              repeat: Infinity,
              repeatType: 'mirror',
            }}
          >
            <motion.img
              src={img.newsletterEnvelope}
              alt=""
              className="al-envelope aspect-[1.46414] w-[70px] rounded-[10px] tab:w-[108px] desk:w-[148px]"
              animate={{ y: [0, -15] }}
              transition={{
                duration: 2.5,
                ease: FRAMER_EASE,
                repeat: Infinity,
                repeatType: 'mirror',
              }}
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export function Newsletter() {
  return (
    <Section id="newsletter">
      <Reveal y={60} delay={0.2} className="w-full">
        <div className="al-card relative flex h-[330px] w-full flex-col items-center justify-center gap-2.5 overflow-hidden rounded-3xl p-4 tab:rounded-[20px] tab:p-[30px] desk:h-[370px] desk:p-10">
          <img
            src={img.newsletterRibbon}
            alt=""
            className="absolute -bottom-[73px] -right-[250px] z-0 aspect-[1.4456] w-[442px] tab:-right-[180px] desk:-bottom-[23px] desk:-right-[140px]"
          />
          <img
            src={img.newsletterRibbon}
            alt=""
            className="absolute -left-[250px] -top-[83px] z-0 aspect-[1.4456] w-[442px] rotate-180 tab:-left-[180px] tab:-top-[73px] desk:-left-[140px] desk:-top-[23px]"
          />
          <Envelope
            className="left-[18px] top-[85%] -translate-y-1/2 tab:left-10 tab:top-[51%] desk:left-[70px] desk:top-[48%]"
            tilt={-19}
            spin={16}
            delay={0.4}
          />
          <Envelope
            className="right-[18px] top-[254px] tab:right-10 tab:top-[144px] desk:right-[60px]"
            tilt={9}
            spin={-15}
            delay={0.5}
          />

          <div className="relative z-[2] flex w-full flex-col items-center gap-5 text-center">
            <div className="flex flex-col items-center gap-2.5">
              <h2 className="al-h2 max-w-[450px] text-balance">
                Subscribe to the Alytics Newsletter!
              </h2>
              <p className="al-p max-w-[270px] text-balance tab:max-w-[320px] desk:max-w-[340px]">
                Get expert tips, updates, and smart analytics insights delivered straight to your
                inbox.
              </p>
            </div>
            <Button href="#newsletter">Subscribe Now</Button>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
