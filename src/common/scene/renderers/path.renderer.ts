import { FLOOR, STAGE, centreX, round } from 'common/scene/layout';
import { arrow, floorLine, group, line, path, rect, shadow } from 'common/scene/primitives';
import { box as boxProp, propFor, shop as shopProp } from 'common/scene/props/index';
import type {
  ArrowShape,
  LandmarkKind,
  PathRelation,
  PathSpec,
  Prop,
  SceneNode,
} from 'common/scene/types';

/* ============================================================
   path.renderer.ts — mover + landmark + arrow.

   A direction preposition is an arrow, and three things about
   that arrow carry the meaning: where it starts, where it ends,
   and whether it ever touches the landmark. Eight prepositions,
   one drawing, three variables — not eight bespoke pictures.

   Ported from `ui-prototypes/pages/scenes-catalogue.html`, where
   all eight were drawn and looked at.
   ============================================================ */

/* ---- the numbers ------------------------------------------- */

/** Movers are drawn at wildly different sizes — a car is 260 wide, a cat 110.
 *  On a stage that has to leave room for an arrow they are all brought within
 *  one envelope, never enlarged. */
const MOVER_MAX_W = 210;
const MOVER_MAX_H = 170;
const MOVER_X = 56;

/** The arrow runs at about the height of whatever is moving, not along the
 *  floor: an arrow on the floor line reads as part of the room. */
const ARROW_Y = FLOOR - 44;
const ARROW_CLEAR = 30;
const ARROW_TOUCH = 8;

/** `towards` stops here, and the share of the run it draws solid before the
 *  dashes take over. The dashes are the meaning: the journey, not the
 *  arrival. */
const TOWARDS_SHORT = 74;
const TOWARDS_SOLID = 0.52;

/** A landmark not arrived at is faded; a mover that has gone by is a ghost. */
const FADED = 0.42;
const GHOSTED = 0.24;

const LANDMARK_X = 424;

/** `into` lifts its arrow over the container's top edge before it comes down
 *  inside. An arrow that ends on the edge is ambiguous between `to` and
 *  `into`, so it finishes at the middle of the inside rectangle. */
const INTO_LIFT = 44;

/** The road: a band across the stage, with its own centre line. Wide enough
 *  to be crossed and high enough to leave the mover somewhere to stand. */
const ROAD_TOP = 186;
const ROAD_HEIGHT = 112;
const ROAD_MARK_DASH = '40 30';

/** The river: a bowed band low on the stage, with the bank above it. */
const RIVER_Y = 320;
const RIVER_WIDTH = 46;
const RIVER_CURVE = 0.03;
const RIVER_INSET = 20;
const ALONG_LIFT = 78;
const ALONG_INSET = 130;

/** The city: a skyline the arc passes over. */
const CITY_BLOCK_W = 52;
const CITY_GAP = 8;
const CITY_HEIGHTS: readonly number[] = [90, 140, 110, 170, 120, 150];
const CITY_WINDOW = 16;

/** `over` never touches: the arc clears the tallest roof, and the mover rides
 *  its apex. */
const OVER_END_Y = 260;
const OVER_APEX_Y = 96;
const OVER_INSET = 40;

/** `across` cuts the band at right angles — `along` would run down it. */
const ACROSS_X = 438;
const ACROSS_OVERSHOOT = 38;

/** `past` needs the landmark in the middle, or "kept going" has nowhere to
 *  go, and a mark saying it did not stop there. */
const PAST_INSET = 34;
const PAST_ARROW_Y = FLOOR + 26;
/** The mover shown again beyond the landmark keeps clear of the arrowhead: a
 *  ghost sticking out past the end of the journey is going somewhere the arrow
 *  is not. */
const PAST_GHOST_CLEAR = 16;
const STOP_MARK_H = 22;

/* ---- what each preposition is ------------------------------
   `arrives` is one thing, asked precisely: does the arrow touch
   the landmark? `to` and `into` and `across` and `from` do;
   `towards`, `along`, `over` and `past` do not. That single bit
   is the whole difference between "he went to the station" and
   "he walked towards the station", which is why `PathSpec`
   carries it rather than leaving it to be inferred from a
   drawing.
   ------------------------------------------------------------ */

