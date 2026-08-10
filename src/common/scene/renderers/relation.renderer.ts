import { FLOOR, FLOOR_INSET, STAGE, round } from 'common/scene/layout';
import { arrow, circle, floorLine, group, line, path, rect, shadow, text } from 'common/scene/primitives';
import { propFor } from 'common/scene/props/index';
import type {
  Connective,
  Prop,
  RelationGlyph,
  RelationSpec,
  SceneNode,
} from 'common/scene/types';

/* ============================================================
   relation.renderer.ts — two items and a schematic.

   The five conjunctions and the six abstract prepositions have
   no natural picture: nothing about *because* looks like
   anything. So these are diagrams rather than scenes, and that
   is the honest form for them — the alternative is a drawing
   that pretends to be a situation and teaches something untrue.

   Because they are schematic they are also the weakest pictures
   in the product, and every one of them carries its word in both
   languages. The label is part of the scene here, not a caption
   on it: the glyph alone does not say which relation it is.

   The six prepositions are ported from `other prepositions` in
   `ui-prototypes/pages/scenes-catalogue.html`. The five
   conjunctions were never prototyped and are new.
   ============================================================ */

/* ---- the numbers ------------------------------------------- */

/** Both items are drawn at one height. A man beside a cup at their own sizes
 *  is a picture about size, and every one of these is a picture about a
 *  relation. Scaling up is allowed here and nowhere else in the product, and
 *  it is capped: a cup drawn to a man's height is a barrel. */
const ITEM_H = 148;
const SCALE_MAX = 1.4;
const SCALE_MIN = 0.3;

/** The two columns, and the space between them the glyph lives in. */
const LEFT_C = 196;
const RIGHT_C = 524;
const MIDDLE = round((LEFT_C + RIGHT_C) / 2);

/** The label, in both languages, at the foot of the stage. */
const LABEL_Y = FLOOR + 46;
const LABEL_LINE = 24;
const LABEL_SIZE = 19;

/** The brace that gathers two things: a bracket with a stem. */
const BRACE_Y = FLOOR + 6;
const BRACE_DROP = 10;
const BRACE_STEM = 8;

/** Where a glyph drawn between the items sits. */
const GLYPH_Y = 214;
const GLYPH_SIZE = 54;

/** `or`: the point the choice branches from, and the two baselines the
 *  options hang from — clear of the floor, because neither has happened. */
const BRANCH_X = 112;
const BRANCH_HIGH = 172;
const BRANCH_LOW = 322;
const BRANCH_DOT = 9;
/** Neither option has been taken, so neither is drawn solid. */
const UNCHOSEN = 0.62;

/** `about`: the bubble the topic sits in, above the thing it is the topic of. */
const BUBBLE = { x: 200, y: 40, w: 320, h: 168 } as const;
const BUBBLE_PAD = 22;
const BUBBLE_TAIL_1 = { cx: 232, cy: 232, r: 15 } as const;
const BUBBLE_TAIL_2 = { cx: 204, cy: 262, r: 9 } as const;

/** `as`: the badge that names the role, on the item that is in it. */
const BADGE_H = 40;
const BADGE_PAD = 20;
const BADGE_LIFT = 18;
const BADGE_SIZE = 17;

/** `per`: three rows of the same pair. Three, because two could be a
 *  coincidence and four does not fit. */
const RATE_ROWS = 3;
const RATE_TOP = 74;
const RATE_STEP = 84;
const RATE_H = 60;
const RATE_LEFT = 236;
const RATE_RIGHT = 470;
const RATE_MARK_X = 606;

/** `with`: the journey the two of them are on together, drawn over their heads
 *  — under them is where the brace and the label are. */
const TOGETHER_Y = 148;

/** `for`: the receiver is ringed, because "who it is for" is the whole point
 *  of the preposition and an arrow alone points at a thing, not at a role. */
const RING_PAD = 12;

const DASH = '9 7';

/* ---- what each relation is ---------------------------------
   Eleven relations, eight glyphs: `and` and `with` are both a
   gathering, `because`, `so` and `for` are all an arrow between
   the two. What separates the ones that share a glyph is drawn,
   not left to the label — `with` adds the journey they are on,
   `for` rings the one who benefits, and `because` points the
   opposite way from `so`.

   The words are here for the same reason a prop's words are in
   the prop library: the scene engine may not read `content/`,
   and a scene whose meaning is carried by a label cannot be
   drawn without one. They are the source's own glosses, with one
   correction — see `content/README.md`.
   ------------------------------------------------------------ */

