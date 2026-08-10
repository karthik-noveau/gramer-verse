import { FLOOR, FLOOR_INSET, STAGE, round, shadowFor } from 'common/scene/layout';
import type { SceneNode } from 'common/scene/types';

/* ============================================================
   primitives.ts — the SVG node constructors.

   Plain data in, plain data out: no SVG strings, no JSX, no
   DOM. That is what lets a renderer be tested by asserting on
   structure rather than on markup, and what lets engine 20 diff
   two trees.

   Colours are custom properties, never literals, so a scene
   follows the theme without knowing there is one. The
   illustrative colours a prop draws itself in — wood, brick,
   terracotta — are the deliberate exception and belong to
   engine 10.
   ============================================================ */

/** Every id is caller-supplied. Node identity is a semantic decision —
 *  `figure-0`, `ground`, `arrow` — and the animation diff matches on it, so a
 *  generated id would make every render a different scene. */
export type NodeId = string;

type Attrs = Record<string, string | number>;

const clean = (attrs: Attrs): Attrs => {
  const out: Attrs = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === '') continue;
    out[key] = typeof value === 'number' ? round(value) : value;
  }
  return out;
};

const node = (
  id: NodeId,
  tag: SceneNode['tag'],
  attrs: Attrs,
  extra?: { readonly text?: string; readonly children?: readonly SceneNode[] },
): SceneNode => ({
  id,
  tag,
  attrs: clean(attrs),
  ...(extra?.text !== undefined ? { text: extra.text } : {}),
  ...(extra?.children !== undefined ? { children: extra.children } : {}),
});

/* ---- shapes ------------------------------------------------ */

export type RectOptions = {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly r?: number;
  readonly fill?: string;
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly dash?: string;
  readonly opacity?: number;
};

export const rect = (id: NodeId, o: RectOptions): SceneNode =>
  node(id, 'rect', {
    x: o.x,
    y: o.y,
    width: o.w,
    height: o.h,
    rx: o.r ?? 0,
    fill: o.fill ?? 'none',
    stroke: o.stroke ?? '',
    'stroke-width': o.strokeWidth ?? '',
    'stroke-dasharray': o.dash ?? '',
    opacity: o.opacity ?? '',
  });

export type CircleOptions = {
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly fill?: string;
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly opacity?: number;
};

export const circle = (id: NodeId, o: CircleOptions): SceneNode =>
  node(id, 'circle', {
    cx: o.cx,
    cy: o.cy,
    r: o.r,
    fill: o.fill ?? 'none',
    stroke: o.stroke ?? '',
    'stroke-width': o.strokeWidth ?? '',
    opacity: o.opacity ?? '',
  });

export type EllipseOptions = {
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
  readonly fill?: string;
  readonly opacity?: number;
};

export const ellipse = (id: NodeId, o: EllipseOptions): SceneNode =>
  node(id, 'ellipse', {
    cx: o.cx,
    cy: o.cy,
    rx: o.rx,
    ry: o.ry,
    fill: o.fill ?? 'none',
    opacity: o.opacity ?? '',
  });

export type PathOptions = {
  readonly d: string;
  readonly fill?: string;
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly dash?: string;
  readonly cap?: 'butt' | 'round' | 'square';
  readonly join?: 'miter' | 'round' | 'bevel';
  readonly markerEnd?: string;
  readonly opacity?: number;
};

export const path = (id: NodeId, o: PathOptions): SceneNode =>
  node(id, 'path', {
    d: o.d,
    fill: o.fill ?? 'none',
    stroke: o.stroke ?? '',
    'stroke-width': o.strokeWidth ?? '',
    'stroke-dasharray': o.dash ?? '',
    'stroke-linecap': o.cap ?? 'round',
    'stroke-linejoin': o.join ?? 'round',
    'marker-end': o.markerEnd ? `url(#${o.markerEnd})` : '',
    opacity: o.opacity ?? '',
  });

export type LineOptions = {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly dash?: string;
  readonly cap?: 'butt' | 'round' | 'square';
};

export const line = (id: NodeId, o: LineOptions): SceneNode =>
  node(id, 'line', {
    x1: o.x1,
    y1: o.y1,
    x2: o.x2,
    y2: o.y2,
    stroke: o.stroke ?? 'var(--line)',
    'stroke-width': o.strokeWidth ?? 2,
    'stroke-dasharray': o.dash ?? '',
    'stroke-linecap': o.cap ?? 'round',
  });

export type TextOptions = {
  readonly x: number;
  readonly y: number;
  readonly content: string;
  readonly anchor?: 'start' | 'middle' | 'end';
  readonly size?: number;
  readonly weight?: number;
  readonly fill?: string;
  /** Tamil needs its own stack, and the attribute is how an SVG string gets
   *  it — the CSS cannot reach inside a node tree. */
  readonly lang?: 'en' | 'ta';
};

/**
 * Text is the one node whose drawn size the engine cannot know: it depends on
 * the font that loaded, which is a browser fact and not a data one. Nothing in
 * a renderer may lay anything out from a measured text width.
 */
