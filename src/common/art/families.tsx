import type { JSX } from 'react';

import {
  ACC,
  BALL_FILL,
  CIR,
  FILL,
  INK,
  iBar,
  iBox,
  iDot,
  iPerson,
  iRing,
  LINE,
  LN,
  MUT,
  P,
  R,
  RING,
  SOFT,
  SKIN,
  T,
  WARN,
  WOOD,
  WOOD_DARK,
  WOOD_EDGE,
} from 'common/art/kit';
import { nodeToSvg } from 'common/components/Stage/toSvg';
import { propFor } from 'common/scene/props';

/* ============================================================
   families.tsx — one picture per word, in a 48x48 box.

   Ported from the prototype's scene.js ICON set and icons-extra.js
   with the geometry unchanged. Splitting them by topic is how the
   prototype kept the drawing engine about scenes while the
   vocabulary art lived beside it; here they are one registry
   because `forWord` is the only caller.

   Abstract words (must, would, honest, usually) have no natural
   picture. They get a consistent schematic instead — a repeated
   visual language, not a literal drawing — and the caption carries
   the rest. Where even that would be a lie, nothing is returned
   and the row gets no picture at all.
   ============================================================ */

export type Family =
  | 'prep'
  | 'thing'
  | 'pronoun'
  | 'article'
  | 'noun'
  | 'conj'
  | 'adv'
  | 'adj2'
  | 'wh'
  | 'verb'
  | 'tense'
  | 'sent';

type Draw = (value: string) => readonly JSX.Element[] | null;

/* ---- shared parts ---------------------------------------- */

/** A little timeline with a now tick. */
const axis = (y: number): JSX.Element[] => [
  LN(5, y, 43, y, { c: LINE, w: 2 }),
  LN(24, y - 4, 24, y + 4, { c: MUT, w: 1.5 }),
];

const face = (mood: 'happy' | 'sad' | 'flat'): JSX.Element[] => {
  const mouth =
    mood === 'happy' ? 'M18 28 q6 6 12 0' : mood === 'sad' ? 'M18 30 q6 -6 12 0' : 'M18 29 h12';

  return [
    CIR(24, 24, 15, '#f2d9b5'),
    CIR(19, 21, 1.8, INK),
    CIR(29, 21, 1.8, INK),
    P(mouth, { c: INK, w: 2 }),
  ];
};

/** Speed lines. */
const motion = (n: number): JSX.Element[] =>
  Array.from({ length: n }, (_, i) => LN(8, 18 + i * 6, 16 + i * 4, 18 + i * 6, { c: ACC, w: 2.5 }));

/** Two heights, for tall/short and big/small. */
const bars = (a: number, b: number): JSX.Element[] => [
  R(13, 40 - a, 8, a, 2, LINE),
  R(27, 40 - b, 8, b, 2, ACC),
];

/** Frequency: filled out of five. */
const ticks = (on: number, total: number): JSX.Element[] =>
  Array.from({ length: total }, (_, i) => R(7 + i * 7.5, 20, 5, 10, 1.5, i < on ? ACC : LINE));

/** Sound. */
const waves = (n: number, size: number): JSX.Element[] => [
  CIR(16, 24, 5, INK),
  ...Array.from({ length: n }, (_, i) => {
    const r = size + i * 5;
    return P(`M20 ${24 - r} a${r} ${r} 0 0 1 0 ${2 * r}`, { c: ACC, w: 2 });
  }),
];

const mark = (ch: string, colour?: string): JSX.Element =>
  T(24, 32, ch, { s: 26, w: 700, f: colour ?? ACC });

/* ---- 1. who is being talked about ------------------------- */

const pronoun: Draw = (v) => {
  switch (v) {
    case 'I':
      return [iPerson(24, 26, 1.5), iRing(13, 6, 22, 38, false)];
    case 'we':
      return [iPerson(15, 28, 1.1), iPerson(33, 28, 1.1, '#a8447a', 'long'), iRing(4, 10, 40, 32, false)];
    case 'you':
      return [iPerson(30, 26, 1.5), ...iArrowTo()];
    case 'he':
      return [iPerson(24, 26, 1.5, '#3d6fa8')];
    case 'she':
      return [iPerson(24, 26, 1.5, '#a8447a', 'long')];
    case 'it':
      return [R(13, 16, 22, 20, 3, WOOD), R(13, 12, 22, 5, 1, WOOD_DARK)];
    case 'they':
      return [
        iPerson(12, 28, 1.0),
        iPerson(24, 28, 1.0, '#a8447a', 'long'),
        iPerson(36, 28, 1.0, '#3f8f5a'),
      ];
    default:
      return null;
  }
};

