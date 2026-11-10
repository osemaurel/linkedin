import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from 'motion/react';

/** Spirale de l'original (SVG 554 × 504), parcourue par les logos d'intégration. */
const SPIRAL = {
  width: 554,
  height: 504,
  d: 'M552.252 227.051C548.029 306.06 512.971 378.902 455.545 430.344C400.585 479.577 327.738 506.39 252.252 502.051C181.842 498.004 114.56 466.734 66.6361 412.667C22.0061 362.315 -2.09651 295.787 2.25209 227.051C6.32059 162.744 35.3062 101.999 84.3141 59.1129C130.089 19.0564 190.301 -2.3067 252.252 2.0509C309.676 6.09001 364.17 32.2761 402.512 76.7909C437.912 117.89 456.63 171.763 452.252 227.051C448.208 278.129 424.467 326.176 384.835 359.634C348.269 390.502 300.695 406.437 252.252 402.051C207.796 398.026 166.087 376.909 137.347 341.956C111.016 309.933 97.8551 268.651 102.252 227.051C106.263 189.106 124.83 153.774 155.025 129.824C182.472 108.054 217.447 97.6339 252.252 102.051C283.787 106.053 312.708 122.137 331.802 147.501C349.184 170.594 356.655 199.315 352.252 227.051C348.202 252.565 334.364 274.9 314.124 288.923C295.634 301.733 273.22 306.492 252.252 302.051C233.275 298.032 217.287 286.766 208.058 271.245C199.787 257.335 197.75 241.215 202.252 227.051C206.273 214.401 215.087 204.843 225.735 200.534C235.225 196.695 245.107 197.508 252.252 202.051C258.669 206.132 261.767 212.558 261.091 218.212',
};

/** Met la spirale à l'échelle du conteneur (« contain », centrée), comme le composant Framer. */
function fitPath(w: number, h: number) {
  const s = Math.min(w / SPIRAL.width, h / SPIRAL.height);
  const ox = (w - SPIRAL.width * s) / 2;
  const oy = (h - SPIRAL.height * s) / 2;
  return SPIRAL.d.replace(/([MC])([^MC]*)/g, (_, cmd: string, args: string) => {
    const nums = args
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    const out = nums.map((n, i) => (i % 2 === 0 ? n * s + ox : n * s + oy).toFixed(2));
    return `${cmd}${out.join(' ')}`;
  });
}

const wrap = (v: number) => ((v % 100) + 100) % 100;

function PathItem({
  base,
  offset,
  path,
  scale,
  children,
  hidden,
}: {
  base: MotionValue<number>;
  offset: number;
  path: string;
  scale: number;
  children: ReactNode;
  hidden: boolean;
}) {
  const distance = useTransform(base, (b) => wrap(b + offset));
  const offsetDistance = useTransform(distance, (d) => `${d}%`);
  // Fondu à l'entrée et à la sortie de la spirale, et ordre d'empilement qui suit le trajet.
  const opacity = useTransform(distance, [0, 10, 90, 100], [0, 1, 1, 0]);
  const zIndex = useTransform(distance, (d) => Math.floor(1 + (d / 100) * 10));
  return (
    <motion.div
      aria-hidden={hidden}
      className="absolute left-0 top-0"
      style={{ offsetPath: `path('${path}')`, offsetDistance, opacity, zIndex }}
    >
      <div style={{ width: 56, transform: `scale(${scale})` }}>{children}</div>
    </motion.div>
  );
}

/** Logos qui glissent le long d'une spirale (« Ticker Path ») : 1 % du trajet par seconde. */
export function PathTicker({
  items,
  repeat,
  scale = 1,
  className = '',
  style,
}: {
  items: ReactNode[];
  repeat: number;
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const base = useMotionValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    if (reduced) return;
    base.set(base.get() + delta / 1000);
  });

  const path = useMemo(() => (size.w && size.h ? fitPath(size.w, size.h) : ''), [size]);
  const all = useMemo(
    () =>
      Array.from({ length: repeat }, (_, r) =>
        items.map((item, i) => ({ item, key: `${i}-${r}`, index: r * items.length + i, r })),
      ).flat(),
    [items, repeat],
  );

  return (
    <div ref={ref} className={className} style={style}>
      {path &&
        all.map(({ item, key, index, r }) => (
          <PathItem
            key={key}
            base={base}
            offset={(index * 100) / all.length}
            path={path}
            scale={scale}
            hidden={r > 0}
          >
            {item}
          </PathItem>
        ))}
    </div>
  );
}
