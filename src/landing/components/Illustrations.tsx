import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Check, Copy, FileText, PenLine } from 'lucide-react';
import { svg } from '../assets';
import { InlineSvg } from './primitives';

/*
 * Illustrations du produit, dessinées dans le style des visuels d'origine : fond gris clair,
 * cartes blanches arrondies, accents bleus. Chacune est composée à une taille fixe puis mise à
 * l'échelle de son cadre, pour garder exactement le même rendu sur tous les écrans.
 */

const BLUE = '#126dfb';
const INK = '#121212';
const GRAY = '#8b8b8b';
const TAG = '#e1eaf8';
const PANEL = '#f7f7f7';
const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)';

function Scaled({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setScale(el.offsetWidth / width);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="relative h-full w-full overflow-hidden"
      style={{ background: PANEL }}
    >
      <div
        className="absolute left-0 top-0"
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          letterSpacing: '-0.04em',
          color: INK,
        }}
      >
        {children}
      </div>
    </div>
  );
}

const card = (style: CSSProperties): CSSProperties => ({
  position: 'absolute',
  background: '#fff',
  borderRadius: 14,
  boxShadow: cardShadow,
  ...style,
});

function Pill({
  children,
  tone = 'blue',
  style,
}: {
  children: ReactNode;
  tone?: 'blue' | 'solid' | 'dark' | 'green' | 'amber' | 'gray';
  style?: CSSProperties;
}) {
  const tones = {
    blue: { background: TAG, color: BLUE },
    solid: { background: BLUE, color: '#fff' },
    dark: { background: INK, color: '#fff' },
    green: { background: '#e6f6ec', color: '#1a7f37' },
    amber: { background: '#fff3df', color: '#a35a00' },
    gray: { background: '#f1f1f1', color: '#6b6b6b' },
  };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        borderRadius: 999,
        padding: '3px 8px',
        fontSize: 9,
        lineHeight: '12px',
        whiteSpace: 'nowrap',
        ...tones[tone],
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Fonctionnalités (cadre 510 × 282)
// ---------------------------------------------------------------------------

/** Audit : score global, nombre de réécritures et note par section. */
export function AuditIllustration() {
  const bars = [
    { label: 'Titre', h: 70 },
    { label: 'Résumé', h: 98 },
    { label: 'Expér.', h: 128 },
    { label: 'Compét.', h: 108 },
    { label: 'Formation', h: 116 },
    { label: 'Photo', h: 132 },
  ];
  return (
    <Scaled width={510} height={282}>
      <div style={card({ left: 46, top: 38, width: 418, height: 280, padding: '20px 22px' })}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 9.5, color: GRAY }}>Score du profil</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 22 }}>
                82<span style={{ fontSize: 11, color: GRAY }}>/100</span>
              </span>
              <Pill style={{ fontSize: 7.5, padding: '2px 5px' }}>+17 pts</Pill>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9.5, color: GRAY }}>Réécritures prêtes</div>
            <div style={{ fontSize: 22, marginTop: 4 }}>12</div>
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            left: 22,
            right: 22,
            bottom: 36,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 12,
          }}
        >
          {bars.map((b) => (
            <div
              key={b.label}
              style={{
                flex: 1,
                height: b.h,
                background: BLUE,
                borderRadius: '7px 7px 0 0',
                color: '#fff',
                fontSize: 8,
                textAlign: 'center',
                paddingTop: 7,
              }}
            >
              {b.label}
            </div>
          ))}
        </div>
      </div>
    </Scaled>
  );
}

