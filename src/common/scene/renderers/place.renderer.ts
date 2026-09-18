import { FLOOR, FLOOR_INSET, STAGE, round } from 'common/scene/layout';
import { arrow, ellipse, floorLine, group, line, rect, shadow } from 'common/scene/primitives';
import { propFor } from 'common/scene/props/index';
import type { FigureCount, PlaceRelation, PlaceSpec, Prop, PropId, SceneNode } from 'common/scene/types';

/* ============================================================
   place.renderer.ts — figure + ground + spatial relation.

   The renderer that carries five of the ten topics: prepositions
   of place, articles, adjectives, number and nouns. One picture
   grammar, thirteen relations.

   Six relations — in, on, under, above, behind, beside — are
   ported from the prototype, where the geometry was verified
   against forty scenes. `at`, `below`, `in front of`, `near` and
   `between` were added to the prototype after engine 11 was
   written and are ported too. `here` and `there` are new: they
   are the only two relations with no ground at all, so they need
   something else to be relative to, and that is the speaker's
   spot on the floor.

   Pure: a spec in, a node tree out. No React, no DOM, no store.
   ============================================================ */

/* ---- the numbers ------------------------------------------- */

/** Between copies of the figure in a row. */
const FIGURE_GAP = 14;

/** The widest a row may ever be: the floor line, less nothing. */
const STAGE_ROOM = STAGE.width - 2 * FLOOR_INSET;

/** `on` a ground with no surface — a tree — sits this far below its top
 *  rather than balanced on the topmost pixel of the canopy. */
const ON_FALLBACK_DROP = 20;

/** `under` keeps this much air above the figure, so it reads as sheltered
 *  rather than as jammed against the underside. */
const UNDER_HEADROOM = 12;
const UNDER_LIFT = 4;

/** `above` is a deliberate gap. It shrinks for a tall ground rather than
 *  pushing the figure off the top of the stage. */
const ABOVE_GAP = 36;
const ABOVE_GAP_SHARE = 0.25;
const ABOVE_HEADROOM = 8;

/** `behind`: how much of the figure the ground swallows, and how much smaller
 *  being further away makes it. A figure drawn beside the ground reads as
 *  "beside" — occlusion is the whole cue. */
const BEHIND_SINK = 0.55;
const BEHIND_SCALE = 0.8;

/** `in front of` is the mirror: nearer, so lower and larger, and it occludes
 *  the ground instead of being occluded by it. */
const FRONT_SCALE = 1.25;
const FRONT_DROP = 6;

/** `at` stands on the ground's own footprint, half on and half off its edge.
 *  Centred under it the picture was "under" again. */
const AT_DROP = 10;

/** Clear of the ground, at three measured distances. */
const BESIDE_GAP = 26;
const NEAR_GAP = 130;
const BELOW_GAP = 110;
const THERE_GAP = 150;

/** However tight the stage gets, the gap that carries the meaning never eats
 *  more than this share of the room beside the ground. */
const PAIR_GAP_SHARE = 0.4;

/** The measured rules that carry `near` and `below`. Drawn, never captioned:
 *  the distance is the relation. */
const SPAN_INSET = 14;
const SPAN_LIFT = 30;
const LEVEL_GAP = 10;
const LEVEL_STOP = 20;
const DROP_START = 16;
const DROP_CLEAR = 12;
const DROP_CAP = 11;
const DROP_HEAD = 7;

/** `between` pushes both grounds to the edges so the space they leave reads as
 *  a gap rather than as a crowd. */
const BETWEEN_EDGE = 46;
const BETWEEN_CLEARANCE = 90;
const BETWEEN_MARGIN = 80;
const BETWEEN_MAX_SIDE = 210;

/** `here` and `there`: nearer is larger, further is smaller — the same depth
 *  cue `behind` and `in front of` are built on. */
const HERE_SCALE = 1.15;
const THERE_SCALE = 0.8;

/** The speaker's spot on the floor, which is what `here` and `there` are
 *  relative to when there is no ground. */
