import { circle, ellipse, path, rect } from 'common/scene/primitives';
import type { Prop, PropId, SceneNode } from 'common/scene/types';

/* ============================================================
   actors.ts — the things that do something.

   Every actor faces RIGHT and declares four anchors — mouth,
   hand, foot, eye — in its own coordinates. Engine 14 puts the
   apple at the mouth and the ball at the foot, and cannot work
   without them.

   The prototype drew its cat by mirroring a left-facing drawing
   with scale(-1,1). That is exactly the trap engine 10 warns
   about: the artwork mirrors and the anchors do not, so the
   apple lands behind the animal's head. These are drawn facing
   right in the first place, so there is nothing to mirror.

   Their Tamil locative is -இடம், not -இல்: a living thing is
   somewhere in a different way from a box, and using the wrong
   one is the kind of mistake this app exists to prevent.
   ============================================================ */

const id = (value: string): PropId => value as PropId;

export const cat: Prop = {
  id: id('cat'),
  box: { w: 110, h: 92 },
  surfaceY: null,
  inside: null,
  clearance: false,
  anchors: {
    /* Nose end, at the right. */
    mouth: [104, 42],
    eye: [92, 40],
    foot: [60, 92],
  },
  word: {
    en: { singular: 'cat', plural: 'cats' },
    ta: {
      nominative: 'பூனை',
      accusative: 'பூனையை',
      dative: 'பூனைக்கு',
      locative: 'பூனையிடம்',
      ablative: 'பூனையிடமிருந்து',
    },
  },
  draw: (fill?: string): readonly SceneNode[] => {
    const coat = fill ?? 'var(--prop-fur)';
    return [
      ellipse('body', { cx: 52, cy: 62, rx: 44, ry: 27, fill: coat }),
      circle('head', { cx: 88, cy: 42, r: 22, fill: coat }),
      path('ear-front', { d: 'M103,27 L101,8 L86,20 Z', fill: coat }),
      path('ear-back', { d: 'M73,27 L75,8 L90,20 Z', fill: coat }),
      /* Absolute, like every path in the library: a relative segment hides
         where it actually lands, and this tail used to reach x = -13 — outside
         the box the renderer places and scales by. */
      path('tail', { d: 'M14,56 C2,48 6,24 22,32', stroke: coat, strokeWidth: 9 }),
      circle('eye-near', { cx: 96, cy: 40, r: 3, fill: 'var(--prop-detail)' }),
      circle('eye-far', { cx: 81, cy: 40, r: 3, fill: 'var(--prop-detail)' }),
    ];
  },
};

export const dog: Prop = {
  id: id('dog'),
  box: { w: 130, h: 100 },
  surfaceY: null,
  inside: null,
  clearance: false,
  anchors: {
    /* On the drawn nose, not near it: engine 14 puts the apple here. */
    mouth: [130, 49],
    eye: [110, 34],
    foot: [94, 100],
  },
  word: {
    en: { singular: 'dog', plural: 'dogs' },
    ta: {
      nominative: 'நாய்',
      accusative: 'நாயை',
      dative: 'நாய்க்கு',
      locative: 'நாயிடம்',
      ablative: 'நாயிடமிருந்து',
    },
  },
  draw: (fill?: string): readonly SceneNode[] => {
    const coat = fill ?? 'var(--prop-bark)';
    return [
      /* Shallower than a cat's and lifted, so the legs show under it — a body
         that reaches the floor is a pig, which is what this was. */
      ellipse('body', { cx: 58, cy: 56, rx: 50, ry: 26, fill: coat }),
      rect('leg-front', { x: 88, y: 68, w: 13, h: 32, r: 5, fill: coat }),
      rect('leg-back', { x: 26, y: 68, w: 13, h: 32, r: 5, fill: coat }),
      circle('head', { cx: 104, cy: 40, r: 23, fill: coat }),
      /* A muzzle that tapers. The rounded stub it had before was a snout, and
         a snout on a dog is a pig. */
      path('muzzle', { d: 'M112,34 L134,44 L134,54 L112,58 Z', fill: coat }),
      circle('nose', { cx: 133, cy: 49, r: 5, fill: 'var(--prop-detail)' }),
      /* Hanging beside the head, not sitting on top of it. */
      path('ear', { d: 'M96,22 Q80,20 80,44 Q88,56 98,42 Z', fill: 'var(--prop-wood-2)' }),
      path('tail', { d: 'M12,44 C4,30 16,20 26,30', stroke: coat, strokeWidth: 9 }),
      circle('eye', { cx: 110, cy: 34, r: 3, fill: 'var(--prop-detail)' }),
    ];
  },
};

