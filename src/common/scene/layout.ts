/* ============================================================
   layout.ts — the stage, once.

   Every renderer and every prop is written against these
   numbers, so they live in one file and nothing recomputes
   them. Ported from the prototype, which is the approved UI:
   changing them changes every drawing in the product.
   ============================================================ */

/** The viewBox every scene is drawn into. */
export const STAGE = { width: 720, height: 420 } as const;

/** Where the ground is. Props stand on it; the shadow sits just below it. */
export const FLOOR = 336;

/** The floor line stops short of the edges, so the ground reads as a room
 *  rather than as a border around the picture. */
export const FLOOR_INSET = 30;

/** Round at construction. Unrounded coordinates make the animation diff noisy
 *  — two renders of the same scene differing in the fifteenth decimal are two
 *  different scenes to a string comparison — and they blur the rendering on a
 *  non-retina screen. One decimal is finer than a pixel at this scale. */
export const round = (value: number): number => Math.round(value * 10) / 10;

/** The x that centres a box of this width on the stage. */
export const centreX = (width: number): number => round((STAGE.width - width) / 2);

/** The y that stands a box of this height on the floor. */
export const standOnFloor = (height: number, scale = 1): number => round(FLOOR - height * scale);

export type RowSpot = { readonly x: number; readonly y: number; readonly scale: number };

export type RowOptions = {
  readonly count: number;
  readonly itemWidth: number;
  readonly itemHeight: number;
  /** Where the row sits. Defaults to standing on the floor. */
  readonly y?: number;
  readonly scale?: number;
  readonly gap?: number;
  /** Centre of the row. Defaults to the centre of the stage. */
  readonly centre?: number;
};

/**
 * A centred row of n identical things.
 *
 * One, two or three copies is the whole of "how many" in this product — more
 * than three is a crowd rather than a number — but nothing here caps it, so a
 * renderer that needs four is not fighting the geometry.
 */
export function rowOfN({
  count,
  itemWidth,
  itemHeight,
  y,
  scale = 1,
  gap = 18,
  centre = STAGE.width / 2,
}: RowOptions): readonly RowSpot[] {
  if (count <= 0) return [];

  const width = itemWidth * scale;
  const total = count * width + (count - 1) * gap;
  const left = centre - total / 2;
  const top = y ?? standOnFloor(itemHeight, scale);

  return Array.from({ length: count }, (_, index) => ({
    x: round(left + index * (width + gap)),
    y: round(top),
    scale,
  }));
}

export type Shadow = {
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
};

/** The ellipse under a thing standing on the floor. It is what stops a prop
 *  looking like a sticker. */
export const shadowFor = (x: number, width: number, scale = 1): Shadow => ({
  cx: round(x + (width * scale) / 2),
  cy: FLOOR + 3,
  rx: round((width * scale) / 2),
  ry: 7,
});

/** Scale a prop down until it fits the width available, never up: a chair
 *  drawn larger than life to fill a gap is a different chair. */
export const fitWidth = (available: number, natural: number): number =>
  natural <= 0 ? 1 : Math.min(1, round((available / natural) * 1000) / 1000);
