import type { Transition } from 'motion/react';

/** Ressorts Framer de la page (raideur 500, amortissement 60), avec leur délai. */
export const spring = (delay = 0, extra: Partial<Transition> = {}): Transition => ({
  type: 'spring',
  stiffness: 500,
  damping: 60,
  mass: 1,
  delay,
  ...extra,
});

/** Courbe « ease in out » de Framer, utilisée par les boucles. */
export const FRAMER_EASE = [0.44, 0, 0.56, 1] as const;