/* The two people are the same figure in different clothes: same box, same
   anchors, same posture. A learner meeting "the man is behind the car" and
   "the woman is behind the car" should see one picture with one thing
   changed, which is the whole method of this product. */
const person = (
  personId: string,
  clothes: string,
  word: Prop['word'],
  extra: (coat: string) => readonly SceneNode[] = () => [],
): Prop => ({
  id: id(personId),
  box: { w: 96, h: 210 },
  surfaceY: null,
  inside: null,
  clearance: false,
  anchors: {
    mouth: [52, 46],
    eye: [56, 36],
    /* On the drawn hand, not beside it — a thrown or given thing starts here. */
    hand: [76, 128],
    foot: [48, 210],
  },
  word,
  draw: (fill?: string): readonly SceneNode[] => {
    const coat = fill ?? clothes;
    return [
      circle('head', { cx: 48, cy: 34, r: 26, fill: 'var(--prop-skin)' }),
      /* Narrow enough that both arms clear it. Drawn wider, the torso covered
         them and the figure had no arms at all. */
      path('body', { d: 'M28,66 H68 L72,140 H24 Z', fill: coat }),
      rect('arm-near', { x: 70, y: 68, w: 13, h: 54, r: 6, fill: coat }),
      rect('arm-far', { x: 13, y: 68, w: 13, h: 54, r: 6, fill: coat }),
      circle('hand-near', { cx: 76, cy: 128, r: 9, fill: 'var(--prop-skin)' }),
      circle('hand-far', { cx: 19, cy: 128, r: 9, fill: 'var(--prop-skin)' }),
      rect('leg-near', { x: 50, y: 140, w: 18, h: 70, r: 6, fill: 'var(--prop-wood-2)' }),
      rect('leg-far', { x: 28, y: 140, w: 18, h: 70, r: 6, fill: 'var(--prop-wood-2)' }),
      circle('eye', { cx: 58, cy: 30, r: 3, fill: 'var(--prop-detail)' }),
      ...extra(coat),
    ];
  },
});

export const man: Prop = person('man', 'var(--prop-cloth)', {
  en: { singular: 'man', plural: 'men' },
  ta: {
    nominative: 'மனிதன்',
    accusative: 'மனிதனை',
    dative: 'மனிதனுக்கு',
    locative: 'மனிதனிடம்',
    ablative: 'மனிதனிடமிருந்து',
  },
});

export const woman: Prop = person(
  'woman',
  'var(--prop-cloth-2)',
  {
    en: { singular: 'woman', plural: 'women' },
    ta: {
      nominative: 'பெண்',
      accusative: 'பெண்ணை',
      dative: 'பெண்ணுக்கு',
      locative: 'பெண்ணிடம்',
      ablative: 'பெண்ணிடமிருந்து',
    },
  },
  /* Hair, so the two are told apart at a glance and at any size. It is the
     only difference besides the colour of the clothes. */
  () => [
    path('hair', {
      d: 'M20,34 A28,28 0 0 1 76,34 Q68,20 48,20 Q28,20 20,34 Z',
      fill: 'var(--prop-detail)',
    }),
  ],
);

export const ACTORS: readonly Prop[] = [cat, dog, man, woman];
