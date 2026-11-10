import type { ReactNode } from 'react';

// Drapeaux de l'Afrique francophone, dessinés en SVG : rendu identique partout, contrairement
// aux émojis, que Windows n'affiche pas.

const STAR =
  'M0 -1 L0.2245 -0.309 L0.951 -0.309 L0.363 0.118 L0.588 0.809 L0 0.382 L-0.588 0.809 L-0.363 0.118 L-0.951 -0.309 L-0.2245 -0.309 Z';

/** Étoile à cinq branches centrée en (x, y). */
function star(x: number, y: number, r: number, fill: string) {
  return <path d={STAR} transform={`translate(${x} ${y}) scale(${r})`} fill={fill} />;
}

function vertical(colors: string[]) {
  return colors.map((c, i) => (
    <rect
      key={i}
      x={(i * 30) / colors.length}
      y={0}
      width={30 / colors.length + 0.2}
      height={20}
      fill={c}
    />
  ));
}
function horizontal(colors: string[]) {
  return colors.map((c, i) => (
    <rect
      key={i}
      x={0}
      y={(i * 20) / colors.length}
      width={30}
      height={20 / colors.length + 0.2}
      fill={c}
    />
  ));
}

export const FLAGS: { code: string; name: string; art: ReactNode }[] = [
  { code: 'ci', name: 'Côte d’Ivoire', art: vertical(['#f77f00', '#ffffff', '#009e60']) },
  {
    code: 'sn',
    name: 'Sénégal',
    art: (
      <>
        {vertical(['#00853f', '#fdef42', '#e31b23'])}
        {star(15, 10.4, 3.4, '#00853f')}
      </>
    ),
  },
  {
    code: 'cm',
    name: 'Cameroun',
    art: (
      <>
        {vertical(['#007a5e', '#ce1126', '#fcd116'])}
        {star(15, 10.4, 3.4, '#fcd116')}
      </>
    ),
  },
  {
    code: 'bj',
    name: 'Bénin',
    art: (
      <>
        <rect width={12} height={20} fill="#008751" />
        <rect x={12} width={18} height={10} fill="#fcd116" />
        <rect x={12} y={10} width={18} height={10} fill="#e8112d" />
      </>
    ),
  },
  {
    code: 'tg',
    name: 'Togo',
    art: (
      <>
        {horizontal(['#006a4e', '#ffce00', '#006a4e', '#ffce00', '#006a4e'])}
        <rect width={12} height={12} fill="#d21034" />
        {star(6, 6.3, 3.6, '#ffffff')}
      </>
    ),
  },
  {
    code: 'bf',
    name: 'Burkina Faso',
    art: (
      <>
        {horizontal(['#ef2b2d', '#009e49'])}
        {star(15, 10.4, 3.6, '#fcd116')}
      </>
    ),
  },
  { code: 'ml', name: 'Mali', art: vertical(['#14b53a', '#fcd116', '#ce1126']) },
  { code: 'ga', name: 'Gabon', art: horizontal(['#009e60', '#fcd116', '#3a75c4']) },
  { code: 'gn', name: 'Guinée', art: vertical(['#ce1126', '#fcd116', '#009460']) },
];