export type RelationWord = { readonly en: string; readonly ta: string };

export type RelationKind = {
  readonly glyph: RelationGlyph;
  readonly word: RelationWord;
};

export const RELATIONS: Readonly<Record<Connective, RelationKind>> = Object.freeze({
  and: { glyph: 'brace', word: { en: 'and', ta: 'மற்றும்' } },
  but: { glyph: 'contrast', word: { en: 'but', ta: 'ஆனால்' } },
  or: { glyph: 'branch', word: { en: 'or', ta: 'அல்லது' } },
  because: { glyph: 'cause', word: { en: 'because', ta: 'ஏனெனில்' } },
  so: { glyph: 'cause', word: { en: 'so', ta: 'ஆகவே' } },
  about: { glyph: 'bubble', word: { en: 'about', ta: 'பற்றி' } },
  for: { glyph: 'cause', word: { en: 'for', ta: 'காக' } },
  with: { glyph: 'brace', word: { en: 'with', ta: 'உடன்' } },
  /* ஆக, not the source's போல: போல is "like", and a lexicon that glosses `as`
     with the word for `like` teaches exactly the confusion this renderer
     exists to prevent. The source's own example sentence uses -ஆக. */
  as: { glyph: 'role', word: { en: 'as', ta: 'ஆக' } },
  like: { glyph: 'similarity', word: { en: 'like', ta: 'போன்ற' } },
  per: { glyph: 'rate', word: { en: 'per', ta: 'ஒன்றுக்கு' } },
});

export const glyphFor = (connective: Connective): RelationGlyph => RELATIONS[connective].glyph;

/**
 * Why this scene cannot be drawn, or null when it can.
 *
 * The glyph is checked rather than obeyed, as in every other renderer: content
 * saying `because` with a `brace` describes no relation, and a picture that
 * gathers two things while the sentence gives a reason is worse than no
 * picture at all.
 */
export function relationProblem(spec: RelationSpec): string | null {
  if (!propFor(spec.left)) return `no prop is drawn for the left item "${spec.left}"`;
  if (!propFor(spec.right)) return `no prop is drawn for the right item "${spec.right}"`;

  const wanted = glyphFor(spec.connective);
  if (spec.glyph !== wanted) {
    return `"${spec.connective}" is drawn as a ${wanted}, not as a ${spec.glyph}`;
  }
  return null;
}

/* ---- placing the two items --------------------------------- */

type Placed = {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly scale: number;
};

type Item = {
  readonly id: string;
  readonly prop: Prop;
  readonly at: Placed;
  /** `left` and `right` are roles the picture-words light up, and both copies
   *  of a repeated item share one. */
  readonly role: 'left' | 'right';
  readonly opacity?: number;
};

type Scene = {
  readonly items: readonly Item[];
  readonly glyph: readonly SceneNode[];
  /** A rate is a table, not a room; a choice has not happened anywhere yet. */
  readonly floor: boolean;
};

const scaleFor = (prop: Prop, height = ITEM_H): number =>
  Math.max(SCALE_MIN, Math.min(SCALE_MAX, Math.floor((height / prop.box.h) * 1000) / 1000));

/** Centred on x, with its bottom on baseY. */
function place(prop: Prop, centre: number, baseY: number, height = ITEM_H): Placed {
  const scale = scaleFor(prop, height);
  const w = prop.box.w * scale;
  const h = prop.box.h * scale;

  return {
    x: round(Math.max(FLOOR_INSET, Math.min(STAGE.width - FLOOR_INSET - w, centre - w / 2))),
    /* Clamped in both directions, because a branch or a bubble puts an item
       somewhere that is not the floor and a tall prop sent there runs off the
       bottom of the viewBox. */
    y: round(Math.max(0, Math.min(STAGE.height - h, baseY - h))),
    w: round(w),
    h: round(h),
    scale,
  };
}

const pair = (left: Prop, right: Prop, baseY = FLOOR): readonly [Placed, Placed] => [
  place(left, LEFT_C, baseY),
  place(right, RIGHT_C, baseY),
];

const items = (left: Prop, right: Prop, at: readonly [Placed, Placed], opacity?: number): readonly Item[] => [
  { id: 'left', prop: left, role: 'left', ...(opacity === undefined ? {} : { opacity }), at: at[0] },
  { id: 'right', prop: right, role: 'right', ...(opacity === undefined ? {} : { opacity }), at: at[1] },
];

/* ---- the glyphs -------------------------------------------- */

/** A bracket under both items with a stem hanging from the middle: these two
 *  are taken as one thing. */