/** The arrow that points at the listener, for "you". */
const iArrowTo = (): JSX.Element[] => [
  P('M6 24 L18 24', { c: 'var(--r-rel)', w: 2.5 }),
  FILL('M13 20 L20 24 L13 28 z', 'var(--r-rel)'),
];

/* ---- 2. what a noun can be -------------------------------- */

const noun: Draw = (v) => {
  if (v === 'person') return [iPerson(24, 26, 1.5)];
  if (v === 'place')
    return [
      FILL('M8 24 L24 12 L40 24 z', '#8d4a3c'),
      R(12, 24, 24, 14, 2, '#c08260'),
      R(21, 30, 7, 8, 1, WOOD_EDGE),
    ];
  if (v === 'thing')
    return [CIR(24, 26, 12, BALL_FILL), P('M12 26h24', { c: 'rgba(0,0,0,.25)', w: 2.5 })];
  if (v === 'animal') return fitProp('cat');
  return null;
};

/* ---- 3. which one — the same three things, ringed differently ---- */

const article: Draw = (v) => {
  const three = [CIR(11, 30, 7, BALL_FILL), CIR(24, 30, 7, BALL_FILL), CIR(37, 30, 7, BALL_FILL)];
  if (v === 'the') return [...three, iRing(15, 21, 18, 18, false)];
  if (v === 'a') return [...three, iRing(15, 21, 18, 18, true)];
  if (v === 'an')
    return [
      ...three,
      iRing(15, 21, 18, 18, true),
      T(24, 14, 'a e i o u', { s: 7, w: 700, f: ACC }),
    ];
  return three;
};

/* ---- 4. things the learner can point at ------------------- */

/** A prop, scaled to fill the icon box. The stage draws these at 700px and
 *  this draws the same nodes at 40 — one definition, two sizes. */
function fitProp(id: string): JSX.Element[] | null {
  const prop = propFor(id);
  if (!prop) return null;

  const sc = 40 / Math.max(prop.box.w, prop.box.h);
  const dx = (48 - prop.box.w * sc) / 2;
  const dy = (48 - prop.box.h * sc) / 2;

  return [
    <g key="prop" transform={`translate(${dx.toFixed(1)},${dy.toFixed(1)}) scale(${sc.toFixed(3)})`}>
      {prop.draw().map((node) => nodeToSvg(node))}
    </g>,
  ];
}

const thing: Draw = (v) => fitProp(v);

/* ---- 5. the relation itself, as a picture ------------------

   One ground, one figure, one size, in every one of them: the ground is 24
   wide and the ball is r6, so reading down a column of these the only thing
   that changes is the relation itself.

   `behind` and `beside` also had to be told apart from `in front of` and
   `near`: all four were a box with a ball next to it. They are separated by
   what actually differs — occlusion for the front/back pair, contact versus a
   measured gap for the other. */

const ground = (x: number, y: number, w: number, h = 20): JSX.Element => R(x, y, w, h, 2, WOOD);

const ball = (x: number, y: number, r = 6): JSX.Element[] => iDot(x, y, r);

const dash = (x1: number, y1: number, x2: number, y2: number): JSX.Element =>
  LN(x1, y1, x2, y2, { c: MUT, w: 1.5, d: '3 3' });

/** A place marker. */
const pin = (x: number, y: number): JSX.Element[] => [
  FILL(`M${x} ${y + 9} l-6 -11 a7 7 0 1 1 12 0 z`, ACC),
  CIR(x, y - 4, 2.6, 'var(--surface)'),
];

/** An arrowless route. */
const route = (d: string, colour = ACC): JSX.Element => P(d, { c: colour, w: 2.5 });

/** An arrowhead, drawn not markered — a marker id would collide across the
 *  dozens of icons on one page. */