export type PathArrow = { readonly arrow: ArrowShape; readonly arrives: boolean };

export const PATH_ARROWS: Readonly<Record<PathRelation, PathArrow>> = Object.freeze({
  to: { arrow: 'straight', arrives: true },
  into: { arrow: 'curve-into', arrives: true },
  towards: { arrow: 'solid-then-dashed', arrives: false },
  along: { arrow: 'arc', arrives: false },
  across: { arrow: 'straight', arrives: true },
  over: { arrow: 'arc', arrives: false },
  past: { arrow: 'straight', arrives: false },
  from: { arrow: 'straight', arrives: true },
});

/** Which landmarks each preposition can be drawn against. `into` needs
 *  something with an inside; `across` and `along` need a band, which is the
 *  only landmark that has a line to cut or to follow. */
const BANDS: ReadonlySet<LandmarkKind> = new Set<LandmarkKind>(['road', 'river']);

export function pathAllows(relation: PathRelation, landmark: LandmarkKind): boolean {
  if (relation === 'into') return landmark === 'container';
  if (relation === 'across' || relation === 'along') return BANDS.has(landmark);
  return !BANDS.has(landmark);
}

/**
 * Why this scene cannot be drawn, or null when it can.
 *
 * The arrow shape and the arrival flag are checked rather than obeyed. A spec
 * saying `to` with `arrives: false` describes no preposition: the picture
 * would show a journey that stops short while the sentence said it got there.
 */
export function pathProblem(spec: PathSpec): string | null {
  if (!propFor(spec.mover)) return `no prop is drawn for the mover "${spec.mover}"`;
  if (!pathAllows(spec.relation, spec.landmark)) {
    return `"${spec.relation}" cannot be drawn against a ${spec.landmark}`;
  }

  const wanted = PATH_ARROWS[spec.relation];
  if (spec.arrow !== wanted.arrow) {
    return `"${spec.relation}" is a ${wanted.arrow} arrow, not a ${spec.arrow} one`;
  }
  if (spec.arrives !== wanted.arrives) {
    return wanted.arrives
      ? `"${spec.relation}" reaches the ${spec.landmark}`
      : `"${spec.relation}" does not reach the ${spec.landmark}`;
  }
  return null;
}

/* ---- landmarks ---------------------------------------------
   Five kinds, and they are not props: a road is not a thing you
   can put on a table. Two of them are props all the same —
   a building is the shop and a container is the box — because a
   learner who has seen the box in "the ball is in the box"
   should meet the same box in "the dog ran into the box".
   ------------------------------------------------------------ */

type Box = { readonly x: number; readonly y: number; readonly w: number; readonly h: number };

type Landmark = {
  readonly node: SceneNode;
  readonly box: Box;
  /** Where `into` finishes. Null for everything that has no inside. */
  readonly inside: Box | null;
  /** A road and a river are the ground; drawing a floor line under them puts a
   *  second horizon in the picture. */
  readonly ownGround: boolean;
};

const BUILDING_SCALE = 0.62;

function standing(prop: Prop, x: number, scale: number, opacity: number): SceneNode {
  return group('landmark', prop.draw(), {
    x: round(x),
    y: round(FLOOR - prop.box.h * scale),
    scale,
    opacity,
    role: 'landmark',
  });
}

function building(x: number, opacity: number): Landmark {
  const w = shopProp.box.w * BUILDING_SCALE;
  const h = shopProp.box.h * BUILDING_SCALE;

  return {
    node: standing(shopProp, x, BUILDING_SCALE, opacity),
    box: { x: round(x), y: round(FLOOR - h), w: round(w), h: round(h) },
    inside: null,
    ownGround: false,
  };
}