/** Réécritures prêtes à copier : une liste de suggestions, la ligne active a son bouton. */
export function RewritesIllustration() {
  const rows = [
    'Photo : cadrage serré, fond neutre',
    'Titre : Juriste d’affaires · Droit OHADA · Abidjan',
    'À propos : 3 réalisations chiffrées ajoutées',
    'Expérience : un verbe d’action, un résultat',
    'Compétences : 5 mots-clés recherchés',
  ];
  return (
    <Scaled width={510} height={282}>
      {rows.map((text, i) => {
        const active = i === 2;
        return (
          <div
            key={text}
            style={card({
              left: 62,
              top: -20 + i * 60,
              width: 386,
              height: 48,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '0 12px',
              boxShadow: active
                ? '0 0 0 1.5px #126dfb, 0 10px 24px rgba(18,109,251,0.14)'
                : cardShadow,
              zIndex: active ? 2 : 1,
            })}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 5,
                background: TAG,
                color: BLUE,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <PenLine size={10} strokeWidth={2.4} />
            </span>
            <span style={{ fontSize: 12.5, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}>
              {text}
            </span>
            {active && (
              <Pill tone="solid" style={{ fontSize: 9 }}>
                <Copy size={9} strokeWidth={2.4} />
                Copier
              </Pill>
            )}
          </div>
        );
      })}
    </Scaled>
  );
}

/** Studio : un post rédigé dans la voix de l'utilisatrice, avec le choix du ton. */
export function StudioIllustration() {
  return (
    <Scaled width={510} height={282}>
      <div style={card({ left: 70, top: 28, width: 370, height: 270, padding: 18 })}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 999,
              background: TAG,
              color: BLUE,
              fontSize: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            AK
          </span>
          <div>
            <div style={{ fontSize: 11 }}>Aminata Koné</div>
            <div style={{ fontSize: 8.5, color: GRAY }}>Juriste d’affaires · Abidjan</div>
          </div>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.3, marginTop: 14, maxWidth: 300 }}>
          3 clauses qui protègent une PME dès son premier contrat.
        </div>
        {[300, 284, 220, 260].map((w, i) => (
          <div
            key={i}
            style={{
              width: w,
              height: 7,
              borderRadius: 4,
              background: '#eeeeee',
              marginTop: i === 0 ? 14 : 8,
            }}
          />
        ))}
        <div style={{ display: 'flex', gap: 6, marginTop: 18 }}>
          <Pill tone="solid">Professionnel</Pill>
          <Pill tone="gray">Conversationnel</Pill>
          <Pill tone="gray">Direct</Pill>
        </div>
      </div>
      <Pill
        tone="dark"
        style={{ position: 'absolute', left: 352, top: 16, fontSize: 9.5, padding: '5px 10px' }}
      >
        Écrit dans ta voix
      </Pill>
    </Scaled>
  );
}

/** Mon réseau : le suivi des contacts et une note de connexion prête à envoyer. */
export function NetworkIllustration() {
  const contacts = [
    {
      initials: 'MD',
      name: 'Moussa Diop',
      role: 'DRH · Groupe bancaire, Dakar',
      status: 'A répondu',
      tone: 'green' as const,
    },
    {
      initials: 'AT',
      name: 'Awa Traoré',
      role: 'Recruteuse · Cabinet RH, Abidjan',
      status: 'Contactée',
      tone: 'blue' as const,
    },
    {
      initials: 'KM',
      name: 'Koffi Mensah',
      role: 'Directeur juridique · Lomé',
      status: 'Message prêt',
      tone: 'amber' as const,
    },
  ];
  return (
    <Scaled width={510} height={282}>
      <div style={card({ left: 50, top: 28, width: 410, height: 270, padding: '16px 18px' })}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 12 }}>Ton suivi</span>
          <span style={{ fontSize: 9, color: GRAY }}>3 contacts cette semaine</span>
        </div>
        {contacts.map((c) => (
          <div
            key={c.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              marginTop: 10,
              padding: '8px 0',
              borderTop: '1px solid #f1f1f1',
            }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 999,
                background: '#f1f1f1',
                fontSize: 8.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {c.initials}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5 }}>{c.name}</div>
              <div style={{ fontSize: 8, color: GRAY }}>{c.role}</div>
            </div>
            <Pill tone={c.tone}>{c.status}</Pill>
          </div>
        ))}
      </div>
      <div
        style={card({
          left: 236,
          top: 196,
          width: 246,
          height: 110,
          padding: '12px 14px',
          borderRadius: 12,
          boxShadow: '0 0 0 1.5px #126dfb, 0 12px 28px rgba(18,109,251,0.16)',
        })}
      >
        <div style={{ fontSize: 8, color: GRAY }}>Note de connexion · 248/300</div>
        <div style={{ fontSize: 9.5, lineHeight: 1.35, marginTop: 5 }}>
          Bonjour Koffi, votre post sur la conformité OHADA m’a parlé&nbsp;: j’accompagne des PME
          sur ces sujets…
        </div>
      </div>
    </Scaled>
  );
}

// ---------------------------------------------------------------------------
// Étapes (cadre 323 × 245)
// ---------------------------------------------------------------------------