const head = (x: number, y: number, dir?: 'left' | 'up' | 'down'): JSX.Element => {
  const s = 5;
  if (dir === 'left') return FILL(`M${x + s} ${y - s} L${x} ${y} L${x + s} ${y + s} z`, ACC);
  if (dir === 'up' || dir === 'down')
    return FILL(`M${x - s} ${y + s} L${x} ${y} L${x + s} ${y + s} z`, ACC);
  return FILL(`M${x - s} ${y - s} L${x} ${y} L${x - s} ${y + s} z`, ACC);
};

/** The time line, with the moment marked. */
const timeLine = (y: number): JSX.Element[] => [
  LN(4, y, 44, y, { c: LINE, w: 2 }),
  LN(24, y - 5, 24, y + 5, { c: INK, w: 2 }),
];

/** A stretch of time. At 48px a tinted fill is invisible against the card, so
 *  the band is a solid bar in the accent with its ends capped — the shape has
 *  to survive being small. */
const band = (x1: number, x2: number, y: number): JSX.Element[] => [
  R(x1, y - 4, x2 - x1, 8, 2, ACC),
  LN(x1, y - 8, x1, y + 8, { c: ACC, w: 2 }),
  LN(x2, y - 8, x2, y + 8, { c: ACC, w: 2 }),
];

const PREP: Record<string, () => JSX.Element[]> = {
  /* the six the scene can actually stage */
  in: () => [...iBox(12, 10, 24, 26, true), ...iDot(24, 26, 6)],
  on: () => [...iBar(12, 22, 24), ...iDot(24, 16, 6)],
  under: () => [...iBar(12, 16, 24), ...iDot(24, 34, 6)],
  above: () => [
    ...iBar(12, 32, 24),
    ...iDot(24, 12, 6),
    LN(24, 19, 24, 29, { c: MUT, w: 1.5, d: '3 3' }),
  ],
  /* the ball goes down FIRST, so the box covers its lower half — and the
     hidden half is outlined, which is the whole difference from "in front of",
     where nothing is hidden */
  behind: () => [
    ...iDot(24, 20, 6),
    P('M18 20 a6 6 0 0 0 12 0', { c: MUT, w: 1.2, d: '2 2' }),
    R(12, 20, 24, 18, 2, WOOD),
  ],
  /* touching, on one baseline: no gap to measure, which is what tells it from
     "near" */
  beside: () => [R(8, 20, 24, 18, 2, WOOD), ...iDot(38, 32, 6)],

  /* ---- place: the rest ---- */
  below: () => [ground(12, 10, 24, 16), ...ball(24, 36), dash(24, 28, 24, 32)],
  between: () => [ground(4, 20, 14, 18), ground(30, 20, 14, 18), ...ball(24, 30)],
  /* a gap, and it is measured: the ticks are what say "not touching" */
  near: () => [
    ground(4, 20, 18, 18),
    ...ball(40, 32),
    dash(24, 32, 32, 32),
    LN(24, 27, 24, 37, { c: MUT, w: 1.2 }),
    LN(32, 27, 32, 37, { c: MUT, w: 1.2 }),
  ],
  /* the ball covers the box's near edge — nothing of it is hidden, which is
     what tells it from "behind" */
  'in front of': () => [ground(12, 16, 24, 18), ...ball(24, 34, 8)],
  there: () => [...ball(8, 32), ...pin(38, 24), dash(15, 32, 28, 28), head(33, 27)],
  here: () => [
    RING(24, 36, 10, MUT, 1.2, '2 3'),
    ...ball(24, 36),
    ...pin(24, 18),
  ],
  /* a point, not a container or a surface */
  at: () => [LN(6, 34, 42, 34, { c: LINE, w: 2 }), ...pin(24, 24)],

  /* ---- time: where the event sits on the line ---- */
  before: () => [...timeLine(28), ...ball(12, 28), dash(16, 28, 22, 28)],
  after: () => [...timeLine(28), ...ball(36, 28), dash(26, 28, 32, 28)],
  by: () => [
    ...timeLine(28),
    ...band(8, 36, 28),
    LN(38, 14, 38, 42, { c: WARN, w: 3.5 }),
    head(38, 22, 'left'),
  ],
  since: () => [...timeLine(28), ...band(10, 24, 28), ...ball(10, 28, 4)],
  during: () => [...timeLine(28), ...band(12, 36, 28), ...ball(24, 28, 4)],
  until: () => [
    ...timeLine(28),
    ...band(6, 32, 28),
    LN(34, 14, 34, 42, { c: WARN, w: 3.5 }),
    LN(38, 14, 38, 42, { c: WARN, w: 3.5 }),
  ],

  /* ---- direction: a path, and what it meets ---- */
  to: () => [...ball(8, 24), route('M15 24 H32'), head(37, 24), ...pin(43, 20)],
  into: () => [ground(24, 12, 22, 26), ...ball(8, 24), route('M14 24 H28'), head(33, 24)],
  towards: () => [
    ...ball(6, 24),
    route('M12 24 H26'),
    head(31, 24),
    dash(34, 24, 40, 24),
    ...pin(43, 20),
  ],
  along: () => [route('M4 34 C16 30 32 30 44 34', LINE), route('M6 22 H34'), head(39, 22)],
  across: () => [R(18, 4, 12, 40, 2, WOOD), route('M4 24 H34'), head(40, 24)],
  over: () => [ground(18, 28, 12, 16), route('M5 40 C12 6 36 6 43 40'), head(43, 36, 'down')],
  past: () => [ground(18, 26, 12, 18), route('M4 18 H38'), head(43, 18)],
  from: () => [ground(2, 12, 20, 26), route('M22 24 H36'), head(41, 24), ...ball(10, 24)],

  /* ---- the rest: no scene to draw, so a schematic, used consistently ---- */
  about: () => [R(16, 16, 16, 20, 2, WOOD), RING(24, 26, 20, MUT, 2, '4 4')],
  for: () => [CIR(38, 22, 6, SKIN), R(6, 20, 14, 14, 2, ACC), route('M21 27 H27'), head(32, 27)],
  with: () => [CIR(16, 24, 8, ACC), CIR(32, 24, 8, SKIN), LN(16, 36, 32, 36, { c: SOFT, w: 2.5 })],
  as: () => [
    CIR(24, 18, 7, SKIN),
    R(11, 30, 26, 11, 3, ACC),
    LN(15, 35, 33, 35, { c: 'var(--surface)', w: 2 }),
  ],
  like: () => [CIR(15, 24, 9, ACC), RING(33, 24, 9, ACC, 2.5, '4 3')],
  per: () => [
    CIR(24, 14, 6, ACC),
    LN(10, 26, 38, 26, { c: INK, w: 2.5 }),
    CIR(14, 36, 5, LINE),
    CIR(24, 36, 5, LINE),
    CIR(34, 36, 5, LINE),
  ],
};

