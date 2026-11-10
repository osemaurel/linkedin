import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from 'motion/react';

/**
 * Bandeau qui défile sans fin (composant Ticker de Framer) : vitesse en pixels par
 * seconde, vers la droite comme sur l'original, et déplaçable à la main.
 */
export function Ticker({
  items,
  gap,
  velocity = 50,
  direction = 1,
  className = '',
  style,
}: {
  items: ReactNode[];
  gap: number;
  velocity?: number;
  direction?: 1 | -1;
  className?: string;
  style?: React.CSSProperties;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const [setWidth, setSetWidth] = useState(0);
  const [copies, setCopies] = useState(2);
  const x = useMotionValue(0);
  const dragging = useRef<{ startX: number; startOffset: number } | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const measure = () => {
      const set = setRef.current;
      const root = rootRef.current;
      if (!set || !root) return;
      const w = set.offsetWidth + gap;
      setSetWidth(w);
      setCopies(Math.max(2, Math.ceil(root.offsetWidth / Math.max(w, 1)) + 2));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (setRef.current) ro.observe(setRef.current);
    if (rootRef.current) ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, [gap]);

  useAnimationFrame((_, delta) => {
    if (!setWidth || dragging.current || reduced) return;
    let next = x.get() + direction * velocity * (delta / 1000);
    // Le décalage reste dans [-largeur, 0] : la copie suivante prend le relais.
    next = ((next % setWidth) - setWidth) % setWidth;
    x.set(next);
  });

  return (
    <div
      ref={rootRef}
      className={`relative flex overflow-hidden ${className}`}
      style={{ touchAction: 'pan-y', ...style }}
      onPointerDown={(e) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        dragging.current = { startX: e.clientX, startOffset: x.get() };
      }}
      onPointerMove={(e) => {
        if (!dragging.current || !setWidth) return;
        const raw = dragging.current.startOffset + (e.clientX - dragging.current.startX);
        x.set(((raw % setWidth) - setWidth) % setWidth);
      }}
      onPointerUp={() => (dragging.current = null)}
      onPointerCancel={() => (dragging.current = null)}
    >
      <motion.div className="flex shrink-0 items-center" style={{ x, gap }}>
        {Array.from({ length: copies }, (_, c) => (
          <div
            key={c}
            ref={c === 0 ? setRef : undefined}
            aria-hidden={c > 0}
            className="flex shrink-0 items-center"
            style={{ gap }}
          >
            {items}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