/** Étape 1 : le PDF du profil et ses sections convergent vers l'outil. */
export function ImportIllustration() {
  const chips = [
    { label: 'Profil.pdf', x: 22, y: 112, pdf: true },
    { label: 'Expériences', x: 58, y: 54 },
    { label: 'Compétences', x: 178, y: 50 },
    { label: 'Formation', x: 230, y: 108 },
  ];
  const center = { x: 161.5, y: 186 };
  return (
    <Scaled width={323} height={245}>
      <svg width={323} height={245} style={{ position: 'absolute', inset: 0 }}>
        <circle cx={161.5} cy={300} r={168} fill="none" stroke="#ededed" strokeWidth={46} />
        {chips.map((c) => (
          <line
            key={c.label}
            x1={c.x + 38}
            y1={c.y + 12}
            x2={center.x}
            y2={center.y}
            stroke="#e3e3e3"
            strokeWidth={1}
          />
        ))}
      </svg>
      {chips.map((c) => (
        <div
          key={c.label}
          style={{
            position: 'absolute',
            left: c.x,
            top: c.y,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: '#fff',
            borderRadius: 999,
            padding: '5px 9px',
            boxShadow: cardShadow,
            fontSize: 9,
          }}
        >
          {c.pdf ? (
            <FileText size={11} color="#e5484d" strokeWidth={2.2} />
          ) : (
            <Check size={10} color={BLUE} strokeWidth={2.6} />
          )}
          {c.label}
        </div>
      ))}
      <div
        style={card({
          left: center.x - 31,
          top: center.y - 31,
          width: 62,
          height: 62,
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        <InlineSvg svg={svg.logo} style={{ width: 34, height: 34 }} />
      </div>
    </Scaled>
  );
}

/** Étape 2 : l'audit avec sa jauge et les premières corrections faites. */
export function AuditStepIllustration() {
  const r = 46;
  const half = Math.PI * r;
  return (
    <Scaled width={323} height={245}>
      <div style={card({ left: 22, top: 18, width: 279, height: 212, padding: 16 })}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 11 }}>Ton audit</span>
          <span style={{ fontSize: 8, color: GRAY }}>il y a 2 min</span>
        </div>
        <div style={{ position: 'relative', width: 120, height: 66, margin: '12px auto 0' }}>
          <svg width={120} height={66} viewBox="0 0 120 66">
            <path
              d="M14 60a46 46 0 0 1 92 0"
              fill="none"
              stroke="#eef2f9"
              strokeWidth={11}
              strokeLinecap="round"
            />
            <path
              d="M14 60a46 46 0 0 1 92 0"
              fill="none"
              stroke={BLUE}
              strokeWidth={11}
              strokeLinecap="round"
              strokeDasharray={`${half * 0.82} ${half}`}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 2,
              textAlign: 'center',
              fontSize: 20,
            }}
          >
            82
          </div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {['Titre réécrit', 'Résumé avec des chiffres', 'Compétences complétées'].map((t) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9.5 }}>
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  background: '#e6f6ec',
                  color: '#1a7f37',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Check size={9} strokeWidth={3} />
              </span>
              {t}
            </div>
          ))}
        </div>
      </div>
    </Scaled>
  );
}

/** Étape 3 : l'évolution du score au fil des audits. */
export function ProgressIllustration() {
  const values = [54, 58, 57, 65, 63, 71, 76, 74, 82];
  const x0 = 34;
  const x1 = 262;
  const yOf = (v: number) => 166 - ((v - 40) / 60) * 110;
  const pts = values.map((v, i) => [x0 + (i * (x1 - x0)) / (values.length - 1), yOf(v)] as const);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${x1} 166 L${x0} 166 Z`;
  return (
    <Scaled width={323} height={245}>
      <div style={card({ left: 22, top: 22, width: 279, height: 200, padding: 0 })}>
        <div style={{ position: 'absolute', left: 16, top: 14 }}>
          <div style={{ fontSize: 8.5, color: GRAY }}>Score du profil</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <span style={{ fontSize: 19 }}>82</span>
            <Pill style={{ fontSize: 7.5, padding: '2px 5px' }}>+28</Pill>
          </div>
        </div>
        <svg width={279} height={200} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <linearGradient id="al-progress" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={BLUE} stopOpacity="0.35" />
              <stop offset="1" stopColor={BLUE} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[40, 60, 80, 100].map((v) => (
            <g key={v}>
              <line
                x1={x0}
                x2={x1}
                y1={yOf(v)}
                y2={yOf(v)}
                stroke="#ececec"
                strokeDasharray="2 3"
              />
              <text x={12} y={yOf(v) + 3} fontSize={7.5} fill={GRAY}>
                {v}
              </text>
            </g>
          ))}
          <path d={area} fill="url(#al-progress)" />
          <path d={line} fill="none" stroke={BLUE} strokeWidth={1.6} strokeLinejoin="round" />
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3} fill={BLUE} />
        </svg>
      </div>
    </Scaled>
  );
}

// ---------------------------------------------------------------------------
// Drapeaux de l'Afrique francophone
// ---------------------------------------------------------------------------

/** Drapeau en SVG (rendu identique partout, contrairement aux émojis). */
export function Flag({
  art,
  className,
  label,
}: {
  art: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 30 20"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      preserveAspectRatio="xMidYMid slice"
    >
      {art}
    </svg>
  );
}