/* aliases the source spells its own way */
const until = PREP['until'] as () => JSX.Element[];
PREP['till'] = until;
PREP['until / till'] = until;

const prep: Draw = (v) => {
  const draw = PREP[String(v).toLowerCase()];
  return draw ? draw() : null;
};

/* ---- 6. tenses — position on the line, and the shape of the event ---- */

const TENSE: Readonly<Record<string, readonly [string, 'point' | 'band', boolean]>> = {
  'Simple present': ['now', 'point', false],
  'Present continuous': ['now', 'band', false],
  'Present perfect': ['past', 'point', true],
  'Present perfect continuous': ['past', 'band', true],
  'Simple past': ['past', 'point', false],
  'Past continuous': ['past', 'band', false],
  'Past perfect': ['early', 'point', true],
  'Past perfect continuous': ['early', 'band', true],
  'Simple future': ['future', 'point', false],
  'Future continuous': ['future', 'band', false],
  'Future perfect': ['future', 'point', true],
  'Future perfect continuous': ['future', 'band', true],
};

const XPOS: Readonly<Record<string, number>> = { early: 11, past: 16, now: 24, future: 36 };

const tense: Draw = (v) => {
  const spec = TENSE[v];
  if (!spec) return null;

  const x = XPOS[spec[0]] ?? 24;
  const y = 26;
  const out: JSX.Element[] = [...axis(y)];

  if (spec[1] === 'band') {
    out.push(
      R(x - 7, y - 5, 15, 10, 3, 'var(--accent-soft)'),
      LN(x - 7, y - 5, x + 8, y - 5, { c: ACC, w: 2 }),
      LN(x - 7, y + 5, x + 8, y + 5, { c: ACC, w: 2 }),
    );
  } else {
    out.push(CIR(x, y, 5, ACC));
  }
  if (spec[2]) out.push(LN(x + 11, y - 9, x + 11, y + 9, { c: WARN, w: 2.5 }));
  return out;
};