function brace(left: Placed, right: Placed): readonly SceneNode[] {
  const x0 = round(left.x - 10);
  const x1 = round(right.x + right.w + 10);
  const mid = round((x0 + x1) / 2);

  return [
    path('glyph-brace', {
      d: `M${x0},${BRACE_Y} v${BRACE_DROP} H${x1} v${-BRACE_DROP}`,
      stroke: 'var(--r-rel)',
      strokeWidth: 3.5,
    }),
    line('glyph-brace-stem', {
      x1: mid,
      y1: round(BRACE_Y + BRACE_DROP),
      x2: mid,
      y2: round(BRACE_Y + BRACE_DROP + BRACE_STEM),
      stroke: 'var(--r-rel)',
      strokeWidth: 3.5,
    }),
  ];
}

/** The slash that sets two things against each other, on a divider that says
 *  they are on opposite sides of it. */
const contrast = (): readonly SceneNode[] => [
  line('glyph-divider', {
    x1: MIDDLE,
    y1: 148,
    x2: MIDDLE,
    y2: FLOOR,
    stroke: 'var(--line-strong)',
    strokeWidth: 2.5,
    dash: DASH,
  }),
  line('glyph-contrast', {
    x1: round(MIDDLE - 34),
    y1: round(GLYPH_Y + 46),
    x2: round(MIDDLE + 34),
    y2: round(GLYPH_Y - 46),
    stroke: 'var(--r-rel)',
    strokeWidth: 7,
  }),
];

/** One point, two ways out of it, and neither taken. */
function branch(high: Placed, low: Placed): readonly SceneNode[] {
  const from: readonly [number, number] = [BRANCH_X, round(STAGE.height / 2)];

  return [
    circle('glyph-branch-point', { cx: from[0], cy: from[1], r: BRANCH_DOT, fill: 'var(--r-rel)' }),
    arrow('glyph-branch-high', { from, to: [round(high.x - 16), round(high.y + high.h / 2)] }),
    arrow('glyph-branch-low', { from, to: [round(low.x - 16), round(low.y + low.h / 2)] }),
  ];
}

/** An arrow between the two, pointing the way the meaning runs. `because`
 *  points back at the reason and `so` points on at the result; drawn the same
 *  way round they would be one picture with two names. */
function cause(left: Placed, right: Placed, forwards: boolean): readonly SceneNode[] {
  const start = round(left.x + left.w + 18);
  const end = round(right.x - 18);
  const y = GLYPH_Y;

  return [
    arrow('glyph-cause', {
      from: forwards ? [start, y] : [end, y],
      to: forwards ? [end, y] : [start, y],
      strokeWidth: 5,
    }),
  ];
}

/** Two things that are alike and are not the same thing: an approximation sign
 *  between them, and a tie to each that does not touch either. */
const similarity = (left: Placed, right: Placed): readonly SceneNode[] => [
  text('glyph-similarity', {
    x: MIDDLE,
    y: round(GLYPH_Y + 18),
    content: '≈',
    size: GLYPH_SIZE,
    weight: 400,
    fill: 'var(--r-rel)',
  }),
  line('glyph-similarity-left', {
    x1: round(left.x + left.w + 14),
    y1: GLYPH_Y,
    x2: round(MIDDLE - 32),
    y2: GLYPH_Y,
    stroke: 'var(--line-strong)',
    strokeWidth: 3,
    dash: '8 8',
  }),
  line('glyph-similarity-right', {
    x1: round(MIDDLE + 32),
    y1: GLYPH_Y,
    x2: round(right.x - 14),
    y2: GLYPH_Y,
    stroke: 'var(--line-strong)',
    strokeWidth: 3,
    dash: '8 8',
  }),
];

/**
 * Identity, not resemblance: an equals sign, and the role written on the one
 * who is in it.
 *
 * The badge carries the right item's own English word, which the prop knows —
 * *he works as a driver* is a claim that he **is** the driver, and the only
 * way to draw a claim about identity is to put the name on the thing.
 */
