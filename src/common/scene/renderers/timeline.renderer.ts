import { STAGE, round } from 'common/scene/layout';
import { circle, ellipse, line, rect, text } from 'common/scene/primitives';
import type {
  Bilingual,
  SceneNode,
  TenseId,
  TimeMarkKind,
  TimeRelation,
  TimelineMark,
  TimelineSpec,
} from 'common/scene/types';

/* ============================================================
   timeline.renderer.ts — time as a line.

   Twelve tenses and nine prepositions of time out of one axis
   and four marks, because they are the same three pictures a
   place scene draws: a point, a stretch, and an edge.

       at = a moment on the line       · a dot on the floor
       on = a day the event sits on    · a book on a table
       in = a stretch you are inside   · a ball in a box

   The claim in architecture.md §4.1 is that `in`, `on` and `at`
   mean the same three things in place and in time. It only holds
   if the pictures really are the same, so the vocabulary is
   written out here rather than left to eight bespoke drawings.
   ============================================================ */

/* ---- the axis ---------------------------------------------- */

/** `now` never moves. Everything else is positioned relative to it, so the
 *  axis is fixed once and every mark is a fraction of it. */
const AXIS_Y = 230;
const AXIS_X0 = 60;
const AXIS_X1 = 660;
const AXIS_SPAN = AXIS_X1 - AXIS_X0;

/** The fraction that is `now`: 0 is the far past, 1 the far future. */
export const NOW = 0.5;

export const xAt = (fraction: number): number => round(AXIS_X0 + fraction * AXIS_SPAN);

const NOW_TICK = 15;
const END_LABEL_DROP = 42;
const NOW_LABEL_DROP = 30;

/* ---- the event, above ---------------------------------------
   The tense is what happened, so it is drawn on the axis itself:
   simple is a point, continuous is a stretch, perfect adds the
   edge it was finished by, perfect continuous is both.
   ------------------------------------------------------------ */

const TENSE_AT: Readonly<Record<string, number>> = { past: 0.26, present: NOW, future: 0.74 };
const TENSE_BAND_HALF = 88;
const TENSE_BAND_H = 48;
const TENSE_POINT_R = 12;
const PERFECT_GAP = 98;
const PERFECT_FLAG_H = 62;

/* ---- the time, below ----------------------------------------
   What the marks name — a year, a day, an hour, a stretch — is
   the *place* the event is in, so it is drawn in the ground
   colour and lives in its own lane. Nothing below the axis can
   collide with anything above it, which is what keeps a long
   band label off the marks.
   ------------------------------------------------------------ */

const LANE_Y = 330;
const LANE_BAND_H = 34;
const LANE_CONTAINER_H = 54;
const LANE_POINT_R = 11;
const LANE_SLAB_H = 18;
const LANE_MIN_W = 30;
const LABEL_GAP = 24;
const LABEL_LINE = 17;
const LABEL_SIZE = 13;
const LABEL_MARGIN = 46;

/** A boundary crosses both lanes: it is an edge in time, not a thing that
 *  happened at one. A hard stop — a deadline — is capped and coloured for it. */
const BOUNDARY_TOP = AXIS_Y - 46;
const BOUNDARY_CAP = 9;

/* ---- what each preposition is ------------------------------ */

export type TimeShape = {
  /** The marks the picture is made of. A preposition drawn out of anything
   *  else is not that preposition. */
  readonly marks: readonly TimeMarkKind[];
  /** `since` runs to `now` by definition, so the renderer computes its end
   *  rather than trusting a fraction somebody typed. */
  readonly toNow: boolean;
  /** A deadline rather than an edge: `by 6 PM` and `until I come` stop. */
  readonly stop: boolean;
  /** `on` is the one point that rests on the axis instead of sitting in it —
   *  a day the event is put on, the way a book is put on a table. */
  readonly resting: boolean;
};

const shape = (
  marks: readonly TimeMarkKind[],
  extra: Partial<Omit<TimeShape, 'marks'>> = {},
): TimeShape => ({
  marks,
  toNow: extra.toNow ?? false,
  stop: extra.stop ?? false,
  resting: extra.resting ?? false,
});