/* ---- 7. verbs — be, have, and the modals ------------------- */

const VERB: Readonly<Record<string, () => JSX.Element[]>> = {
  'be form': () => [mark('=', INK)],
  'have form': () => [R(12, 22, 24, 14, 2, WOOD), P('M12 22 q12 -12 24 0', { c: SOFT, w: 2.5 })],
  can: () => [CIR(24, 24, 13, 'var(--accent-soft)'), mark('✓', ACC)],
  could: () => [CIR(24, 24, 13, 'var(--surface-sunk)'), mark('✓', MUT)],
  will: () => [...axis(26), CIR(36, 26, 5, ACC), LN(14, 26, 30, 26, { c: ACC, w: 2.5 })],
  would: () => [
    ...axis(26),
    RING(36, 26, 5, MUT, 2, '3 3'),
    LN(14, 26, 30, 26, { c: MUT, w: 2, d: '3 3' }),
  ],
  may: () => ticks(3, 5),
  might: () => ticks(1, 5),
  must: () => [R(16, 22, 16, 14, 2, WARN), P('M20 22 v-4 a4 4 0 0 1 8 0 v4', { c: WARN, w: 2.5 })],
  shall: () => [
    ...axis(26),
    CIR(36, 26, 5, ACC),
    LN(14, 26, 30, 26, { c: ACC, w: 2.5 }),
    T(24, 14, '★', { s: 10, f: MUT }),
  ],
  should: () => [CIR(24, 24, 13, 'var(--accent-soft)'), mark('!', ACC)],
  'ought to': () => [
    LN(24, 12, 24, 34, { c: SOFT, w: 2 }),
    LN(12, 18, 36, 18, { c: SOFT, w: 2 }),
    CIR(12, 24, 5, 'var(--accent-soft)'),
    CIR(36, 24, 5, 'var(--accent-soft)'),
  ],
};

const verb: Draw = (v) => {
  const draw = VERB[String(v).toLowerCase()];
  return draw ? draw() : null;
};

/* ---- 8. WH words — each asks for a different kind of answer ---- */

const WH: Readonly<Record<string, () => JSX.Element[]>> = {
  What: () => [R(14, 20, 20, 16, 2, WOOD), T(24, 17, '?', { s: 13, w: 700, f: ACC })],
  When: () => [
    RING(24, 25, 13, INK, 2.5),
    LN(24, 25, 24, 17, { c: INK, w: 2.5 }),
    LN(24, 25, 30, 28, { c: INK, w: 2.5 }),
  ],
  Where: () => [FILL('M24 40 l-8 -14 a9 9 0 1 1 16 0 z', ACC), CIR(24, 22, 3.5, 'var(--surface)')],
  Why: () => [T(24, 22, '→', { s: 16, f: MUT }), T(24, 38, '?', { s: 18, w: 700, f: ACC })],
  Who: () => [
    CIR(24, 19, 6, SKIN),
    FILL('M15 38 v-5 a9 9 0 0 1 18 0 v5 z', '#3d6fa8'),
    T(38, 18, '?', { s: 13, w: 700, f: ACC }),
  ],
  Whose: () => [
    CIR(18, 18, 5, SKIN),
    FILL('M11 34 v-4 a7 7 0 0 1 14 0 v4 z', '#3d6fa8'),
    R(28, 24, 14, 12, 2, WOOD),
    T(35, 20, '?', { s: 11, w: 700, f: ACC }),
  ],
  Which: () => [
    CIR(15, 27, 7, LINE),
    CIR(33, 27, 7, ACC),
    T(24, 16, '?', { s: 12, w: 700, f: ACC }),
  ],
  How: () => [R(9, 30, 9, 8, 1, LINE), R(20, 25, 9, 13, 1, LINE), R(31, 19, 9, 19, 1, ACC)],
  'How much': () => [
    CIR(18, 28, 8, '#e0a92e'),
    CIR(28, 24, 8, '#e0a92e'),
    T(24, 15, '?', { s: 11, w: 700, f: ACC }),
  ],
  'How many': () => [
    CIR(12, 28, 5, ACC),
    CIR(24, 28, 5, ACC),
    CIR(36, 28, 5, ACC),
    T(24, 15, '?', { s: 11, w: 700, f: ACC }),
  ],
  'How long': () => [
    ...axis(28),
    LN(12, 28, 36, 28, { c: ACC, w: 4 }),
    T(24, 17, '?', { s: 11, w: 700, f: ACC }),
  ],
  'How far': () => [
    CIR(9, 28, 4, INK),
    CIR(39, 28, 4, ACC),
    LN(14, 28, 34, 28, { c: MUT, w: 2, d: '3 3' }),
    T(24, 17, '?', { s: 11, w: 700, f: ACC }),
  ],
  'How old': () => [
    R(13, 26, 22, 12, 2, '#e8c9a0'),
    LN(19, 26, 19, 19, { c: WARN, w: 2 }),
    LN(29, 26, 29, 19, { c: WARN, w: 2 }),
    T(24, 15, '?', { s: 11, w: 700, f: ACC }),
  ],
  'How often': () => [...ticks(3, 5), T(24, 15, '?', { s: 11, w: 700, f: ACC })],
};

