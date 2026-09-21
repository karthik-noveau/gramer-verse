import { circle, ellipse, line, path, rect } from 'common/scene/primitives';
import type { Prop, PropId, SceneNode } from 'common/scene/types';

/* ============================================================
   objects.ts — the things that move.

   These are what a place scene puts in, on, under or beside
   something else, so they are small, and every one of them takes
   a `fill` — the adjective knob recolours a prop rather than
   swapping in a second one.

   Highlights and shade are overlays, so adjective colours still work.
   ============================================================ */

const id = (value: string): PropId => value as PropId;

export const ball: Prop = {
  id: id('ball'),
  box: { w: 74, h: 74 },
  surfaceY: null,
  inside: null,
  clearance: false,
  anchors: {},
  word: {
    en: { singular: 'ball', plural: 'balls' },
    ta: {
      nominative: 'பந்து',
      accusative: 'பந்தை',
      dative: 'பந்துக்கு',
      locative: 'பந்தில்',
      ablative: 'பந்திலிருந்து',
    },
  },
  /* The two seams are what stop a coloured circle reading as a dot. They are
     drawn in a wash of the fill rather than a colour of their own, so a
     recoloured ball keeps its seams. */
  draw: (fill?: string): readonly SceneNode[] => [
    circle('body', { cx: 37, cy: 37, r: 35, fill: fill ?? 'var(--prop-orange)' }),
    path('shade', {
      d: 'M60,11 A35,35 0 0 1 12,61 C44,71 71,39 60,11 Z',
      fill: 'var(--prop-detail)',
      opacity: 0.12,
    }),
    path('highlight', {
      d: 'M12,28 C16,12 33,5 46,10 C28,9 19,19 17,31 Z',
      fill: 'var(--prop-paper)',
      opacity: 0.55,
    }),
    path('seam-h', { d: 'M3,33 C23,43 49,43 71,33', stroke: 'var(--prop-detail)', strokeWidth: 2.2, opacity: 0.35 }),
    path('seam-v', {
      d: 'M37,2 C15,20 15,54 37,72',
      stroke: 'var(--prop-detail)',
      strokeWidth: 2.2,
      opacity: 0.35,
    }),
    circle('edge', {
      cx: 37, cy: 37, r: 35,
      stroke: 'var(--prop-detail)', strokeWidth: 1, opacity: 0.12,
    }),
  ],
};

export const apple: Prop = {
  id: id('apple'),
  box: { w: 78, h: 88 },
  surfaceY: null,
  inside: null,
  clearance: false,
  anchors: {},
  word: {
    en: { singular: 'apple', plural: 'apples' },
    ta: {
      nominative: 'ஆப்பிள்',
      accusative: 'ஆப்பிளை',
      dative: 'ஆப்பிளுக்கு',
      locative: 'ஆப்பிளில்',
      ablative: 'ஆப்பிளிலிருந்து',
    },
  },
  draw: (fill?: string): readonly SceneNode[] => [
    circle('body', { cx: 39, cy: 52, r: 34, fill: fill ?? 'var(--prop-red)' }),
    rect('stalk', { x: 36, y: 8, w: 7, h: 26, r: 3, fill: 'var(--prop-bark)' }),
    /* The leaf is drawn as a path rather than a rotated ellipse: the node tree
       carries no transform of its own, and a rotate on a child would be a
       second coordinate system inside the prop's box. */
    path('leaf', {
      d: 'M44,16 Q60,4 72,12 Q60,26 44,16 Z',
      fill: 'var(--prop-leaf)',
    }),
  ],
};

export const cup: Prop = {
  id: id('cup'),
  box: { w: 70, h: 78 },
  surfaceY: null,
  /* A cup is a container: "the water is in the cup" is the same picture as
     the ball in the box, one size down. */
  inside: [12, 14, 40, 50],
  clearance: false,
  anchors: {},
  word: {
    en: { singular: 'cup', plural: 'cups' },
    ta: {
      nominative: 'கோப்பை',
      accusative: 'கோப்பையை',
      dative: 'கோப்பைக்கு',
      locative: 'கோப்பையில்',
      ablative: 'கோப்பையிலிருந்து',
    },
  },
  draw: (fill?: string): readonly SceneNode[] => [
    path('body', {
      d: 'M8,8 H56 L49,70 H15 Z',
      fill: fill ?? 'var(--prop-paper)',
      stroke: 'var(--prop-grey)',
      strokeWidth: 3,
    }),
    path('handle', {
      d: 'M56,22 C72,22 72,48 56,48',
      stroke: 'var(--prop-grey)',
      strokeWidth: 6,
    }),
  ],
};