export const TIME_RELATIONS: Readonly<Record<TimeRelation, TimeShape>> = Object.freeze({
  at: shape(['point']),
  on: shape(['point'], { resting: true }),
  in: shape(['container']),
  before: shape(['band', 'boundary']),
  after: shape(['band', 'boundary']),
  by: shape(['band', 'boundary'], { stop: true }),
  since: shape(['band', 'boundary'], { toNow: true }),
  during: shape(['band', 'point']),
  until: shape(['band', 'boundary'], { stop: true }),
});

/* ---- what can be drawn ------------------------------------- */

const STRETCHES: ReadonlySet<TimeMarkKind> = new Set<TimeMarkKind>(['band', 'container']);

const inRange = (value: number): boolean => value >= 0 && value <= 1;

/**
 * Why this scene cannot be drawn, or null when it can.
 *
 * The same refusal the place and path renderers make: a picture that
 * contradicts its own sentence is worse than no picture.
 */
export function timelineProblem(spec: TimelineSpec): string | null {
  const seen = new Set<string>();

  for (const mark of spec.marks) {
    if (seen.has(mark.id)) return `two marks are both called "${mark.id}"`;
    seen.add(mark.id);

    if (!inRange(mark.at)) return `mark "${mark.id}" sits at ${mark.at}, off the axis`;
    if (STRETCHES.has(mark.kind)) {
      if (mark.to === null) return `"${mark.id}" is a ${mark.kind} and has no end`;
      if (!inRange(mark.to)) return `mark "${mark.id}" ends at ${mark.to}, off the axis`;
      if (mark.to <= mark.at) return `"${mark.id}" ends before it starts`;
    }
  }

  if (spec.relation === null) return null;

  const wanted = TIME_RELATIONS[spec.relation].marks;
  const got = spec.marks.map((mark) => mark.kind);
  if (wanted.some((kind) => !got.includes(kind))) {
    return `"${spec.relation}" is drawn out of ${wanted.join(' + ')}, and this scene has ${
      got.join(' + ') || 'no marks'
    }`;
  }
  return null;
}

/* ---- the tense --------------------------------------------- */

type Tense = { readonly when: string; readonly aspect: string };

/** `past-perfect-continuous` is a time and an aspect joined by the first
 *  hyphen — the aspect keeps the rest, hyphens and all. */
function splitTense(tense: TenseId): Tense {
  const cut = tense.indexOf('-');
  return { when: tense.slice(0, cut), aspect: tense.slice(cut + 1) };
}

const eventFill = 'var(--r-figure)';

/**
 * The tense picture: where the event is, and how long it took.
 *
 * The reference time is the one the tense name gives — past, present or
 * future. Simple and continuous sit at it. The two perfects are the ones that
 * say *finished by* it, so their event is earlier and the boundary is at the
 * reference time itself. The prototype put that boundary after the event
 * instead, which drew present perfect as something finishing in the future.
 */
function tenseNodes(tense: TenseId): readonly SceneNode[] {
  const { when, aspect } = splitTense(tense);
  const reference = xAt(TENSE_AT[when] ?? NOW);
  const stretched = aspect === 'continuous' || aspect === 'perfect-continuous';
  const finished = aspect === 'perfect' || aspect === 'perfect-continuous';
  const x = finished && !stretched ? round(reference - PERFECT_GAP) : reference;
  const nodes: SceneNode[] = [];

  if (stretched) {
    /* A stretch that has finished ends at the boundary; one that has not is
       centred on the moment it is going on at. */
    const right = finished ? reference : round(reference + TENSE_BAND_HALF);
    const left = Math.max(AXIS_X0, round(right - TENSE_BAND_HALF * 2));

    nodes.push(
      rect('tense-band', {
        x: left,
        y: round(AXIS_Y - TENSE_BAND_H / 2),
        w: round(right - left),
        h: TENSE_BAND_H,
        r: 10,
        fill: 'var(--accent-soft)',
        stroke: eventFill,
        strokeWidth: 2.5,
      }),
    );
  }

  if (!stretched) {
    nodes.push(circle('tense-point', { cx: x, cy: AXIS_Y, r: TENSE_POINT_R, fill: eventFill }));
  }

  if (finished) {
    const flagX = reference;
    nodes.push(
      line('tense-flag', {
        x1: flagX,
        y1: round(AXIS_Y - PERFECT_FLAG_H),
        x2: flagX,
        y2: round(AXIS_Y + BOUNDARY_CAP * 2),
        stroke: 'var(--warn)',
        strokeWidth: 3.5,
      }),
      line('tense-flag-cap', {
        x1: round(flagX - BOUNDARY_CAP),
        y1: round(AXIS_Y - PERFECT_FLAG_H),
        x2: round(flagX + BOUNDARY_CAP),
        y2: round(AXIS_Y - PERFECT_FLAG_H),
        stroke: 'var(--warn)',
        strokeWidth: 3.5,
      }),
    );
  }
  return nodes;
}

