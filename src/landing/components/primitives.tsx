import { useState, type CSSProperties, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { spring } from './anim';

type RevealProps = {
  children: ReactNode;
  y?: number;
  delay?: number;
  amount?: number;
  className?: string;
  style?: CSSProperties;
  as?: 'div' | 'section' | 'li';
};

/**
 * Apparition au défilement (effet « Appear » de Framer) : une seule fois, quand la moitié
 * de l'élément est visible, en montant de `y` pixels.
 */
export function Reveal({
  children,
  y = 60,
  delay = 0.2,
  amount = 0.5,
  className,
  style,
  as = 'div',
}: RevealProps) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={spring(delay)}
    >
      {children}
    </Tag>
  );
}

/** Texte découpé en lettres qui glissent vers le haut au survol, la copie arrive d'en bas. */
export function RollingText({
  text,
  hovered,
  lineHeight,
  color,
  className = '',
  stagger = 0.4,
  duration = 0.4,
}: {
  text: string;
  hovered: boolean;
  lineHeight: number;
  color: string;
  className?: string;
  stagger?: number;
  duration?: number;
}) {
  const chars = [...text];
  return (
    <span
      aria-hidden="true"
      className={`al-roll ${className}`}
      style={
        {
          '--al-roll-lh': `${lineHeight}px`,
          '--al-roll-color': color,
          lineHeight: `${lineHeight}px`,
        } as CSSProperties
      }
    >
      {chars.map((ch, i) => (
        <motion.span
          key={i}
          initial={false}
          animate={{ y: hovered ? -lineHeight : 0 }}
          transition={{
            type: 'spring',
            duration,
            bounce: 0,
            delay: (duration / chars.length) * i * stagger,
          }}
        >
          {ch === ' ' ? ' ' : ch}
        </motion.span>
      ))}
    </span>
  );
}

const BUTTON_HOVER_SHADOW =
  '0px 0.421531px 0.927368px -0.416667px rgba(18, 109, 251, 0.11), 0px 1.60197px 3.52434px -0.833333px rgba(18, 109, 251, 0.15), 0px 7px 15.4px -1.25px rgba(18, 109, 251, 0.3)';

/** Bouton bleu de la page : fond qui fonce, halo bleu et texte qui roule au survol. */
export function Button({
  children,
  href = '#',
  className = '',
}: {
  children: string;
  href?: string;
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className={`al-inner-border relative flex items-center justify-center overflow-hidden rounded-xl px-5 py-2.5 ${className}`}
      style={
        {
          '--al-border-width': '2px',
          '--al-border-color': 'rgba(255, 255, 255, 0.1)',
        } as CSSProperties
      }
      initial={false}
      animate={{
        backgroundColor: hovered ? '#0765e8' : '#126dfb',
        boxShadow: hovered ? BUTTON_HOVER_SHADOW : '0px 0px 0px 0px rgba(18, 109, 251, 0)',
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
    >
      {/* Le texte réel donne la taille ; la copie animée se pose dessus. */}
      <span className="al-p14 invisible whitespace-pre">{children}</span>
      <span className="absolute inset-0 flex items-center justify-center">
        <RollingText
          text={children}
          hovered={hovered}
          lineHeight={21}
          color="#ffffff"
          className="text-[14px] tracking-[-0.04em]"
        />
      </span>
      <span className="sr-only">{children}</span>
    </motion.a>
  );
}

/** Étiquette bleue au-dessus des titres de section. */
export function Tag({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`al-inner-border inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-al-tag px-3 py-2 ${className}`}
      style={{ '--al-border-color': '#126dfb' } as CSSProperties}
    >
      <p className="al-p14 whitespace-pre !text-al-blue">{children}</p>
    </div>
  );
}

/** Étiquette, titre et texte centrés, chacun avec son apparition décalée. */
export function SectionHeading({
  tag,
  title,
  text,
  titleAs: TitleTag = 'h2',
}: {
  tag: string;
  title: string;
  text: string;
  titleAs?: 'h2' | 'h1';
}) {
  return (
    <div className="flex w-full flex-col items-center gap-4 desk:gap-5">
      <Reveal y={40} delay={0.1}>
        <Tag>{tag}</Tag>
      </Reveal>
      <div className="flex w-full flex-col items-center gap-2.5 text-center">
        <Reveal y={60} delay={0.2} className="w-full tab:max-w-[410px] desk:max-w-[450px]">
          <TitleTag className="al-h2 text-balance">{title}</TitleTag>
        </Reveal>
        <Reveal
          y={60}
          delay={0.3}
          className="w-full max-w-[270px] tab:max-w-[320px] desk:max-w-[340px]"
        >
          <p className="al-p text-balance">{text}</p>
        </Reveal>
      </div>
    </div>
  );
}

/** Conteneur de section : 100 / 80 / 60 px en haut et en bas, 48 / 32 / 16 px sur les côtés. */
export function Section({
  id,
  children,
  className = '',
  containerClassName = '',
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}) {
  return (
    <section id={id} className={`flex w-full justify-center ${className}`}>
      <div
        className={`flex w-full max-w-[1200px] flex-col items-center px-4 py-[60px] tab:px-8 tab:py-20 desk:px-12 desk:py-[100px] ${containerClassName}`}
      >
        {children}
      </div>
    </section>
  );
}

/** SVG local posé en ligne, pour hériter de la couleur du texte. */
export function InlineSvg({
  svg,
  className = '',
  style,
  label,
}: {
  svg: string;
  className?: string;
  style?: CSSProperties;
  label?: string;
}) {
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`block shrink-0 [&>svg]:block [&>svg]:h-full [&>svg]:w-full ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