export const text = (id: NodeId, o: TextOptions): SceneNode =>
  node(
    id,
    'text',
    {
      x: o.x,
      y: o.y,
      'text-anchor': o.anchor ?? 'middle',
      'font-size': o.size ?? 14,
      'font-weight': o.weight ?? 600,
      'font-family': o.lang === 'ta' ? 'var(--tamil)' : 'var(--font)',
      fill: o.fill ?? 'var(--muted)',
      ...(o.lang ? { 'xml:lang': o.lang } : {}),
    },
    { text: o.content },
  );

export type GroupOptions = {
  readonly x?: number;
  readonly y?: number;
  readonly scale?: number;
  readonly opacity?: number;
  /** What this group is, for the picture-words to light up. */
  readonly role?: string;
};

/**
 * A group, with an optional translate and scale.
 *
 * An empty group is still a group: returning null for one would remove the
 * thing the animation diff matches against, and a prop that vanishes for one
 * render reappears as a new node rather than moving.
 */
export const group = (
  id: NodeId,
  children: readonly SceneNode[],
  o: GroupOptions = {},
): SceneNode => {
  const parts: string[] = [];
  if (o.x !== undefined || o.y !== undefined) {
    parts.push(`translate(${round(o.x ?? 0)},${round(o.y ?? 0)})`);
  }
  if (o.scale !== undefined && o.scale !== 1) parts.push(`scale(${round(o.scale * 1000) / 1000})`);

  return node(
    id,
    'g',
    {
      transform: parts.join(' '),
      opacity: o.opacity ?? '',
      'data-node': o.role ?? '',
    },
    { children },
  );
};

/* ---- scene furniture --------------------------------------- */

/** The ellipse under a thing standing on the floor. */
export const shadow = (id: NodeId, x: number, width: number, scale = 1): SceneNode => {
  const s = shadowFor(x, width, scale);
  return ellipse(id, { ...s, fill: 'var(--shadow-ink)' });
};

/** The ground. One line, inset from both edges. */
export const floorLine = (id: NodeId = 'floor'): SceneNode =>
  line(id, {
    x1: FLOOR_INSET,
    y1: FLOOR,
    x2: STAGE.width - FLOOR_INSET,
    y2: FLOOR,
    stroke: 'var(--line)',
    strokeWidth: 3,
  });

/** A ring around whatever the sentence is talking about. Used by voice in the
 *  actor scene, and by predict-then-reveal to mark the chosen answer. */
export const ring = (
  id: NodeId,
  o: { readonly x: number; readonly y: number; readonly w: number; readonly h: number },
): SceneNode =>
  rect(id, {
    x: o.x - 9,
    y: o.y - 9,
    w: o.w + 18,
    h: o.h + 18,
    r: 12,
    stroke: 'var(--accent)',
    strokeWidth: 3,
    dash: '9 7',
  });

/* ---- arrows ------------------------------------------------ */

export type ArrowOptions = {
  readonly from: readonly [number, number];
  readonly to: readonly [number, number];
  /** How far the shaft bows, as a fraction of its length. 0 is straight. */
  readonly curve?: number;
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly dash?: string;
  readonly headSize?: number;
};

/**
 * An arrow: a shaft and a head, as one group.
 *
 * **No `<marker>`.** Markers live in `<defs>` under a document-wide id, so two
 * scenes on one page — a lesson and its worked example — share one definition,
 * and the second silently takes the first one's colour. The head is drawn as
 * geometry instead: it is three points, it cannot collide with anything, and
 * a scene with no arrows carries no unused defs because there are no defs.
 */
export function arrow(id: NodeId, o: ArrowOptions): SceneNode {
  const stroke = o.stroke ?? 'var(--r-rel)';
  const width = o.strokeWidth ?? 4;
  const size = o.headSize ?? 13;

  const [x1, y1] = o.from;
  const [x2, y2] = o.to;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;

  /* The control point sits beside the midpoint, on the normal to the line, so
     the same curve reads the same whichever way the arrow points. */
  const curve = o.curve ?? 0;
  const midX = (x1 + x2) / 2 - (dy / length) * (curve * length);
  const midY = (y1 + y2) / 2 + (dx / length) * (curve * length);

  const shaftD =
    curve === 0
      ? `M${round(x1)},${round(y1)} L${round(x2)},${round(y2)}`
      : `M${round(x1)},${round(y1)} Q${round(midX)},${round(midY)} ${round(x2)},${round(y2)}`;

  /* The head points along the last segment: the control point for a curve, the
     start for a straight line. An arrowhead square to the shaft is the tell of
     a drawing engine that guessed. */
  const fromX = curve === 0 ? x1 : midX;
  const fromY = curve === 0 ? y1 : midY;
  const angle = Math.atan2(y2 - fromY, x2 - fromX);
  const wing = 0.42;
  const p = (a: number): string =>
    `${round(x2 - size * Math.cos(a))},${round(y2 - size * Math.sin(a))}`;

  return group(
    id,
    [
      path(`${id}-shaft`, { d: shaftD, stroke, strokeWidth: width, dash: o.dash ?? '' }),
      path(`${id}-head`, {
        d: `M${round(x2)},${round(y2)} L${p(angle - wing)} L${p(angle + wing)} Z`,
        fill: stroke,
        stroke: stroke,
        strokeWidth: 1,
      }),
    ],
    { role: 'arrow' },
  );
}