/* ---- the marks --------------------------------------------- */

const timeFill = 'var(--r-ground)';

type Span = { readonly x0: number; readonly x1: number; readonly centre: number };

function spanOf(mark: TimelineMark, shapeOf: TimeShape | null): Span {
  /* `since` runs to now whatever the content says, so that moving `now` moves
     the end of it rather than leaving a stretch that stops in the past. */
  const end = shapeOf?.toNow === true ? NOW : (mark.to ?? mark.at);
  const x0 = xAt(Math.min(mark.at, end));
  const x1 = Math.max(xAt(Math.max(mark.at, end)), x0 + LANE_MIN_W);

  return { x0, x1, centre: round((x0 + x1) / 2) };
}

/**
 * The two dashed drops that project a stretch back onto the axis.
 *
 * A box in a lane of its own is a box; a box whose edges are marked on the
 * timeline is a stretch OF the timeline, and an event standing between those
 * two edges is visibly inside it. Without them the claim that `in` here means
 * what `in` means in a place scene is a claim about two unrelated drawings.
 */
const tieLines = (id: string, span: Span, top: number): readonly SceneNode[] =>
  [span.x0, span.x1].map((x, index) =>
    line(`${id}-tie-${index}`, {
      x1: x,
      y1: AXIS_Y,
      x2: x,
      y2: top,
      stroke: timeFill,
      strokeWidth: 2,
      dash: '4 6',
    }),
  );

function markBody(mark: TimelineMark, span: Span, shapeOf: TimeShape | null): readonly SceneNode[] {
  const id = `mark-${mark.id}`;

  switch (mark.kind) {
    case 'band':
      return [
        ...tieLines(id, span, round(LANE_Y - LANE_BAND_H / 2)),
        rect(id, {
          x: span.x0,
          y: round(LANE_Y - LANE_BAND_H / 2),
          w: round(span.x1 - span.x0),
          h: LANE_BAND_H,
          r: 9,
          fill: timeFill,
          opacity: 0.28,
          stroke: timeFill,
          strokeWidth: 2.5,
        }),
      ];

    /* A stretch you are inside, drawn as a box you are inside — the same
       picture the place renderer draws for "in the box". */
    case 'container':
      return [
        ...tieLines(id, span, round(LANE_Y - LANE_CONTAINER_H / 2)),
        rect(id, {
          x: span.x0,
          y: round(LANE_Y - LANE_CONTAINER_H / 2),
          w: round(span.x1 - span.x0),
          h: LANE_CONTAINER_H,
          r: 8,
          fill: 'none',
          stroke: timeFill,
          strokeWidth: 3,
          dash: '9 7',
        }),
      ];

    /* An edge in time belongs to the axis as much as to the lane, so it
       crosses both. */
    case 'boundary':
      return boundary(id, span.x0, shapeOf?.stop === true);

    case 'point':
      return shapeOf?.resting === true
        ? [
            rect(id, {
              x: round(span.centre - LANE_MIN_W),
              y: round(LANE_Y - LANE_SLAB_H),
              w: LANE_MIN_W * 2,
              h: LANE_SLAB_H,
              r: 4,
              fill: timeFill,
            }),
            line(`${id}-rest`, {
              x1: round(span.centre - LANE_MIN_W - 16),
              y1: LANE_Y,
              x2: round(span.centre + LANE_MIN_W + 16),
              y2: LANE_Y,
              stroke: timeFill,
              strokeWidth: 3,
            }),
          ]
        : [
            circle(id, { cx: span.centre, cy: LANE_Y, r: LANE_POINT_R, fill: timeFill }),
            line(`${id}-tie`, {
              x1: span.centre,
              y1: AXIS_Y,
              x2: span.centre,
              y2: round(LANE_Y - LANE_POINT_R),
              stroke: timeFill,
              strokeWidth: 2,
              dash: '4 6',
            }),
          ];
  }
}

