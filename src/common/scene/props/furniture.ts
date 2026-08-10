import { circle, path, rect } from 'common/scene/primitives';
import type { Prop, PropId, SceneNode } from 'common/scene/types';

/* ============================================================
   furniture.ts — the things a figure is in, on, under or beside.

   Every prop draws at the origin of its OWN box. Nothing here
   knows where the stage is or where it will be placed: that is
   the renderer's job, and it is what lets one table serve "on
   the table", "under the table" and "beside the table".

   The geometry of table, box and chair is ported unchanged from
   the prototype, where it was drawn and looked at. Do not
   redraw what has already been verified by eye.
   ============================================================ */

const id = (value: string): PropId => value as PropId;

export const table: Prop = {
  id: id('table'),
  box: { w: 300, h: 150 },
  /* Not the top of the box: the tabletop is 16px thick, and things sit ON the
     top surface. 14 rather than 16 sinks the object 2px into the wood so it
     reads as resting rather than hovering. Getting this wrong floats every
     object in the product. */
  surfaceY: 14,
  inside: null,
  /* It stands on legs, so there is room underneath. */
  clearance: true,
  anchors: {},
  word: {
    en: { singular: 'table', plural: 'tables' },
    ta: {
      nominative: 'மேசை',
      accusative: 'மேசையை',
      dative: 'மேசைக்கு',
      locative: 'மேசையில்',
      ablative: 'மேசையிலிருந்து',
    },
  },
  draw: (fill?: string): readonly SceneNode[] => [
    rect('top', { x: 0, y: 0, w: 300, h: 16, r: 3, fill: fill ?? 'var(--prop-wood)' }),
    rect('leg-l', { x: 18, y: 16, w: 16, h: 134, fill: 'var(--prop-wood-2)' }),
    rect('leg-r', { x: 266, y: 16, w: 16, h: 134, fill: 'var(--prop-wood-2)' }),
    rect('rail', { x: 34, y: 26, w: 232, h: 8, fill: 'var(--prop-wood-2)' }),
  ],
};

export const box: Prop = {
  id: id('box'),
  box: { w: 190, h: 150 },
  surfaceY: 0,
  /* Where a thing goes when it is IN the box. Wide and deep enough for the
     ball at full size, which is what "in" has to be able to show. */
  inside: [18, 34, 154, 100],
  /* It sits flat on the floor, so nothing fits beneath it. "Under the box"
     would draw the figure inside the box, and a picture that contradicts its
     own sentence is the one thing this product must never do. */
  clearance: false,
  anchors: {},
  word: {
    en: { singular: 'box', plural: 'boxes' },
    ta: {
      nominative: 'பெட்டி',
      accusative: 'பெட்டியை',
      dative: 'பெட்டிக்கு',
      locative: 'பெட்டியில்',
      ablative: 'பெட்டியிலிருந்து',
    },
  },
  draw: (fill?: string): readonly SceneNode[] => [
    rect('body', { x: 0, y: 22, w: 190, h: 128, r: 4, fill: fill ?? 'var(--prop-card)' }),
    /* Two flaps with a gap between them: the gap is the way in. */
    rect('flap-l', { x: 0, y: 0, w: 86, h: 26, r: 4, fill: 'var(--prop-card-2)' }),
    rect('flap-r', { x: 104, y: 0, w: 86, h: 26, r: 4, fill: 'var(--prop-card-2)' }),
  ],
};

export const chair: Prop = {
  id: id('chair'),
  box: { w: 150, h: 210 },
  surfaceY: 96,
  inside: null,
  clearance: true,
  anchors: {},
  word: {
    en: { singular: 'chair', plural: 'chairs' },
    ta: {
      nominative: 'நாற்காலி',
      accusative: 'நாற்காலியை',
      dative: 'நாற்காலிக்கு',
      locative: 'நாற்காலியில்',
      ablative: 'நாற்காலியிலிருந்து',
    },
  },
  draw: (fill?: string): readonly SceneNode[] => [
    rect('back-l', { x: 16, y: 0, w: 14, h: 104, r: 3, fill: 'var(--prop-wood-2)' }),
    rect('back-r', { x: 120, y: 0, w: 14, h: 104, r: 3, fill: 'var(--prop-wood-2)' }),
    rect('slat-1', { x: 16, y: 22, w: 118, h: 12, r: 2, fill: 'var(--prop-wood-2)' }),
    rect('slat-2', { x: 16, y: 54, w: 118, h: 12, r: 2, fill: 'var(--prop-wood-2)' }),
    rect('seat', { x: 0, y: 96, w: 150, h: 16, r: 3, fill: fill ?? 'var(--prop-wood)' }),
    rect('leg-l', { x: 10, y: 112, w: 14, h: 98, fill: 'var(--prop-wood-2)' }),
    rect('leg-r', { x: 126, y: 112, w: 14, h: 98, fill: 'var(--prop-wood-2)' }),
  ],
};