export const book: Prop = {
  id: id('book'),
  box: { w: 96, h: 64 },
  /* Closed and lying flat, so something can sit on it. */
  surfaceY: 6,
  inside: null,
  clearance: false,
  anchors: {},
  word: {
    en: { singular: 'book', plural: 'books' },
    ta: {
      nominative: 'புத்தகம்',
      accusative: 'புத்தகத்தை',
      dative: 'புத்தகத்திற்கு',
      locative: 'புத்தகத்தில்',
      ablative: 'புத்தகத்திலிருந்து',
    },
  },
  draw: (fill?: string): readonly SceneNode[] => [
    rect('cover', { x: 0, y: 6, w: 96, h: 52, r: 4, fill: fill ?? 'var(--prop-cloth-2)' }),
    rect('pages', { x: 8, y: 0, w: 84, h: 50, r: 3, fill: 'var(--prop-paper)' }),
    line('spine', {
      x1: 8,
      y1: 0,
      x2: 8,
      y2: 50,
      stroke: 'var(--prop-grey)',
      strokeWidth: 2,
    }),
    line('leaf-1', { x1: 20, y1: 14, x2: 80, y2: 14, stroke: 'var(--prop-grey)', strokeWidth: 2 }),
    line('leaf-2', { x1: 20, y1: 26, x2: 80, y2: 26, stroke: 'var(--prop-grey)', strokeWidth: 2 }),
  ],
};

export const clock: Prop = {
  id: id('clock'),
  box: { w: 84, h: 84 },
  surfaceY: null,
  inside: null,
  clearance: false,
  anchors: {},
  word: {
    en: { singular: 'clock', plural: 'clocks' },
    ta: {
      nominative: 'கடிகாரம்',
      accusative: 'கடிகாரத்தை',
      dative: 'கடிகாரத்திற்கு',
      locative: 'கடிகாரத்தில்',
      ablative: 'கடிகாரத்திலிருந்து',
    },
  },
  draw: (fill?: string): readonly SceneNode[] => [
    circle('case', { cx: 42, cy: 42, r: 40, fill: fill ?? 'var(--prop-metal)' }),
    circle('face', { cx: 42, cy: 42, r: 32, fill: 'var(--prop-paper)' }),
    line('hand-hour', {
      x1: 42,
      y1: 42,
      x2: 42,
      y2: 22,
      stroke: 'var(--prop-detail)',
      strokeWidth: 4,
    }),
    line('hand-minute', {
      x1: 42,
      y1: 42,
      x2: 60,
      y2: 50,
      stroke: 'var(--prop-detail)',
      strokeWidth: 3,
    }),
    circle('pin', { cx: 42, cy: 42, r: 3, fill: 'var(--prop-detail)' }),
  ],
};

export const tree: Prop = {
  id: id('tree'),
  box: { w: 180, h: 260 },
  surfaceY: null,
  inside: null,
  /* A canopy is not something you stand under in this product's sense — the
     trunk is in the way. "Under the tree" would need the canopy alone. */
  clearance: false,
  anchors: {},
  word: {
    en: { singular: 'tree', plural: 'trees' },
    ta: {
      nominative: 'மரம்',
      accusative: 'மரத்தை',
      dative: 'மரத்திற்கு',
      locative: 'மரத்தில்',
      ablative: 'மரத்திலிருந்து',
    },
  },
  draw: (fill?: string): readonly SceneNode[] => [
    rect('trunk', { x: 76, y: 130, w: 28, h: 130, r: 4, fill: 'var(--prop-bark)' }),
    ellipse('canopy', { cx: 90, cy: 92, rx: 88, ry: 68, fill: fill ?? 'var(--prop-leaf)' }),
    ellipse('canopy-left', { cx: 36, cy: 128, rx: 34, ry: 28, fill: fill ?? 'var(--prop-leaf)' }),
    ellipse('canopy-right', { cx: 146, cy: 128, rx: 34, ry: 28, fill: fill ?? 'var(--prop-leaf)' }),
  ],
};

export const OBJECTS: readonly Prop[] = [ball, apple, cup, book, clock, tree];
