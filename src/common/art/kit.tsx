import type { JSX } from 'react';

/* ============================================================
   kit.tsx — the drawing primitives the vocabulary art is made of.

   Ported from the prototype's `GV_Scene.kit` with its geometry
   unchanged, because the numbers in the family files are written
   against these exact signatures. Every drawing is in a 48x48 box.

   These return elements rather than strings, so the art is React
   all the way down and nothing has to be set as raw HTML.
   ============================================================ */

export const INK = 'var(--ink)';
export const ACC = 'var(--accent)';
export const MUT = 'var(--muted)';
export const WARN = 'var(--warn)';
export const SOFT = 'var(--soft)';
export const LINE = 'var(--line-strong)';

/** Wood, ground and skin. Named here so a family file never spells a hex
 *  twice and the whole set can be retinted in one place. */
export const WOOD = '#c89a5e';
export const WOOD_DARK = '#b3873f';
export const WOOD_EDGE = '#8a5b30';
export const BALL_FILL = '#e08a2e';
export const SKIN = '#d9a06a';
export const HAIR = '#3a2a1c';

export type TextOpts = {
  readonly s?: number;
  readonly w?: number;
  readonly f?: string;
  readonly a?: 'start' | 'middle' | 'end';
};

export type LineOpts = {
  readonly c?: string;
  readonly w?: number;
  /** stroke-dasharray */
  readonly d?: string;
};

export const R = (
  x: number,
  y: number,
  w: number,
  h: number,
  rad: number,
  fill: string,
  extra?: Record<string, string | number>,
): JSX.Element => <rect x={x} y={y} width={w} height={h} rx={rad || 0} fill={fill} {...extra} />;

export const CIR = (cx: number, cy: number, r: number, fill: string): JSX.Element => (
  <circle cx={cx} cy={cy} r={r} fill={fill} />
);

/** A circle drawn as an outline. The prototype writes these inline because its
 *  `CIR` only fills; here it is a named thing so the intent is readable. */
export const RING = (
  cx: number,
  cy: number,
  r: number,
  stroke: string,
  width = 2,
  dash?: string,
): JSX.Element => (
  <circle
    cx={cx}
    cy={cy}
    r={r}
    fill="none"
    stroke={stroke}
    strokeWidth={width}
    {...(dash ? { strokeDasharray: dash } : {})}
  />
);

export const T = (x: number, y: number, s: string, o: TextOpts = {}): JSX.Element => (
  <text
    x={x}
    y={y}
    textAnchor={o.a ?? 'middle'}
    fontFamily="system-ui, sans-serif"
    fontSize={o.s ?? 14}
    fontWeight={o.w ?? 600}
    fill={o.f ?? MUT}
  >
    {s}
  </text>
);

export const LN = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  o: LineOpts = {},
): JSX.Element => (
  <line
    x1={x1}
    y1={y1}
    x2={x2}
    y2={y2}
    stroke={o.c ?? 'var(--line)'}
    strokeWidth={o.w ?? 2}
    {...(o.d ? { strokeDasharray: o.d } : {})}
    strokeLinecap="round"
  />
);

export const P = (d: string, o: LineOpts & { readonly fill?: string } = {}): JSX.Element => (
  <path
    d={d}
    fill={o.fill ?? 'none'}
    {...(o.c ? { stroke: o.c } : {})}
    {...(o.w ? { strokeWidth: o.w } : {})}
    {...(o.d ? { strokeDasharray: o.d } : {})}
    strokeLinecap="round"
  />
);

/** A filled path — a silhouette rather than a stroke. */
export const FILL = (d: string, fill: string, extra?: Record<string, string | number>): JSX.Element => (
  <path d={d} fill={fill} {...extra} />
);

/* ---- shared glyphs ----------------------------------------
   The parts more than one family is built from. Ported with
   their numbers intact.
   ---------------------------------------------------------- */

/** A container, optionally open at the top. */
export const iBox = (x: number, y: number, w: number, h: number, open: boolean): JSX.Element[] => [
  R(x, y + 5, w, h - 5, 2, WOOD),
  ...(open
    ? [R(x, y, w * 0.38, 6, 1, WOOD_DARK), R(x + w * 0.62, y, w * 0.38, 6, 1, WOOD_DARK)]
    : [R(x, y, w, 6, 1, WOOD_DARK)]),
];

/** A surface on legs. */
export const iBar = (x: number, y: number, w: number): JSX.Element[] => [
  R(x, y, w, 4, 1, '#a9723f'),
  R(x + 2, y + 4, 3, 12, 0, WOOD_EDGE),
  R(x + w - 5, y + 4, 3, 12, 0, WOOD_EDGE),
];

/** The figure carries a dark rim. Without it an orange ball on a brown box is
 *  one silhouette at icon size — "in" and "behind" both read as just a box,
 *  which is the opposite of what they are meant to show. */
export const iDot = (cx: number, cy: number, r = 6, f: string = BALL_FILL): JSX.Element[] => [
  CIR(cx, cy, r, f),
  RING(cx, cy, r, WOOD_EDGE, 1.5),
];

/** The ring that marks which one is meant: solid for the known one, dashed for
 *  any one. */
export const iRing = (
  x: number,
  y: number,
  w: number,
  h: number,
  dashed: boolean,
): JSX.Element => (
  <rect
    x={x}
    y={y}
    width={w}
    height={h}
    rx={6}
    fill="none"
    stroke={ACC}
    strokeWidth={2.5}
    {...(dashed ? { strokeDasharray: '5 4' } : {})}
  />
);

/** A person. `sc` scales the whole figure, so one definition draws the single
 *  speaker and the three of "they". */
export const iPerson = (
  cx: number,
  cy: number,
  sc = 1,
  shirt = '#3f7d62',
  hair?: 'long',
): JSX.Element => {
  const head = 5 * sc;
  const hy = cy - 9 * sc;

  return (
    <g>
      {CIR(cx, hy, head, SKIN)}
      {hair === 'long' ? (
        <>
          {FILL(
            `M${cx - head - 1} ${hy} a${head + 1} ${head + 1} 0 0 1 ${2 * head + 2} 0 v${5 * sc} h-${2 * head + 2} z`,
            HAIR,
          )}
          {CIR(cx, hy, head, SKIN)}
        </>
      ) : (
        FILL(`M${cx - head} ${hy - 1} a${head} ${head} 0 0 1 ${2 * head} 0 z`, HAIR)
      )}
      {FILL(
        `M${cx - 6 * sc} ${cy + 11 * sc} v-${7 * sc} a${6 * sc} ${6 * sc} 0 0 1 ${12 * sc} 0 v${7 * sc} z`,
        shirt,
      )}
    </g>
  );
};

/* The arrowhead is drawn rather than markered: a marker id would collide
   across the dozens of icons that share one page. */
export const iArrow = (x1: number, y1: number, x2: number, y2: number): JSX.Element[] => [
  P(`M${x1} ${y1} L${x2} ${y2}`, { c: 'var(--r-rel)', w: 2.5 }),
  FILL(`M${x2 - 5} ${y2 - 4} L${x2 + 2} ${y2} L${x2 - 5} ${y2 + 4} z`, 'var(--r-rel)'),
];