const wh: Draw = (v) => {
  const raw = String(v);
  const cased = raw.charAt(0).toUpperCase() + raw.slice(1);
  const draw = WH[raw] ?? WH[cased];
  return draw ? draw() : null;
};

/* ---- 9. adjectives — the quality itself, never the word ---- */

const ADJ: Readonly<Record<string, () => JSX.Element[]>> = {
  big: () => [CIR(24, 24, 17, ACC)],
  small: () => [CIR(24, 24, 6, ACC)],
  tall: () => bars(12, 30),
  short: () => bars(30, 12),
  happy: () => face('happy'),
  sad: () => face('sad'),
  beautiful: () => [...face('happy'), T(38, 16, '✦', { s: 13, f: ACC })],
  good: () => [CIR(24, 24, 14, 'var(--accent-soft)'), mark('✓', ACC)],
  bad: () => [CIR(24, 24, 14, 'var(--danger-soft)'), mark('✗', 'var(--danger)')],
  strong: () => [R(10, 22, 28, 8, 3, INK), CIR(10, 26, 7, INK), CIR(38, 26, 7, INK)],
  weak: () => [R(14, 25, 20, 3, 1.5, LINE), CIR(14, 26, 4, LINE), CIR(34, 26, 4, LINE)],
  fast: () => [...motion(3), CIR(34, 24, 8, ACC)],
  slow: () => [LN(10, 24, 18, 24, { c: MUT, w: 2 }), CIR(30, 24, 8, MUT)],
  clever: () => [
    CIR(24, 20, 9, '#f6e7a8'),
    R(21, 29, 6, 5, 1, LINE),
    LN(24, 8, 24, 11, { c: ACC, w: 2 }),
    LN(14, 12, 16, 14, { c: ACC, w: 2 }),
    LN(34, 12, 32, 14, { c: ACC, w: 2 }),
  ],
  kind: () => [
    FILL('M24 36 C10 26 12 14 20 14 c3 0 4 2 4 3 0-1 1-3 4-3 8 0 10 12 -4 22 z', 'var(--danger)', {
      opacity: 0.85,
    }),
  ],
  brave: () => [
    <path
      key="shield"
      d="M24 10 l13 5 v10 c0 8-7 12-13 15 -6-3-13-7-13-15 V15 z"
      fill="var(--accent-soft)"
      stroke={ACC}
      strokeWidth={2}
    />,
    mark('✓', ACC),
  ],
  honest: () => [RING(24, 24, 14, ACC, 2), mark('✓', ACC)],
};

const adj2: Draw = (v) => {
  const draw = ADJ[String(v).toLowerCase()];
  return draw ? draw() : null;
};

/* ---- 10. adverbs — how, and how often --------------------- */

const ADV: Readonly<Record<string, () => JSX.Element[]>> = {
  quickly: () => [...motion(3), CIR(34, 24, 7, ACC)],
  slowly: () => [LN(10, 24, 17, 24, { c: MUT, w: 2 }), CIR(30, 24, 7, MUT)],
  loudly: () => waves(3, 7),
  softly: () => waves(1, 6),
  always: () => ticks(5, 5),
  usually: () => ticks(4, 5),
  often: () => ticks(3, 5),
  sometimes: () => ticks(2, 5),
  never: () => [...ticks(0, 5), LN(7, 33, 41, 17, { c: 'var(--danger)', w: 2.5 })],
  yesterday: () => [...axis(26), CIR(13, 26, 5, ACC)],
  today: () => [...axis(26), CIR(24, 26, 5, ACC)],
  tomorrow: () => [...axis(26), CIR(36, 26, 5, ACC)],
  well: () => [CIR(24, 24, 14, 'var(--accent-soft)'), mark('✓', ACC)],
  badly: () => [CIR(24, 24, 14, 'var(--danger-soft)'), mark('✗', 'var(--danger)')],
};