function boundary(id: string, x: number, stop: boolean): readonly SceneNode[] {
  const stroke = stop ? 'var(--warn)' : 'var(--r-rel)';
  const foot = round(LANE_Y + LANE_CONTAINER_H / 2);

  return [
    line(id, {
      x1: x,
      y1: BOUNDARY_TOP,
      x2: x,
      y2: foot,
      stroke,
      strokeWidth: stop ? 4 : 3,
      dash: stop ? '' : '8 7',
    }),
    line(`${id}-cap`, {
      x1: round(x - BOUNDARY_CAP),
      y1: BOUNDARY_TOP,
      x2: round(x + BOUNDARY_CAP),
      y2: BOUNDARY_TOP,
      stroke,
      strokeWidth: stop ? 4 : 3,
    }),
  ];
}

/**
 * A mark's label, in both languages, under the lane.
 *
 * Below everything rather than above the band the engine asks for: above is
 * where the tense picture is, and a label that dodges a band by landing on the
 * event it belongs to has not been kept off anything. Nothing else is below
 * the lane, so a label of any length has the room.
 */
function labelNodes(id: string, label: Bilingual, centre: number): readonly SceneNode[] {
  const x = Math.min(Math.max(centre, LABEL_MARGIN), STAGE.width - LABEL_MARGIN);
  const top = round(LANE_Y + LANE_CONTAINER_H / 2 + LABEL_GAP);

  return [
    text(`${id}-label`, { x, y: top, content: String(label.en), size: LABEL_SIZE, lang: 'en' }),
    text(`${id}-label-ta`, {
      x,
      y: round(top + LABEL_LINE),
      content: String(label.ta),
      size: LABEL_SIZE,
      lang: 'ta',
    }),
  ];
}

function markNodes(spec: TimelineSpec): readonly SceneNode[] {
  const shapeOf = spec.relation === null ? null : TIME_RELATIONS[spec.relation];

  return spec.marks.flatMap((mark) => {
    const span = spanOf(mark, shapeOf);
    /* A boundary is an edge, and its label belongs at the edge, not halfway
       along a stretch it does not have. */
    const at = mark.kind === 'boundary' ? span.x0 : span.centre;

    return [
      ...markBody(mark, span, shapeOf),
      ...(mark.label === null ? [] : labelNodes(`mark-${mark.id}`, mark.label, at)),
    ];
  });
}

/* ---- the axis furniture ------------------------------------ */

const axisNodes = (): readonly SceneNode[] => [
  line('axis', {
    x1: AXIS_X0,
    y1: AXIS_Y,
    x2: AXIS_X1,
    y2: AXIS_Y,
    stroke: 'var(--line-strong)',
    strokeWidth: 4,
  }),
  text('past-label', {
    x: AXIS_X0,
    y: AXIS_Y + END_LABEL_DROP,
    content: 'past',
    anchor: 'start',
    size: 12,
    lang: 'en',
  }),
  text('future-label', {
    x: AXIS_X1,
    y: AXIS_Y + END_LABEL_DROP,
    content: 'future',
    anchor: 'end',
    size: 12,
    lang: 'en',
  }),
];

/** Drawn last, so a band or a container that spans `now` cannot hide it. */
const nowNodes = (): readonly SceneNode[] => [
  line('now', {
    x1: xAt(NOW),
    y1: AXIS_Y - NOW_TICK,
    x2: xAt(NOW),
    y2: AXIS_Y + NOW_TICK,
    stroke: 'var(--ink)',
    strokeWidth: 3,
  }),
  ellipse('now-dot', { cx: xAt(NOW), cy: AXIS_Y, rx: 5, ry: 5, fill: 'var(--ink)' }),
  text('now-label', {
    x: xAt(NOW),
    y: AXIS_Y + NOW_LABEL_DROP,
    content: 'now',
    size: 12,
    weight: 700,
    lang: 'en',
  }),
];

/**
 * A timeline scene, as a node tree.
 *
 * Returns nothing at all for a spec `timelineProblem` refuses.
 */
export function renderTimeline(spec: TimelineSpec): readonly SceneNode[] {
  if (timelineProblem(spec) !== null) return [];

  return [...axisNodes(), ...markNodes(spec), ...tenseNodes(spec.tense), ...nowNodes()];
}