const SPOT_RY = 12;
const SPOT_PAD = 16;
const SPOT_MIN_RX = 46;
const SPOT_CORE = 0.42;
const SPOT_WASH = 0.22;
const THERE_ARROW_LIFT = 26;

/** The determiner ring. Its word belongs in the guide outside the drawing. */
const RING_PAD = 9;
const RING_RADIUS = 12;
const RING_WIDTH = 3;
const RING_DASH = '9 7';

/* ---- adjectives --------------------------------------------
   Colour changes the fill, size changes the scale. Nothing else
   is drawable: an adjective this table does not know would leave
   the picture unchanged while the sentence claimed otherwise,
   which is the one thing this product must never do. So an
   unknown adjective is refused rather than ignored.
   ------------------------------------------------------------ */

export type AdjectiveEffect = {
  /** A colour token, or null when the adjective is about size. */
  readonly fill: string | null;
  readonly scale: number;
};

export const PLACE_ADJECTIVES: Readonly<Record<string, AdjectiveEffect>> = Object.freeze({
  red: { fill: 'var(--prop-red)', scale: 1 },
  green: { fill: 'var(--prop-leaf)', scale: 1 },
  blue: { fill: 'var(--prop-cloth)', scale: 1 },
  yellow: { fill: 'var(--prop-gold)', scale: 1 },
  big: { fill: null, scale: 1.32 },
  small: { fill: null, scale: 0.64 },
});

function adjectiveFor(name: string | null): AdjectiveEffect | undefined {
  if (name === null) return undefined;
  if (!Object.prototype.hasOwnProperty.call(PLACE_ADJECTIVES, name)) return undefined;
  return PLACE_ADJECTIVES[name];
}

/* ---- what can be drawn -------------------------------------
   Not every combination of words describes a situation that
   exists. The app disables the impossible option rather than
   drawing a wrong picture, and these two functions are what it
   asks.
   ------------------------------------------------------------ */

type FreeRelation = 'here' | 'there';
type GroundedRelation = Exclude<PlaceRelation, FreeRelation>;

/** `here` and `there` point at where the speaker is. Drawing a second thing
 *  for them to be near would be inventing one. */
const FREE_RELATIONS: ReadonlySet<string> = new Set<FreeRelation>(['here', 'there']);

const isFree = (relation: PlaceRelation): relation is FreeRelation =>
  FREE_RELATIONS.has(relation);

/**
 * Whether this relation can be drawn against this ground.
 *
 * Asked in both directions: the relation knob asks it of every relation with
 * the ground fixed, and the ground knob asks it of every ground with the
 * relation fixed.
 */
export function placeAllows(
  relation: PlaceRelation,
  groundId: PropId | string | null,
  ground2Id: PropId | string | null = null,
): boolean {
  if (isFree(relation)) return true;

  const ground = propFor(groundId);
  if (!ground) return false;
  if (relation === 'in') return ground.inside !== null;
  if (relation === 'under') return ground.clearance;
  if (relation === 'between') return propFor(ground2Id) !== undefined;
  return true;
}

/**
 * Why this scene cannot be drawn, or null when it can.
 *
 * `renderPlace` returns nothing for a spec with a problem — a blank stage is
 * visibly wrong, where a picture that contradicts its sentence is not — and
 * this is the message that says what went missing.
 */
export function placeProblem(spec: PlaceSpec): string | null {
  if (!propFor(spec.figure)) return `no prop is drawn for the figure "${spec.figure}"`;
  if (spec.adjective !== null && !adjectiveFor(spec.adjective)) {
    return `nothing in the picture changes for the adjective "${spec.adjective}"`;
  }
  if (isFree(spec.relation)) return null;

  const ground = propFor(spec.ground);
  if (!ground) return `"${spec.relation}" needs a ground and "${spec.ground}" is not drawn`;
  if (spec.relation === 'in' && ground.inside === null) {
    return `nothing goes inside the ${String(spec.ground)}`;
  }
  if (spec.relation === 'under' && !ground.clearance) {
    return `nothing fits under the ${String(spec.ground)}`;
  }
  if (spec.relation === 'between' && !propFor(spec.ground2)) {
    return '"between" needs two grounds and only one is given';
  }
  return null;
}