const adv: Draw = (v) => {
  const draw = ADV[String(v).toLowerCase()];
  return draw ? draw() : null;
};

/* ---- 11. conjunctions — the shape of the join -------------- */

/* because and so join the same two halves; only the direction of cause
   differs, so the arrow has to be the thing that differs on screen. Left
   circle is the first half of the sentence, right the second, and the warn
   colour always marks the cause. */
const arrowR = (): JSX.Element[] => [
  LN(20, 24, 26, 24, { c: MUT, w: 2.5 }),
  FILL('M26 20 L31 24 L26 28 z', MUT),
];
const arrowL = (): JSX.Element[] => [
  LN(22, 24, 28, 24, { c: MUT, w: 2.5 }),
  FILL('M22 20 L17 24 L22 28 z', MUT),
];

const CONJ: Readonly<Record<string, () => JSX.Element[]>> = {
  /* both, held together */
  and: () => [CIR(15, 24, 8, ACC), CIR(33, 24, 8, ACC), P('M15 36 v4 h18 v-4', { c: SOFT, w: 2 })],
  /* one, then the opposite */
  but: () => [CIR(14, 24, 8, ACC), CIR(34, 24, 8, LINE), LN(24, 12, 24, 36, { c: WARN, w: 2.5, d: '4 3' })],
  /* a fork — one or the other */
  or: () => [
    P('M24 38 V28 M24 28 L13 18 M24 28 L35 18', { c: SOFT, w: 2.5 }),
    CIR(13, 14, 6, ACC),
    CIR(35, 14, 6, LINE),
  ],
  because: () => [CIR(12, 24, 7, ACC), CIR(36, 24, 7, WARN), ...arrowL()],
  so: () => [CIR(12, 24, 7, WARN), CIR(36, 24, 7, ACC), ...arrowR()],
};

const conj: Draw = (v) => {
  const draw = CONJ[String(v).toLowerCase()];
  return draw ? draw() : null;
};

/* ---- 12. sentence types — what the sentence is doing ------- */

const SENT: Readonly<Record<string, () => JSX.Element[]>> = {
  Positive: () => [
    R(8, 20, 32, 9, 3, 'var(--accent-soft)'),
    T(24, 42, '+', { s: 18, w: 700, f: ACC }),
  ],
  Negative: () => [
    R(8, 20, 32, 9, 3, 'var(--surface-sunk)'),
    LN(8, 33, 40, 15, { c: 'var(--danger)', w: 3 }),
  ],
  Question: () => [
    R(8, 20, 32, 9, 3, 'var(--surface-sunk)'),
    T(24, 44, '?', { s: 20, w: 700, f: ACC }),
  ],
  'Yes / No question': () => [
    T(15, 30, '✓', { s: 18, w: 700, f: ACC }),
    T(34, 30, '✗', { s: 18, w: 700, f: 'var(--danger)' }),
    T(24, 44, '?', { s: 13, w: 700, f: MUT }),
  ],
  Imperative: () => [
    P('M10 24 h20 l-6 -6 m6 6 l-6 6', { c: WARN, w: 3 }),
    T(24, 42, '!', { s: 16, w: 700, f: WARN }),
  ],
  Exclamatory: () => [T(24, 36, '!', { s: 32, w: 700, f: WARN })],
};

const sent: Draw = (v) => {
  const draw = SENT[v];
  return draw ? draw() : null;
};

/* ---- the registry ----------------------------------------- */

export const ICON: Readonly<Record<Family, Draw>> = Object.freeze({
  prep,
  thing,
  pronoun,
  article,
  noun,
  conj,
  adv,
  adj2,
  wh,
  verb,
  tense,
  sent,
});

/** The picture for one value of one family, or null when there is none. */
export const drawIcon = (family: Family, value: string): readonly JSX.Element[] | null => {
  const parts = ICON[family]?.(value);
  return parts && parts.length > 0 ? parts : null;
};