export const door: Prop = {
  id: id('door'),
  box: { w: 120, h: 250 },
  surfaceY: null,
  inside: null,
  clearance: false,
  anchors: {},
  word: {
    en: { singular: 'door', plural: 'doors' },
    ta: {
      nominative: 'கதவு',
      accusative: 'கதவை',
      dative: 'கதவுக்கு',
      locative: 'கதவில்',
      ablative: 'கதவிலிருந்து',
    },
  },
  draw: (fill?: string): readonly SceneNode[] => [
    rect('frame', { x: 0, y: 0, w: 120, h: 250, r: 4, fill: 'var(--prop-wood-2)' }),
    rect('leaf', { x: 8, y: 8, w: 104, h: 242, r: 3, fill: fill ?? 'var(--prop-wood)' }),
    rect('panel-top', { x: 22, y: 26, w: 76, h: 84, r: 2, fill: 'var(--prop-wood-2)' }),
    rect('panel-bottom', { x: 22, y: 132, w: 76, h: 90, r: 2, fill: 'var(--prop-wood-2)' }),
    circle('handle', { cx: 98, cy: 130, r: 6, fill: 'var(--prop-gold)' }),
  ],
};

export const car: Prop = {
  id: id('car'),
  box: { w: 260, h: 130 },
  surfaceY: 4,
  inside: null,
  /* High enough off the road for a cat to be under it. */
  clearance: true,
  anchors: {},
  word: {
    en: { singular: 'car', plural: 'cars' },
    ta: {
      nominative: 'கார்',
      accusative: 'காரை',
      dative: 'காருக்கு',
      locative: 'காரில்',
      ablative: 'காரிலிருந்து',
    },
  },
  draw: (fill?: string): readonly SceneNode[] => [
    path('roof', {
      d: 'M56,52 L84,14 Q88,8 96,8 L168,8 Q176,8 180,14 L208,52 Z',
      fill: fill ?? 'var(--prop-cloth)',
    }),
    rect('window-l', { x: 74, y: 20, w: 40, h: 28, r: 3, fill: 'var(--prop-glass)' }),
    rect('window-r', { x: 150, y: 20, w: 40, h: 28, r: 3, fill: 'var(--prop-glass)' }),
    rect('body', { x: 10, y: 50, w: 240, h: 46, r: 12, fill: fill ?? 'var(--prop-cloth)' }),
    circle('wheel-l', { cx: 66, cy: 100, r: 24, fill: 'var(--prop-detail)' }),
    circle('wheel-r', { cx: 196, cy: 100, r: 24, fill: 'var(--prop-detail)' }),
    circle('hub-l', { cx: 66, cy: 100, r: 9, fill: 'var(--prop-metal)' }),
    circle('hub-r', { cx: 196, cy: 100, r: 9, fill: 'var(--prop-metal)' }),
  ],
};

export const shop: Prop = {
  id: id('shop'),
  box: { w: 300, h: 260 },
  surfaceY: null,
  /* The doorway. "At the shop" stands beside it; "in the shop" goes through
     it, which is why it has an inside at all. */
  inside: [120, 150, 60, 110],
  clearance: false,
  anchors: {},
  word: {
    en: { singular: 'shop', plural: 'shops' },
    ta: {
      nominative: 'கடை',
      accusative: 'கடையை',
      dative: 'கடைக்கு',
      locative: 'கடையில்',
      ablative: 'கடையிலிருந்து',
    },
  },
  draw: (fill?: string): readonly SceneNode[] => [
    rect('wall', { x: 0, y: 40, w: 300, h: 220, r: 4, fill: fill ?? 'var(--prop-brick)' }),
    path('awning', { d: 'M0,40 L300,40 L272,0 L28,0 Z', fill: 'var(--prop-red)' }),
    rect('window-l', { x: 26, y: 92, w: 76, h: 68, r: 3, fill: 'var(--prop-glass)' }),
    rect('window-r', { x: 198, y: 92, w: 76, h: 68, r: 3, fill: 'var(--prop-glass)' }),
    rect('doorway', { x: 120, y: 150, w: 60, h: 110, r: 3, fill: 'var(--prop-wood-2)' }),
  ],
};

export const FURNITURE: readonly Prop[] = [table, box, chair, door, car, shop];
