import { useMediaQuery } from 'common/hooks/useMediaQuery';

/* ============================================================
   useReducedMotion — whether this learner has asked for less.

   Reduced motion means *no* motion, not fast motion: the picture
   arrives in its final state instead of hurrying there. What it
   does not mean is no feedback — the word in the sentence still
   changes colour, because a change nobody can perceive is a
   control that appears not to work.
   ============================================================ */

export const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

export const useReducedMotion = (): boolean => useMediaQuery(REDUCED_MOTION);