function role(left: Placed, right: Prop, rightAt: Placed): readonly SceneNode[] {
  const label = right.word.en.singular;
  /* Text cannot be measured here — the drawn width depends on a font that may
     not have loaded — so the badge is sized from the character count. It is a
     rounded box either way, and a badge a little wide is not a wrong picture. */
  const width = Math.max(96, label.length * 12 + BADGE_PAD * 2);
  const x = round(left.x + left.w / 2 - width / 2);
  const y = round(left.y - BADGE_H - BADGE_LIFT);

  return [
    text('glyph-role-equals', {
      x: MIDDLE,
      y: round(GLYPH_Y + 16),
      content: '=',
      size: GLYPH_SIZE,
      weight: 700,
      fill: 'var(--r-rel)',
    }),
    /* Outlined rather than filled: a solid chip needs a text colour that
       reads on it in both themes, and every other glyph in this renderer is a
       stroke. */
    rect('glyph-role-badge', {
      x,
      y,
      w: round(width),
      h: BADGE_H,
      r: 10,
      stroke: 'var(--r-rel)',
      strokeWidth: 3,
    }),
    text('glyph-role-name', {
      x: round(x + width / 2),
      y: round(y + BADGE_H / 2 + 6),
      content: label,
      size: BADGE_SIZE,
      weight: 700,
      fill: 'var(--r-rel)',
      lang: 'en',
    }),
    line('glyph-role-tie', {
      x1: round(rightAt.x + rightAt.w / 2),
      y1: round(rightAt.y - 12),
      x2: round(x + width),
      y2: round(y + BADGE_H),
      stroke: 'var(--r-rel)',
      strokeWidth: 2.5,
      dash: '7 6',
    }),
  ];
}

/** The topic, in a bubble over the thing it is the topic of: what is inside
 *  it, in the sense of content rather than space. */
const bubble = (): readonly SceneNode[] => [
  rect('glyph-bubble', {
    ...BUBBLE,
    w: BUBBLE.w,
    h: BUBBLE.h,
    r: 22,
    fill: 'none',
    stroke: 'var(--r-rel)',
    strokeWidth: 3,
  }),
  circle('glyph-bubble-tail', {
    ...BUBBLE_TAIL_1,
    fill: 'none',
    stroke: 'var(--r-rel)',
    strokeWidth: 3,
  }),
  circle('glyph-bubble-tail-small', {
    ...BUBBLE_TAIL_2,
    fill: 'none',
    stroke: 'var(--r-rel)',
    strokeWidth: 3,
  }),
];

/** One more of the left, one more of the right, three times over. A rate is a
 *  thing that keeps happening, so it is drawn happening more than once. */
function rate(rows: readonly (readonly [Placed, Placed])[]): readonly SceneNode[] {
  const equals = rows.map((row, index) =>
    text(`glyph-rate-equals-${index}`, {
      x: MIDDLE,
      y: round(row[0].y + row[0].h / 2 + 9),
      content: '=',
      size: 30,
      weight: 700,
      fill: 'var(--muted)',
    }),
  );
  const first = rows[0];
  const last = rows[rows.length - 1];

  return [
    ...equals,
    arrow('glyph-rate-again', {
      from: [RATE_MARK_X, round((first?.[0].y ?? RATE_TOP) - 8)],
      to: [RATE_MARK_X, round((last?.[0].y ?? RATE_TOP) + RATE_H + 12)],
      dash: '10 8',
      strokeWidth: 4,
    }),
  ];
}

/** Two of them on one journey: the brace says together, the arrow says going. */
const together = (): readonly SceneNode[] => [
  arrow('glyph-together', {
    from: [round(MIDDLE - 96), TOGETHER_Y],
    to: [round(MIDDLE + 96), TOGETHER_Y],
    strokeWidth: 4,
  }),
];

/** The one who benefits, ringed. An arrow alone points at a thing; the ring is
 *  what says the thing is a receiver. */
const beneficiary = (at: Placed): readonly SceneNode[] => [
  rect('glyph-for-ring', {
    x: round(at.x - RING_PAD),
    y: round(at.y - RING_PAD),
    w: round(at.w + RING_PAD * 2),
    h: round(at.h + RING_PAD * 2),
    r: 14,
    stroke: 'var(--r-rel)',
    strokeWidth: 3,
    dash: DASH,
  }),
];

/* ---- one rule per relation --------------------------------- */

type Build = (left: Prop, right: Prop) => Scene;