function container(x: number, opacity: number): Landmark {
  const y = FLOOR - boxProp.box.h;
  const [ix, iy, iw, ih] = boxProp.inside ?? [0, 0, 0, 0];

  return {
    node: standing(boxProp, x, 1, opacity),
    box: { x: round(x), y: round(y), w: boxProp.box.w, h: boxProp.box.h },
    inside: { x: round(x + ix), y: round(y + iy), w: iw, h: ih },
    ownGround: false,
  };
}

function city(opacity: number): Landmark {
  const width = CITY_HEIGHTS.length * CITY_BLOCK_W + (CITY_HEIGHTS.length - 1) * CITY_GAP;
  const left = centreX(width);
  const nodes = CITY_HEIGHTS.flatMap((height, index) => {
    const x = left + index * (CITY_BLOCK_W + CITY_GAP);
    const top = FLOOR - height;
    const rows = Math.floor((height - CITY_WINDOW) / (CITY_WINDOW * 2));

    return [
      rect(`block-${index}`, {
        x,
        y: top,
        w: CITY_BLOCK_W,
        h: height,
        r: 3,
        fill: index % 2 === 0 ? 'var(--prop-metal)' : 'var(--prop-grey)',
      }),
      ...Array.from({ length: Math.max(0, rows) }, (_, row) =>
        rect(`block-${index}-window-${row}`, {
          x: x + 10,
          y: top + CITY_WINDOW + row * CITY_WINDOW * 2,
          w: CITY_BLOCK_W - 20,
          h: CITY_WINDOW,
          r: 2,
          fill: 'var(--prop-glass)',
        }),
      ),
    ];
  });

  return {
    node: group('landmark', nodes, { opacity, role: 'landmark' }),
    box: { x: left, y: round(FLOOR - Math.max(...CITY_HEIGHTS)), w: round(width), h: 0 },
    inside: null,
    ownGround: false,
  };
}

function road(opacity: number): Landmark {
  const bottom = ROAD_TOP + ROAD_HEIGHT;
  const nodes = [
    rect('surface', { x: 0, y: ROAD_TOP, w: STAGE.width, h: ROAD_HEIGHT, fill: 'var(--prop-grey)' }),
    line('kerb-far', {
      x1: 0,
      y1: ROAD_TOP,
      x2: STAGE.width,
      y2: ROAD_TOP,
      stroke: 'var(--line-strong)',
      strokeWidth: 3,
    }),
    line('kerb-near', {
      x1: 0,
      y1: bottom,
      x2: STAGE.width,
      y2: bottom,
      stroke: 'var(--line-strong)',
      strokeWidth: 3,
    }),
    line('centre', {
      x1: RIVER_INSET,
      y1: round(ROAD_TOP + ROAD_HEIGHT / 2),
      x2: STAGE.width - RIVER_INSET,
      y2: round(ROAD_TOP + ROAD_HEIGHT / 2),
      stroke: 'var(--prop-paper)',
      strokeWidth: 6,
      dash: ROAD_MARK_DASH,
    }),
  ];

  return {
    node: group('landmark', nodes, { opacity, role: 'landmark' }),
    box: { x: 0, y: ROAD_TOP, w: STAGE.width, h: ROAD_HEIGHT },
    inside: null,
    ownGround: true,
  };
}

/**
 * The quadratic `arrow` draws, as a `d` string.
 *
 * The river is drawn with the same control point the arrow along it is given,
 * which is what makes "parallel" a fact about the geometry rather than
 * something that looks about right.
 */
function bowPath(from: readonly [number, number], to: readonly [number, number], curve: number): string {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const dx = x2 - x1;
  const dy = y2 - y1;

  return `M${round(x1)},${round(y1)} Q${round((x1 + x2) / 2 - dy * curve)},${round(
    (y1 + y2) / 2 + dx * curve,
  )} ${round(x2)},${round(y2)}`;
}

/** The curve that puts the control point at a chosen height — which is how an
 *  arc is made to clear a roof or a container's edge rather than to bow by a
 *  number somebody liked. */
const curveThrough = (
  from: readonly [number, number],
  to: readonly [number, number],
  controlY: number,
): number => (controlY - (from[1] + to[1]) / 2) / (to[0] - from[0]);