/* ---- layout ------------------------------------------------ */

/** Where a thing is drawn: the top-left of its own box, and the scale it is
 *  drawn at. The same three numbers place a figure and a ground. */
type Placed = { readonly x: number; readonly y: number; readonly scale: number };
type Spot = Placed;

type Ctx = {
  readonly figure: Prop;
  readonly count: FigureCount;
  /** The adjective's scale, already applied to `fw` and `fh`. */
  readonly scale: number;
  readonly fw: number;
  readonly fh: number;
};

type GroundCtx = Ctx & {
  readonly ground: Prop;
  readonly ground2: Prop | null;
  readonly gx: number;
  readonly gy: number;
  readonly gw: number;
  readonly gh: number;
};

type Layout = {
  readonly figures: readonly Spot[];
  readonly ground?: Placed;
  readonly ground2?: Placed;
  /** Draw order is the depth cue: behind goes under the ground. */
  readonly behind?: boolean;
  readonly frontShadow?: boolean;
  readonly marks?: readonly SceneNode[];
};

/** Three decimals, always downwards. Rounded to nearest, a scale computed to
 *  exactly fill a container comes back a thousandth larger and the row it
 *  measures no longer fits — which is how three balls came to stick out of the
 *  box by a hundredth of a pixel. */
const scaleFloor = (value: number): number => Math.floor(value * 1000) / 1000;

const rowWidth = (ctx: Ctx, fit: number): number =>
  ctx.count * ctx.fw * fit + (ctx.count - 1) * FIGURE_GAP;

/** Shrink until the row fits the width available, never grow past what was
 *  asked for. Three large figures beside a wide ground run off the stage
 *  otherwise. */
function fitFor(ctx: Ctx, wanted: number, maxWidth: number): number {
  if (rowWidth(ctx, wanted) <= maxWidth) return wanted;
  const gaps = (ctx.count - 1) * FIGURE_GAP;
  return Math.max(0, scaleFloor((maxWidth - gaps) / (ctx.count * ctx.fw)));
}

type RowOptions = {
  /** Where the bottom of each figure sits. */
  readonly baseY: number;
  readonly fit?: number;
  readonly centre?: number;
  /** Overrides `centre` when the row hangs off a known left edge. */
  readonly left?: number;
  readonly maxWidth?: number;
};

function figureRow(ctx: Ctx, o: RowOptions): readonly Spot[] {
  const fit = fitFor(ctx, o.fit ?? 1, o.maxWidth ?? STAGE_ROOM);
  const width = rowWidth(ctx, fit);
  const left = o.left ?? (o.centre ?? STAGE.width / 2) - width / 2;
  const step = ctx.fw * fit + FIGURE_GAP;

  return Array.from({ length: ctx.count }, (_, index) => ({
    x: round(left + index * step),
    y: round(o.baseY - ctx.fh * fit),
    scale: scaleFloor(ctx.scale * fit),
  }));
}

type Pair = {
  readonly groundX: number;
  readonly rowLeft: number;
  readonly fit: number;
  readonly width: number;
};

/**
 * A ground and a row of figures side by side, centred on the stage as one
 * assembly.
 *
 * The prototype offset the figures from a ground fixed at the centre, which
 * put three of them off the right edge. Centring the pair keeps the gap that
 * carries the meaning and gives the row somewhere to be.
 */
function pairedRow(ctx: Ctx, groundWidth: number, wantedGap: number, wanted = 1): Pair {
  const room = Math.max(0, STAGE_ROOM - groundWidth);
  const gap = Math.min(wantedGap, room * PAIR_GAP_SHARE);
  const fit = fitFor(ctx, wanted, room - gap);
  const width = rowWidth(ctx, fit);
  const groundX = round(FLOOR_INSET + (STAGE_ROOM - (groundWidth + gap + width)) / 2);

  return { groundX, rowLeft: round(groundX + groundWidth + gap), fit, width };
}

/* ---- the marks that carry a measurement -------------------- */