const SCENES: Readonly<Record<Connective, Build>> = {
  and: (left, right) => {
    const at = pair(left, right);
    return { items: items(left, right, at), glyph: brace(at[0], at[1]), floor: true };
  },

  with: (left, right) => {
    const at = pair(left, right);
    return {
      items: items(left, right, at),
      glyph: [...brace(at[0], at[1]), ...together()],
      floor: true,
    };
  },

  but: (left, right) => {
    const at = pair(left, right);
    return { items: items(left, right, at), glyph: contrast(), floor: true };
  },

  /* Both drawn, because a choice with one option is not a choice — and both
     faded, because neither has been taken. */
  or: (left, right) => {
    const at: readonly [Placed, Placed] = [
      place(left, RIGHT_C - 120, BRANCH_HIGH),
      place(right, RIGHT_C + 40, BRANCH_LOW),
    ];
    return {
      items: items(left, right, at, UNCHOSEN),
      glyph: branch(at[0], at[1]),
      floor: false,
    };
  },

  because: (left, right) => {
    const at = pair(left, right);
    return { items: items(left, right, at), glyph: cause(at[0], at[1], false), floor: true };
  },

  so: (left, right) => {
    const at = pair(left, right);
    return { items: items(left, right, at), glyph: cause(at[0], at[1], true), floor: true };
  },

  for: (left, right) => {
    const at = pair(left, right);
    return {
      items: items(left, right, at),
      glyph: [...cause(at[0], at[1], true), ...beneficiary(at[1])],
      floor: true,
    };
  },

  like: (left, right) => {
    const at = pair(left, right);
    return { items: items(left, right, at), glyph: similarity(at[0], at[1]), floor: true };
  },

  as: (left, right) => {
    const at = pair(left, right);
    return { items: items(left, right, at), glyph: role(at[0], right, at[1]), floor: true };
  },

  /* The topic goes in the bubble and the thing it is about stands under it. */
  about: (left, right) => {
    const topic = place(right, round(BUBBLE.x + BUBBLE.w / 2), round(BUBBLE.y + BUBBLE.h - BUBBLE_PAD), BUBBLE.h - BUBBLE_PAD * 2);
    const at: readonly [Placed, Placed] = [place(left, MIDDLE, FLOOR), topic];

    return { items: items(left, right, at), glyph: bubble(), floor: true };
  },

  per: (left, right) => {
    const rows = Array.from({ length: RATE_ROWS }, (_, index) => {
      const base = round(RATE_TOP + index * RATE_STEP + RATE_H);
      return [place(left, RATE_LEFT, base, RATE_H), place(right, RATE_RIGHT, base, RATE_H)] as const;
    });

    return {
      items: rows.flatMap(([one, other], index) => [
        { id: `left-${index}`, prop: left, role: 'left' as const, at: one },
        { id: `right-${index}`, prop: right, role: 'right' as const, at: other },
      ]),
      glyph: rate(rows),
      floor: false,
    };
  },
};

/* ---- drawing ----------------------------------------------- */

/** The relation's own word, in both languages, at the foot of the stage.
 *
 *  Not decoration: these glyphs are not self-explanatory, and a brace with no
 *  word beside it is a bracket. */
const label = (connective: Connective): readonly SceneNode[] => {
  const word = RELATIONS[connective].word;

  return [
    text('label', {
      x: round(STAGE.width / 2),
      y: LABEL_Y,
      content: word.en,
      size: LABEL_SIZE,
      weight: 700,
      fill: 'var(--r-rel)',
      lang: 'en',
    }),
    text('label-ta', {
      x: round(STAGE.width / 2),
      y: round(LABEL_Y + LABEL_LINE),
      content: word.ta,
      size: LABEL_SIZE,
      fill: 'var(--muted)',
      lang: 'ta',
    }),
  ];
};

/**
 * A relation scene, as a node tree.
 *
 * Returns nothing at all for a spec `relationProblem` refuses, the same as
 * every other renderer.
 */
export function renderRelation(spec: RelationSpec): readonly SceneNode[] {
  const left = propFor(spec.left);
  const right = propFor(spec.right);
  if (!left || !right || relationProblem(spec) !== null) return [];

  const scene = SCENES[spec.connective](left, right);

  return [
    ...(scene.floor ? [floorLine()] : []),
    ...scene.items.flatMap(standingShadow),
    ...scene.glyph,
    ...scene.items.map((item) =>
      group(item.id, item.prop.draw(), {
        x: item.at.x,
        y: item.at.y,
        scale: item.at.scale,
        ...(item.opacity === undefined ? {} : { opacity: item.opacity }),
        role: item.role,
      }),
    ),
    ...label(spec.connective),
  ];
}

/** Only for an item standing on the floor. Everything in a bubble, on a branch
 *  or in a rate table is on nothing. */
function standingShadow(item: Item): readonly SceneNode[] {
  if (Math.abs(item.at.y + item.at.h - FLOOR) > 1) return [];
  return [shadow(`shadow-${item.id}`, item.at.x, item.prop.box.w, item.at.scale)];
}