const RIVER_FROM: readonly [number, number] = [RIVER_INSET, RIVER_Y];
const RIVER_TO: readonly [number, number] = [STAGE.width - RIVER_INSET, RIVER_Y];

function river(opacity: number): Landmark {
  const d = bowPath(RIVER_FROM, RIVER_TO, RIVER_CURVE);
  const bank = round(RIVER_Y - RIVER_WIDTH / 2);
  const nodes = [
    /* The bank the mover walks on. Without it there is water and nothing else,
       and a man beside a river with no ground under him is a man in the air. */
    line('bank', {
      x1: 0,
      y1: bank,
      x2: STAGE.width,
      y2: bank,
      stroke: 'var(--line)',
      strokeWidth: 3,
    }),
    path('water', { d, stroke: 'var(--prop-glass)', strokeWidth: RIVER_WIDTH, cap: 'round' }),
    /* Broken, not one long stroke: a continuous line down the middle of the
       river is a second arrow running parallel to the real one. */
    path('current', {
      d,
      stroke: 'var(--prop-metal)',
      strokeWidth: 6,
      dash: '26 34',
      opacity: 0.5,
    }),
  ];

  return {
    node: group('landmark', nodes, { opacity, role: 'landmark' }),
    box: {
      x: RIVER_INSET,
      y: bank,
      w: round(STAGE.width - RIVER_INSET * 2),
      h: RIVER_WIDTH,
    },
    inside: null,
    ownGround: true,
  };
}

function landmarkFor(kind: LandmarkKind, x: number, opacity: number): Landmark {
  switch (kind) {
    case 'building':
      return building(x, opacity);
    case 'container':
      return container(x, opacity);
    case 'city':
      return city(opacity);
    case 'road':
      return road(opacity);
    case 'river':
      return river(opacity);
  }
}

/* ---- the mover --------------------------------------------- */

type Placed = { readonly x: number; readonly y: number; readonly scale: number };

const moverScale = (mover: Prop): number =>
  Math.floor(Math.min(1, MOVER_MAX_W / mover.box.w, MOVER_MAX_H / mover.box.h) * 1000) / 1000;

/** Standing on a given baseline, at a given left edge. */
const stand = (mover: Prop, x: number, baseY: number): Placed => ({
  x: round(x),
  y: round(baseY - mover.box.h * moverScale(mover)),
  scale: moverScale(mover),
});

const widthOf = (mover: Prop): number => mover.box.w * moverScale(mover);

/* ---- one rule per preposition ------------------------------ */

type Scene = {
  readonly mover: Placed;
  readonly ghost?: Placed;
  readonly arrow: readonly SceneNode[];
  readonly marks?: readonly SceneNode[];
  /** `towards` fades what was not reached. */
  readonly landmarkOpacity?: number;
  readonly landmarkX?: number;
};

/** The run a floor-level arrow has: clear of the mover, up to the landmark. */
const runFrom = (mover: Prop, x: number): number => round(x + widthOf(mover) + ARROW_CLEAR);

const journey = (mover: Prop): Placed => stand(mover, MOVER_X, FLOOR);

function to(mover: Prop, landmark: Landmark): Scene {
  const from: readonly [number, number] = [runFrom(mover, MOVER_X), ARROW_Y];

  return {
    mover: journey(mover),
    arrow: [arrow('arrow', { from, to: [landmark.box.x - ARROW_TOUCH, ARROW_Y] })],
  };
}

function towards(mover: Prop, landmark: Landmark): Scene {
  const start = runFrom(mover, MOVER_X);
  const end = landmark.box.x - TOWARDS_SHORT;
  const handover = round(start + (end - start) * TOWARDS_SOLID);

  return {
    mover: journey(mover),
    landmarkOpacity: FADED,
    /* A solid stretch that has happened, then dashes that have not. The head
       is on the dashed half: that is the end nobody reached. */
    arrow: [
      path('arrow-tail', {
        d: `M${start},${ARROW_Y} L${handover},${ARROW_Y}`,
        stroke: 'var(--r-rel)',
        strokeWidth: 4,
      }),
      arrow('arrow', { from: [handover, ARROW_Y], to: [end, ARROW_Y], dash: '11 9' }),
    ],
  };
}