const measure = (id: string, x1: number, y1: number, x2: number, y2: number, dash = ''): SceneNode =>
  line(id, { x1, y1, x2, y2, stroke: 'var(--r-rel)', strokeWidth: 3, dash });

/** The speaker's spot: a wash on the floor with a solid core. Filled rather
 *  than stroked, so it reads at a glance as a place rather than as another
 *  ring competing with the determiner's. */
function spotMark(centre: number, rx: number): readonly SceneNode[] {
  return [
    ellipse('mark-spot', {
      cx: centre,
      cy: FLOOR + 3,
      rx,
      ry: SPOT_RY,
      fill: 'var(--r-rel)',
      opacity: SPOT_WASH,
    }),
    ellipse('mark-spot-core', {
      cx: centre,
      cy: FLOOR + 3,
      rx: round(rx * SPOT_CORE),
      ry: round(SPOT_RY * SPOT_CORE),
      fill: 'var(--r-rel)',
    }),
  ];
}

/** The drop that says "lower than this level", with a cap at each end and a
 *  head pointing down. */
function dropMark(x: number, top: number, bottom: number): readonly SceneNode[] {
  return [
    measure('mark-drop', x, top, x, bottom, RING_DASH),
    measure('mark-drop-top', x - DROP_CAP, top, x + DROP_CAP, top),
    measure('mark-drop-foot', x - DROP_CAP, bottom, x + DROP_CAP, bottom),
    line('mark-drop-head-left', {
      x1: x - DROP_HEAD,
      y1: bottom - DROP_HEAD * 2,
      x2: x,
      y2: bottom,
      stroke: 'var(--r-rel)',
      strokeWidth: 3,
    }),
    line('mark-drop-head-right', {
      x1: x + DROP_HEAD,
      y1: bottom - DROP_HEAD * 2,
      x2: x,
      y2: bottom,
      stroke: 'var(--r-rel)',
      strokeWidth: 3,
    }),
  ];
}

/** The gap that says "this far apart", ticked at both ends. */
function spanMark(x0: number, x1: number, y: number): readonly SceneNode[] {
  return [
    measure('mark-span', x0, y, x1, y),
    measure('mark-span-start', x0, y - DROP_CAP, x0, y + DROP_CAP),
    measure('mark-span-end', x1, y - DROP_CAP, x1, y + DROP_CAP),
  ];
}

/* ---- one rule per relation --------------------------------- */

function inside(ctx: GroundCtx, box: readonly [number, number, number, number]): readonly Spot[] {
  const [ix, iy, iw, ih] = box;
  const fit = fitFor(ctx, Math.min(1, ih / ctx.fh), iw);

  return figureRow(ctx, {
    baseY: ctx.gy + iy + ih / 2 + (ctx.fh * fit) / 2,
    fit,
    centre: ctx.gx + ix + iw / 2,
    maxWidth: iw,
  });
}

