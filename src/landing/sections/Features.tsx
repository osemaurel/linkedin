import type { ComponentType } from 'react';
import { svg } from '../assets';
import {
  AuditIllustration,
  AuditStepIllustration,
  ImportIllustration,
  NetworkIllustration,
  ProgressIllustration,
  RewritesIllustration,
  StudioIllustration,
} from '../components/Illustrations';
import { InlineSvg, Reveal, Section, SectionHeading } from '../components/primitives';

const FEATURES: { art: ComponentType; title: string; text: string }[] = [
  {
    art: AuditIllustration,
    title: 'Audit de ton profil',
    text: 'Un score global et par section, pour voir d’un coup d’œil ce qui te freine.',
  },
  {
    art: RewritesIllustration,
    title: 'Réécritures prêtes à copier',
    text: 'Pas de conseils vagues : ton nouveau titre et ton résumé, en plusieurs variantes.',
  },
  {
    art: StudioIllustration,
    title: 'Studio de contenu',
    text: 'Des posts rédigés dans ta voix, avec carrousel ou image, prêts à publier.',
  },
  {
    art: NetworkIllustration,
    title: 'Mon réseau',
    text: 'Les bonnes personnes à contacter, les bons messages et un suivi de tes relances.',
  },
];

export function Features() {
  return (
    <Section id="features" containerClassName="gap-10 tab:gap-12 desk:gap-14">
      <SectionHeading
        tag="Fonctionnalités"
        title="Tout ce qu’il faut pour être remarqué"
        text="De l’audit de ton profil au premier message envoyé, chaque étape prépare la suivante."
      />
      <div className="grid w-full grid-cols-1 gap-5 tab:grid-cols-2">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} y={80} delay={i % 2 === 0 ? 0.2 : 0.4} className="h-full">
            <article className="al-card flex h-full flex-col gap-4 px-2.5 pb-6 pt-2.5 tab:gap-5 tab:px-4 tab:pt-4">
              <div className="aspect-[1.80695] w-full overflow-hidden rounded-xl tab:rounded-[10px]">
                <f.art />
              </div>
              <div className="flex flex-col gap-1 px-2 tab:gap-2">
                <h4 className="al-h4">{f.title}</h4>
                <p className="al-p max-w-[400px] text-balance">{f.text}</p>
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
    title: 'Des résultats dès le début',
    text: 'Ton score, tes points faibles et des réécritures dès ton premier audit.',
  },
  {
    icon: svg.benefitAllInOne,
    title: 'Tout au même endroit',
    text: 'Profil, contenu et prospection dans un seul outil qui garde ton contexte.',
  },
  {
    icon: svg.benefitActionable,
    title: 'Prêt à publier',
    text: 'Des textes à copier tels quels sur LinkedIn, pas des listes de conseils.',
  },
  {
    icon: svg.benefitSecure,
    title: 'Ton compte reste à toi',
    text: 'Aucun mot de passe LinkedIn demandé, rien n’est publié à ta place.',
  },
  {
    icon: svg.benefitReports,
    title: 'Une régularité tenue',
    text: 'Un plan éditorial sur 30, 60 ou 90 jours, avec un angle pour chaque créneau.',
  },
  {
    icon: svg.benefitSimple,
    title: 'En français, pour ta région',
    text: 'Le tutoiement, les codes locaux et des exemples qui parlent à ton marché.',
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
        tag="Avantages"
        title="Pensé pour avancer vite, et bien"
        text="Moins de temps à chercher quoi écrire, plus de temps pour les vraies opportunités."
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

const STEPS: { art: ComponentType; title: string; text: string }[] = [
  {
    art: ImportIllustration,
    title: 'Importe ton profil',
    text: 'Le PDF de ton profil LinkedIn ou un simple copier-coller. Pas encore de compte ? On le construit ensemble.',
  },
  {
    art: AuditStepIllustration,
    title: 'Applique ton audit',
    text: 'Ton score, tes points faibles et des réécritures à copier en un clic sur LinkedIn.',
  },
  {
    art: ProgressIllustration,
    title: 'Publie et prospecte',
    text: 'Des posts dans ta voix, des messages d’approche, et un score qui progresse.',
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works" containerClassName="gap-10 tab:gap-12 desk:gap-14">
      <SectionHeading
        tag="Comment ça marche"
        title="Trois étapes pour un profil qui attire"
        text="Importe ton profil, applique l’audit, puis publie et prospecte avec régularité."
      />
      <div className="grid w-full grid-cols-1 gap-5 tab:grid-cols-2 desk:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.title} y={60} delay={0.2 * (i + 1)} className="h-full">
            <article className="al-card flex h-full flex-col gap-4 px-2.5 pb-6 pt-2.5 tab:gap-5 tab:px-4 tab:pt-4">
              <div className="aspect-[1.318] w-full overflow-hidden rounded-xl tab:rounded-[10px]">
                <s.art />
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