function into(mover: Prop, landmark: Landmark): Scene {
  const inside = landmark.inside;
  if (inside === null) return { mover: journey(mover), arrow: [] };

  const from: readonly [number, number] = [runFrom(mover, MOVER_X), ARROW_Y];
  const target: readonly [number, number] = [
    round(inside.x + inside.w / 2),
    round(inside.y + inside.h / 2),
  ];

  return {
    mover: journey(mover),
    arrow: [
      arrow('arrow', { from, to: target, curve: curveThrough(from, target, landmark.box.y - INTO_LIFT) }),
    ],
    /* The inside is drawn, or "finishes inside" is a claim about a rectangle
       nobody can see. */
    marks: [
      rect('mark-inside', {
        ...inside,
        r: 6,
        stroke: 'var(--accent)',
        strokeWidth: 2.5,
        dash: '8 7',
      }),
    ],
  };
}

function from(mover: Prop, landmark: Landmark): Scene {
  const right = landmark.box.x - ARROW_TOUCH;
  const moverX = MOVER_X + ARROW_CLEAR * 2;

  /* The same road as `to`, the arrow reversed: this is where it began. */
  return {
    mover: stand(mover, moverX, FLOOR),
    arrow: [
      arrow('arrow', { from: [right, ARROW_Y], to: [runFrom(mover, moverX), ARROW_Y] }),
    ],
  };
}

function across(mover: Prop, landmark: Landmark): Scene {
  const bottom = landmark.box.y + landmark.box.h;

  return {
    mover: stand(mover, MOVER_X + ARROW_CLEAR * 2, FLOOR),
    arrow: [
      arrow('arrow', {
        from: [ACROSS_X, FLOOR - ARROW_TOUCH],
        to: [ACROSS_X, landmark.box.y - ACROSS_OVERSHOOT],
      }),
    ],
    marks: [
      line('mark-far-side', {
        x1: ACROSS_X - STOP_MARK_H,
        y1: landmark.box.y,
        x2: ACROSS_X + STOP_MARK_H,
        y2: landmark.box.y,
        stroke: 'var(--accent)',
        strokeWidth: 3,
      }),
      line('mark-near-side', {
        x1: ACROSS_X - STOP_MARK_H,
        y1: bottom,
        x2: ACROSS_X + STOP_MARK_H,
        y2: bottom,
        stroke: 'var(--accent)',
        strokeWidth: 3,
      }),
    ],
  };
}

function along(mover: Prop, landmark: Landmark): Scene {
  const y = RIVER_Y - ALONG_LIFT;
  const start = runFrom(mover, MOVER_X);
  const end = STAGE.width - ALONG_INSET;
  /* `curve` is a fraction of the arrow's own length, so a shorter arrow given
     the river's number bows less than the river does. Scaling it by the two
     lengths makes the sag the same number of pixels, which is what "follows
     the line of it" means. */
  const bow = RIVER_CURVE * ((RIVER_TO[0] - RIVER_FROM[0]) / (end - start));

  return {
    mover: stand(mover, MOVER_X, landmark.box.y),
    arrow: [arrow('arrow', { from: [start, y], to: [end, y], curve: bow })],
  };
}

function over(mover: Prop): Scene {
  const start: readonly [number, number] = [OVER_INSET, OVER_END_Y];
  const end: readonly [number, number] = [STAGE.width - OVER_INSET, OVER_END_Y];
  const control = OVER_APEX_Y * 4 - start[1] - end[1];
  const apexY = round((start[1] + control + control + end[1]) / 4);
  const scale = moverScale(mover);

  /* Above it and moving across, never touching. The mover rides the top of its
     own arc rather than being parked somewhere near it. */
  return {
    mover: {
      x: round(STAGE.width / 2 - (mover.box.w * scale) / 2),
      y: round(apexY - (mover.box.h * scale) / 2),
      scale,
    },
    arrow: [
      arrow('arrow', { from: start, to: end, curve: curveThrough(start, end, control), dash: '12 10' }),
    ],
  };
}