const GROUNDED: Readonly<Record<GroundedRelation, (ctx: GroundCtx) => Layout>> = {
  in: (ctx) => ({
    figures: ctx.ground.inside === null ? [] : inside(ctx, ctx.ground.inside),
  }),

  on: (ctx) => ({
    figures: figureRow(ctx, {
      baseY: ctx.gy + (ctx.ground.surfaceY ?? ON_FALLBACK_DROP),
      centre: ctx.gx + ctx.gw / 2,
      maxWidth: ctx.gw,
    }),
  }),

  /* Present at the place, not offset from it: on the ground's own edge, half
     on and half off, which is what separates it from beside. */
  at: (ctx) => ({
    figures: figureRow(ctx, {
      baseY: FLOOR + AT_DROP,
      left: ctx.gx - ctx.fw / 2,
      maxWidth: STAGE.width - FLOOR_INSET - (ctx.gx - ctx.fw / 2),
    }),
  }),

  under: (ctx) => ({
    figures: figureRow(ctx, {
      baseY: FLOOR - UNDER_LIFT,
      fit: Math.min(1, (FLOOR - ctx.gy - (ctx.ground.surfaceY ?? 0) - UNDER_HEADROOM) / ctx.fh),
      centre: ctx.gx + ctx.gw / 2,
      maxWidth: ctx.gw,
    }),
  }),

  above: (ctx) => {
    const gap = Math.min(ABOVE_GAP, ctx.gy * ABOVE_GAP_SHARE);
    const baseY = round(ctx.gy - gap);
    const centre = ctx.gx + ctx.gw / 2;
    const room = ctx.gy - gap - ABOVE_HEADROOM;
    const figures = figureRow(ctx, { baseY, fit: Math.min(1, room / ctx.fh), centre });

    return { figures, marks: [measure('mark-gap', centre, baseY, centre, ctx.gy, RING_DASH)] };
  },

  /* Lower than a level, which is not the same as under: under puts the figure
     beneath the ground's own body, below only says further down. The ground
     stays where it is, its top becomes the level, and the figure sits clear of
     it and plainly under that line. */
  below: (ctx) => {
    const pair = pairedRow(ctx, ctx.gw, BELOW_GAP);
    const clear = (FLOOR - ctx.gy - DROP_CLEAR * 2) / ctx.fh;
    const fit = Math.min(pair.fit, clear);
    const figures = figureRow(ctx, { baseY: FLOOR, left: pair.rowLeft, fit });
    const top = FLOOR - ctx.fh * fit;
    const dropX = round(pair.rowLeft + (ctx.fw * fit) / 2);

    return {
      ground: { x: pair.groundX, y: ctx.gy, scale: 1 },
      figures,
      marks: [
        measure(
          'mark-level',
          pair.groundX + ctx.gw + LEVEL_GAP,
          ctx.gy,
          dropX - LEVEL_STOP,
          ctx.gy,
          '7 6',
        ),
        ...dropMark(dropX, round(ctx.gy + DROP_START), round(top - DROP_CLEAR)),
      ],
    };
  },

  /* The depth cue is occlusion, so the figure has to be where there is
     something to hide it. At the leg height of a table there is nothing, and
     the picture came out identical to under; sitting it at the ground's own
     top edge means the solid part covers its lower half and only the top
     shows. */
  behind: (ctx) => ({
    behind: true,
    figures: figureRow(ctx, {
      baseY: ctx.gy + (ctx.ground.surfaceY ?? 0) + ctx.fh * BEHIND_SINK,
      fit: BEHIND_SCALE,
      centre: ctx.gx + ctx.gw / 2,
      maxWidth: ctx.gw,
    }),
  }),

  'in front of': (ctx) => ({
    frontShadow: true,
    figures: figureRow(ctx, {
      baseY: FLOOR + FRONT_DROP,
      fit: FRONT_SCALE,
      centre: ctx.gx + ctx.gw / 2,
    }),
  }),

  between,

  /* Beside, further away, with the distance drawn. Two ticks and a rule
     rather than a word, so it needs no language. */
  near: (ctx) => {
    const pair = pairedRow(ctx, ctx.gw, NEAR_GAP);

    return {
      ground: { x: pair.groundX, y: ctx.gy, scale: 1 },
      figures: figureRow(ctx, {
        baseY: FLOOR,
        left: pair.rowLeft,
        fit: pair.fit,
        maxWidth: pair.width,
      }),
      marks: spanMark(
        round(pair.groundX + ctx.gw + SPAN_INSET),
        round(pair.rowLeft - SPAN_INSET),
        FLOOR - SPAN_LIFT,
      ),
    };
  },

  /* Touching, on one baseline: no gap to measure, which is what tells it from
     near. */
  beside: (ctx) => {
    const pair = pairedRow(ctx, ctx.gw, BESIDE_GAP);

    return {
      ground: { x: pair.groundX, y: ctx.gy, scale: 1 },
      figures: figureRow(ctx, {
        baseY: FLOOR,
        left: pair.rowLeft,
        fit: pair.fit,
        maxWidth: pair.width,
      }),
    };
  },
};

/**
 * Two grounds with the figure in the space they leave.
 *
 * One scale for both, not one each: sized independently a 150-wide chair
 * filled its half at full size while a 300-wide table shrank, and a chair
 * taller than a table is a different picture.
 */