function past(mover: Prop, landmark: Landmark): Scene {
  /* The stage centre, because that is where this scene puts the landmark.
     Measuring it where the landmark was found rather than where it is sent
     put the mark 150px to the right of the building it belongs to. */
  const stopX = STAGE.width / 2;

  /* Went by it and kept going: one arrow the whole width of the stage, the
     landmark only something on the way, and the mover shown again beyond it.
     The arrow runs in front of everything rather than at travelling height —
     at that height it goes straight through the car and the building it is
     meant to be going past. */
  return {
    mover: journey(mover),
    ghost: stand(mover, STAGE.width - PAST_INSET - PAST_GHOST_CLEAR - widthOf(mover), FLOOR),
    landmarkX: centreX(landmark.box.w),
    arrow: [
      arrow('arrow', {
        from: [PAST_INSET, PAST_ARROW_Y],
        to: [STAGE.width - PAST_INSET, PAST_ARROW_Y],
      }),
    ],
    marks: [
      line('mark-stop', {
        x1: stopX,
        y1: FLOOR - STOP_MARK_H,
        x2: stopX,
        y2: PAST_ARROW_Y,
        stroke: 'var(--warn)',
        strokeWidth: 3,
        dash: '6 6',
      }),
    ],
  };
}

const SCENES: Readonly<Record<PathRelation, (mover: Prop, landmark: Landmark) => Scene>> = {
  to,
  into,
  towards,
  along,
  across,
  over: (mover) => over(mover),
  past,
  from,
};

/* ---- drawing ----------------------------------------------- */

/**
 * A path scene, as a node tree.
 *
 * Returns nothing at all for a spec `pathProblem` refuses, the same as the
 * place renderer: a blank stage is visibly wrong, and a picture that
 * contradicts its own sentence is not.
 */
export function renderPath(spec: PathSpec): readonly SceneNode[] {
  const mover = propFor(spec.mover);
  if (!mover || pathProblem(spec) !== null) return [];

  /* The landmark is built twice: once to find out how wide it is, once where
     the preposition wants it. Only `past` moves it, and only `past` knows how
     far its own middle is from the stage's. */
  const measured = landmarkFor(spec.landmark, LANDMARK_X, 1);
  const scene = SCENES[spec.relation](mover, measured);
  const landmark = landmarkFor(
    spec.landmark,
    scene.landmarkX ?? LANDMARK_X,
    scene.landmarkOpacity ?? 1,
  );

  return [
    ...(landmark.ownGround ? [] : [floorLine()]),
    landmark.node,
    ...(scene.marks ?? []),
    ...groundShadow(mover, scene),
    ...moverNodes(mover, scene),
    ...scene.arrow,
  ];
}

function moverNodes(mover: Prop, scene: Scene): readonly SceneNode[] {
  const nodes = [
    group('mover', mover.draw(), {
      x: scene.mover.x,
      y: scene.mover.y,
      scale: scene.mover.scale,
      role: 'mover',
    }),
  ];

  if (scene.ghost) {
    nodes.push(
      group('mover-ghost', mover.draw(), {
        x: scene.ghost.x,
        y: scene.ghost.y,
        scale: scene.ghost.scale,
        opacity: GHOSTED,
        role: 'mover',
      }),
    );
  }
  return nodes;
}

/** Only for a mover on the floor. A shadow under something flying over a city
 *  is a shadow on nothing. */
function groundShadow(mover: Prop, scene: Scene): readonly SceneNode[] {
  const bottom = scene.mover.y + mover.box.h * scene.mover.scale;
  if (Math.abs(bottom - FLOOR) > 1) return [];

  return [shadow('shadow-mover', scene.mover.x, mover.box.w, scene.mover.scale)];
}