function between(ctx: GroundCtx): Layout {
  const other = ctx.ground2;
  if (other === null) return { figures: [] };

  const needed = rowWidth(ctx, 1) + BETWEEN_CLEARANCE;
  const side = Math.min(BETWEEN_MAX_SIDE, (STAGE.width - needed - BETWEEN_MARGIN) / 2);
  const fit = Math.max(0, Math.min(1, side / Math.max(ctx.gw, other.box.w)));
  const rightX = STAGE.width - BETWEEN_EDGE - other.box.w * fit;
  const gapLeft = BETWEEN_EDGE + ctx.gw * fit;

  return {
    ground: { x: BETWEEN_EDGE, y: round(FLOOR - ctx.gh * fit), scale: fit },
    ground2: { x: round(rightX), y: round(FLOOR - other.box.h * fit), scale: fit },
    /* In the middle of the space the grounds leave, not in the middle of the
       stage: two grounds of different widths do not leave a gap centred on
       the stage, and a figure off to one side of it is not between them. */
    figures: figureRow(ctx, {
      baseY: FLOOR,
      centre: round((gapLeft + rightX) / 2),
      maxWidth: Math.max(0, rightX - gapLeft - SPAN_INSET * 2),
    }),
  };
}

const FREE: Readonly<Record<FreeRelation, (ctx: Ctx) => Layout>> = {
  /* At the speaker's own spot: standing in it, and larger for being near. */
  here: (ctx) => {
    const figures = figureRow(ctx, { baseY: FLOOR, fit: HERE_SCALE });
    const width = rowWidth(ctx, fitFor(ctx, HERE_SCALE, STAGE_ROOM));

    return {
      figures,
      marks: spotMark(STAGE.width / 2, round(Math.max(SPOT_MIN_RX, width / 2 + SPOT_PAD))),
    };
  },

  /* Away from it: the same spot, a measured distance, and smaller for being
     further off. The arrow is what makes it deictic rather than just two
     things on a floor. */
  there: (ctx) => {
    const spotWidth = SPOT_MIN_RX * 2;
    const pair = pairedRow(ctx, spotWidth, THERE_GAP, THERE_SCALE);
    const figures = figureRow(ctx, {
      baseY: FLOOR,
      left: pair.rowLeft,
      fit: pair.fit,
      maxWidth: pair.width,
    });

    return {
      figures,
      marks: [
        ...spotMark(round(pair.groundX + SPOT_MIN_RX), SPOT_MIN_RX),
        arrow('mark-there', {
          from: [round(pair.groundX + spotWidth + SPAN_INSET), FLOOR - THERE_ARROW_LIFT],
          to: [round(pair.rowLeft - SPAN_INSET), FLOOR - THERE_ARROW_LIFT],
          dash: RING_DASH,
        }),
      ],
    };
  },
};

function layoutFor(spec: PlaceSpec, ctx: Ctx, ground: Prop | null): Layout | null {
  if (isFree(spec.relation)) return FREE[spec.relation](ctx);
  if (ground === null) return null;

  const grounded: GroundCtx = {
    ...ctx,
    ground,
    ground2: propFor(spec.ground2) ?? null,
    gx: round((STAGE.width - ground.box.w) / 2),
    gy: round(FLOOR - ground.box.h),
    gw: ground.box.w,
    gh: ground.box.h,
  };

  return GROUNDED[spec.relation](grounded);
}

/* ---- drawing ----------------------------------------------- */

/** The ring that says which one. Solid for the definite, dashed for the
 *  indefinite, and a word beside it — a difference in line style alone is not
 *  something every learner can see, and neither is one in colour. */
const determinerRing = (figure: Prop, indefinite: boolean): SceneNode =>
  rect('determiner', {
    x: -RING_PAD,
    y: -RING_PAD,
    w: figure.box.w + RING_PAD * 2,
    h: figure.box.h + RING_PAD * 2,
    r: RING_RADIUS,
    stroke: 'var(--accent)',
    strokeWidth: RING_WIDTH,
    dash: indefinite ? RING_DASH : '',
  });

function figureNodes(spec: PlaceSpec, ctx: Ctx, spots: readonly Spot[]): readonly SceneNode[] {
  const effect = adjectiveFor(spec.adjective);
  const fill = effect?.fill ?? undefined;
  /* The ring marks the determiner, and the determiner is only spoken when
     there is one figure: two balls are "two balls", not "a two balls". */
  const ringed = spec.count === 1;

  return spots.map((spot, index) =>
    group(
      `figure-${index}`,
      [
        ...ctx.figure.draw(fill),
        ...(ringed ? [determinerRing(ctx.figure, spec.determiner === 'a')] : []),
      ],
      { x: spot.x, y: spot.y, scale: spot.scale, role: `figure-${index}` },
    ),
  );
}

const groundNode = (id: string, prop: Prop, at: Placed): SceneNode =>
  group(id, prop.draw(), { x: at.x, y: at.y, scale: at.scale, role: 'ground' });

/** The shadow a figure standing in front of the ground casts at its own feet,
 *  which is what stops "in front of" reading as a sticker on the ground. */
const frontShadow = (index: number, figure: Prop, spot: Spot): SceneNode =>
  ellipse(`shadow-figure-${index}`, {
    cx: round(spot.x + (figure.box.w * spot.scale) / 2),
    cy: round(spot.y + figure.box.h * spot.scale + 3),
    rx: round((figure.box.w * spot.scale) / 2),
    ry: 7,
    fill: 'var(--shadow-ink)',
  });

/**
 * A place scene, as a node tree.
 *
 * Returns nothing at all for a spec `placeProblem` refuses. A blank stage is
 * visibly wrong and the caller can say why; a picture that contradicts its own
 * sentence is neither.
 */
export function renderPlace(spec: PlaceSpec): readonly SceneNode[] {
  const figure = propFor(spec.figure);
  if (!figure || placeProblem(spec) !== null) return [];

  const scale = adjectiveFor(spec.adjective)?.scale ?? 1;
  const ctx: Ctx = {
    figure,
    count: spec.count,
    scale,
    fw: figure.box.w * scale,
    fh: figure.box.h * scale,
  };

  const ground = propFor(spec.ground) ?? null;
  const layout = layoutFor(spec, ctx, ground);
  if (layout === null) return [];

  const other = propFor(spec.ground2) ?? null;
  const figures = figureNodes(spec, ctx, layout.figures);
  const grounds = groundNodes(ground, other, layout);
  const shadows = layout.frontShadow
    ? layout.figures.map((spot, index) => frontShadow(index, figure, spot))
    : [];

  return [
    floorLine(),
    ...groundShadows(ground, other, layout),
    ...(layout.marks ?? []),
    ...(layout.behind === true ? [...figures, ...grounds] : [...grounds, ...shadows, ...figures]),
  ];
}

/** Where a ground stands when the relation has not moved it: centred, on the
 *  floor, at its own size. */
const restingPlace = (prop: Prop): Placed => ({
  x: round((STAGE.width - prop.box.w) / 2),
  y: round(FLOOR - prop.box.h),
  scale: 1,
});

function groundNodes(ground: Prop | null, other: Prop | null, layout: Layout): readonly SceneNode[] {
  if (ground === null) return [];

  const nodes = [groundNode('ground', ground, layout.ground ?? restingPlace(ground))];

  /* "between" has two of them, and the second is as much the ground as the
     first — same role, so lighting the word lights both. */
  if (other && layout.ground2) nodes.push(groundNode('ground-2', other, layout.ground2));
  return nodes;
}

function groundShadows(ground: Prop | null, other: Prop | null, layout: Layout): readonly SceneNode[] {
  if (ground === null) return [];

  const at = layout.ground ?? restingPlace(ground);
  const nodes = [shadow('shadow-ground', at.x, ground.box.w, at.scale)];

  if (other && layout.ground2) {
    nodes.push(shadow('shadow-ground-2', layout.ground2.x, other.box.w, layout.ground2.scale));
  }
  return nodes;
}
