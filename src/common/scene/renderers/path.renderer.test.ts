import { FLOOR, STAGE } from 'common/scene/layout';
import { PATH_ARROWS, pathAllows, pathProblem, renderPath } from 'common/scene/renderers/path.renderer';
import { box as boxProp, propFor } from 'common/scene/props/index';
import type { LandmarkKind, PathRelation, PathSpec, Prop, PropId, SceneNode } from 'common/scene/types';

/* ============================================================
   path.renderer.test.ts

   A direction preposition is an arrow, so almost everything here
   is an assertion about one: where it starts, where it ends,
   whether it touches the landmark, and which way it points.
   ============================================================ */

const id = (value: string): PropId => value as PropId;

const RELATIONS = Object.keys(PATH_ARROWS) as readonly PathRelation[];

/** A landmark each preposition can actually be drawn against. */
const LANDMARK_FOR: Readonly<Record<PathRelation, LandmarkKind>> = {
  to: 'building',
  into: 'container',
  towards: 'building',
  along: 'river',
  across: 'road',
  over: 'city',
  past: 'building',
  from: 'building',
};

const spec = (relation: PathRelation, over: Partial<PathSpec> = {}): PathSpec => ({
  kind: 'path',
  mover: id('man'),
  landmark: LANDMARK_FOR[relation],
  relation,
  arrives: PATH_ARROWS[relation].arrives,
  arrow: PATH_ARROWS[relation].arrow,
  ...over,
});

/* ---- reading the tree -------------------------------------- */

const flatten = (nodes: readonly SceneNode[]): readonly SceneNode[] =>
  nodes.flatMap((node) => [node, ...flatten(node.children ?? [])]);

const find = (nodes: readonly SceneNode[], nodeId: string): SceneNode | undefined =>
  flatten(nodes).find((node) => node.id === nodeId);

type Point = readonly [number, number];
type Shaft = { readonly from: Point; readonly to: Point; readonly control: Point | null };

/** The arrow's shaft, read back out of its `d`. */
function shaftOf(nodes: readonly SceneNode[], nodeId = 'arrow'): Shaft {
  const d = String(find(nodes, `${nodeId}-shaft`)?.attrs.d ?? '');
  const numbers = d.match(/-?[\d.]+/g)?.map(Number) ?? [];
  const [x1 = 0, y1 = 0, a = 0, b = 0, c = 0, e = 0] = numbers;

  return numbers.length >= 6
    ? { from: [x1, y1], control: [a, b], to: [c, e] }
    : { from: [x1, y1], control: null, to: [a, b] };
}

/** How far the shaft's control point sits off the straight line — the sag that
 *  makes an arc an arc. */
const bowOf = (shaft: Shaft): number =>
  shaft.control === null ? 0 : shaft.control[1] - (shaft.from[1] + shaft.to[1]) / 2;

type Box = { readonly x: number; readonly y: number; readonly w: number; readonly h: number };

function placedAt(node: SceneNode | undefined): { x: number; y: number; scale: number } {
  const transform = String(node?.attrs.transform ?? '');
  const move = /translate\(([-\d.]+),([-\d.]+)\)/.exec(transform);
  const scale = /scale\(([\d.]+)\)/.exec(transform);

  return { x: Number(move?.[1] ?? 0), y: Number(move?.[2] ?? 0), scale: Number(scale?.[1] ?? 1) };
}

function boxOf(nodes: readonly SceneNode[], nodeId: string, prop: Prop): Box {
  const at = placedAt(find(nodes, nodeId));
  return { x: at.x, y: at.y, w: prop.box.w * at.scale, h: prop.box.h * at.scale };
}

const prop = (name: string): Prop => {
  const found = propFor(id(name));
  if (!found) throw new Error(`the test asked for a prop that is not drawn: ${name}`);
  return found;
};

/** Where the landmark ended up, taken from its own group rather than assumed. */
function landmarkBounds(nodes: readonly SceneNode[]): Box {
  const at = placedAt(find(nodes, 'landmark'));
  const children = flatten(find(nodes, 'landmark')?.children ?? []);
  const xs = children.flatMap((node) => {
    const x = Number(node.attrs.x ?? node.attrs.x1 ?? NaN);
    const w = Number(node.attrs.width ?? 0);
    return Number.isNaN(x) ? [] : [x, x + w];
  });

  return {
    x: at.x + Math.min(...xs) * at.scale,
    y: at.y,
    w: (Math.max(...xs) - Math.min(...xs)) * at.scale,
    h: 0,
  };
}

/* ---- what can be drawn ------------------------------------- */

describe('pathAllows', () => {
  it('sends into a container and nowhere else — it is the only landmark with an inside', () => {
    expect(pathAllows('into', 'container')).toBe(true);
    for (const landmark of ['building', 'road', 'river', 'city'] as const) {
      expect(pathAllows('into', landmark)).toBe(false);
    }
  });

  it('crosses and follows a band, and nothing that is not one', () => {
    for (const relation of ['across', 'along'] as const) {
      expect(pathAllows(relation, 'road')).toBe(true);
      expect(pathAllows(relation, 'river')).toBe(true);
      expect(pathAllows(relation, 'building')).toBe(false);
    }
  });

  it('never sends the other five at a band — there is nothing to arrive at', () => {
    for (const relation of ['to', 'towards', 'over', 'past', 'from'] as const) {
      expect(pathAllows(relation, 'building')).toBe(true);
      expect(pathAllows(relation, 'road')).toBe(false);
    }
  });
});

describe('pathProblem', () => {
  it('says nothing about a scene that can be drawn', () => {
    for (const relation of RELATIONS) {
      expect(pathProblem(spec(relation))).toBeNull();
    }
  });

  it('refuses an arrow shape the preposition is not', () => {
    expect(pathProblem(spec('to', { arrow: 'arc' }))).toMatch(/straight/);
  });

  it('refuses a spec that claims to arrive when the word does not', () => {
    expect(pathProblem(spec('towards', { arrives: true }))).toMatch(/does not reach/);
    expect(pathProblem(spec('to', { arrives: false }))).toMatch(/reaches/);
  });

  it('refuses a landmark the preposition cannot be drawn against', () => {
    expect(pathProblem(spec('into', { landmark: 'building' }))).toMatch(/into/);
  });

  it('refuses a mover nobody drew', () => {
    expect(pathProblem(spec('to', { mover: id('dragon') }))).toMatch(/dragon/);
  });

  it('draws nothing at all for any of them', () => {
    expect(renderPath(spec('to', { arrives: false }))).toEqual([]);
    expect(renderPath(spec('into', { landmark: 'building' }))).toEqual([]);
    expect(renderPath(spec('to', { mover: id('dragon') }))).toEqual([]);
  });
});

/* ---- one test per preposition ------------------------------ */

describe('renderPath — every preposition', () => {
  it('draws all eight, each with a mover, a landmark and an arrow', () => {
    for (const relation of RELATIONS) {
      const nodes = renderPath(spec(relation));

      expect(find(nodes, 'mover')).toBeDefined();
      expect(find(nodes, 'landmark')).toBeDefined();
      expect(find(nodes, 'arrow-shaft')).toBeDefined();
    }
  });

  it('to — the arrow ends at the landmark, having started clear of the mover', () => {
    const nodes = renderPath(spec('to'));
    const shaft = shaftOf(nodes);
    const mover = boxOf(nodes, 'mover', prop('man'));
    const landmark = landmarkBounds(nodes);

    expect(shaft.from[0]).toBeGreaterThan(mover.x + mover.w);
    expect(shaft.to[0]).toBeGreaterThan(shaft.from[0]);
    expect(landmark.x - shaft.to[0]).toBeLessThan(12);
    expect(shaft.control).toBeNull();
  });

  it('towards — the arrow stops visibly short, and what it did not reach is faded', () => {
    const to = shaftOf(renderPath(spec('to')));
    const nodes = renderPath(spec('towards'));
    const shaft = shaftOf(nodes);

    expect(shaft.to[0]).toBeLessThan(to.to[0] - 40);
    expect(Number(find(nodes, 'landmark')?.attrs.opacity)).toBeLessThan(1);
  });

  it('towards — a solid stretch that happened, then dashes that did not', () => {
    const nodes = renderPath(spec('towards'));
    const tail = find(nodes, 'arrow-tail');
    const shaft = find(nodes, 'arrow-shaft');

    expect(tail?.attrs['stroke-dasharray']).toBeUndefined();
    expect(shaft?.attrs['stroke-dasharray']).toBeTruthy();
    expect(shaftOf(nodes).from[0]).toBeGreaterThan(Number(tail?.attrs.d?.toString().match(/[\d.]+/)?.[0]));
  });

  it('into — the arrow finishes inside the container, having crossed its edge', () => {
    const nodes = renderPath(spec('into', { mover: id('dog') }));
    const shaft = shaftOf(nodes);
    const at = placedAt(find(nodes, 'landmark'));
    const [ix, iy, iw, ih] = boxProp.inside ?? [0, 0, 0, 0];

    expect(shaft.to[0]).toBeGreaterThanOrEqual(at.x + ix);
    expect(shaft.to[0]).toBeLessThanOrEqual(at.x + ix + iw);
    expect(shaft.to[1]).toBeGreaterThanOrEqual(at.y + iy);
    expect(shaft.to[1]).toBeLessThanOrEqual(at.y + iy + ih);
    /* The lift is what makes it "into" rather than "to": the arc goes over the
       top edge before it comes down. */
    expect(shaft.control?.[1]).toBeLessThan(at.y);
  });

  it('into — the inside it finishes in is drawn, not merely asserted', () => {
    const nodes = renderPath(spec('into', { mover: id('dog') }));

    expect(find(nodes, 'mark-inside')?.attrs['stroke-dasharray']).toBeTruthy();
  });

  it('across — the arrow cuts the band at right angles and clears both sides', () => {
    const nodes = renderPath(spec('across'));
    const shaft = shaftOf(nodes);
    const band = find(nodes, 'surface');
    const top = Number(band?.attrs.y);
    const bottom = top + Number(band?.attrs.height);

    expect(shaft.from[0]).toBe(shaft.to[0]);
    expect(shaft.from[1]).toBeGreaterThan(bottom);
    expect(shaft.to[1]).toBeLessThan(top);
  });

  it('along — the arrow runs level with the band, and bows exactly as it bows', () => {
    const nodes = renderPath(spec('along'));
    const shaft = shaftOf(nodes);
    const water = String(find(nodes, 'water')?.attrs.d ?? '');
    const numbers = water.match(/-?[\d.]+/g)?.map(Number) ?? [];
    const [x1 = 0, y1 = 0, , cy = 0, , y2 = 0] = numbers;
    const riverBow = cy - (y1 + y2) / 2;

    expect(shaft.from[1]).toBe(shaft.to[1]);
    expect(bowOf(shaft)).toBeCloseTo(riverBow, 0);
    expect(x1).toBeLessThan(shaft.from[0]);
  });

  it('along — the mover walks the bank rather than the water', () => {
    const nodes = renderPath(spec('along'));
    const mover = boxOf(nodes, 'mover', prop('man'));
    const bank = Number(find(nodes, 'bank')?.attrs.y1);

    expect(mover.y + mover.h).toBeCloseTo(bank, 0);
  });

  it('over — the arc clears the tallest roof and the mover rides its top', () => {
    const nodes = renderPath(spec('over', { mover: id('ball') }));
    const shaft = shaftOf(nodes);
    const mover = boxOf(nodes, 'mover', prop('ball'));
    const roofs = flatten(find(nodes, 'landmark')?.children ?? [])
      .filter((node) => node.id.startsWith('block-') && !node.id.includes('window'))
      .map((node) => Number(node.attrs.y));

    expect(bowOf(shaft)).toBeLessThan(0);
    expect(mover.y + mover.h).toBeLessThan(Math.min(...roofs));
    expect(find(nodes, 'shadow-mover')).toBeUndefined();
  });

  it('past — one arrow the width of the stage, and the mover shown beyond it', () => {
    const nodes = renderPath(spec('past', { mover: id('car') }));
    const shaft = shaftOf(nodes);
    const mover = boxOf(nodes, 'mover', prop('car'));
    const ghost = boxOf(nodes, 'mover-ghost', prop('car'));
    const stop = find(nodes, 'mark-stop');

    expect(shaft.from[0]).toBeLessThan(mover.x);
    expect(shaft.to[0]).toBeGreaterThan(ghost.x + ghost.w);
    expect(ghost.x).toBeGreaterThan(mover.x);
    expect(Number(find(nodes, 'mover-ghost')?.attrs.opacity)).toBeLessThan(1);
    expect(Number(stop?.attrs.x1)).toBeCloseTo(landmarkBounds(nodes).x + landmarkBounds(nodes).w / 2, 0);
  });

  it('past — the landmark is in the middle, or "kept going" has nowhere to go', () => {
    const landmark = landmarkBounds(renderPath(spec('past', { mover: id('car') })));

    expect(landmark.x + landmark.w / 2).toBeCloseTo(STAGE.width / 2, 0);
  });

  it('from — the arrow starts at the landmark and points back at the mover', () => {
    const nodes = renderPath(spec('from', { mover: id('woman') }));
    const shaft = shaftOf(nodes);
    const mover = boxOf(nodes, 'mover', prop('woman'));
    const landmark = landmarkBounds(nodes);

    expect(landmark.x - shaft.from[0]).toBeLessThan(12);
    expect(shaft.to[0]).toBeLessThan(shaft.from[0]);
    expect(shaft.to[0]).toBeGreaterThan(mover.x + mover.w);
  });

  it('from — the same road as to, the arrow reversed', () => {
    const forwards = shaftOf(renderPath(spec('to', { mover: id('woman') })));
    const backwards = shaftOf(renderPath(spec('from', { mover: id('woman') })));

    expect(forwards.to[0] - forwards.from[0]).toBeGreaterThan(0);
    expect(backwards.to[0] - backwards.from[0]).toBeLessThan(0);
    expect(forwards.from[1]).toBe(backwards.from[1]);
  });
});

/* ---- the shape of every arrow ------------------------------ */

describe('renderPath — arrows', () => {
  it('curves only where the preposition is a curve', () => {
    for (const relation of RELATIONS) {
      /* `solid-then-dashed` is a straight line drawn in two pieces — only
         `arc` and `curve-into` bend. */
      const shape = PATH_ARROWS[relation].arrow;
      const curved = shape === 'arc' || shape === 'curve-into';

      expect(shaftOf(renderPath(spec(relation))).control !== null).toBe(curved);
    }
  });

  it('carries exactly one head, and never a marker', () => {
    for (const relation of RELATIONS) {
      const nodes = flatten(renderPath(spec(relation)));

      expect(nodes.filter((node) => node.id.endsWith('-head'))).toHaveLength(1);
      expect(nodes.filter((node) => 'marker-end' in node.attrs)).toHaveLength(0);
    }
  });

  it('dashes exactly where arrival is not claimed', () => {
    for (const relation of RELATIONS) {
      const dashed = Boolean(find(renderPath(spec(relation)), 'arrow-shaft')?.attrs['stroke-dasharray']);

      /* `along`, `across` and `past` do not arrive either, but they are not
         about arriving — only the two that are about it say so with dashes. */
      if (relation === 'towards' || relation === 'over') expect(dashed).toBe(true);
      else expect(dashed).toBe(false);
    }
  });

  it('keeps every arrow inside the stage', () => {
    for (const relation of RELATIONS) {
      const shaft = shaftOf(renderPath(spec(relation)));

      for (const [x, y] of [shaft.from, shaft.to]) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(STAGE.width);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(STAGE.height);
      }
    }
  });
});

/* ---- the mover --------------------------------------------- */

describe('renderPath — the mover', () => {
  const MOVERS = ['man', 'woman', 'cat', 'dog', 'car', 'ball'] as const;

  it('never overlaps the landmark, whatever is moving', () => {
    for (const relation of ['to', 'towards', 'into', 'from'] as const) {
      for (const name of MOVERS) {
        const nodes = renderPath(spec(relation, { mover: id(name) }));
        const mover = boxOf(nodes, 'mover', prop(name));

        expect(mover.x + mover.w).toBeLessThan(landmarkBounds(nodes).x);
      }
    }
  });

  it('brings every mover into one envelope, and never enlarges one', () => {
    for (const name of MOVERS) {
      const nodes = renderPath(spec('to', { mover: id(name) }));
      const mover = boxOf(nodes, 'mover', prop(name));

      expect(placedAt(find(nodes, 'mover')).scale).toBeLessThanOrEqual(1);
      expect(mover.h).toBeLessThanOrEqual(170);
      expect(mover.w).toBeLessThanOrEqual(210);
    }
  });

  it('shadows a mover on the floor and not one in the air', () => {
    expect(find(renderPath(spec('to')), 'shadow-mover')).toBeDefined();
    expect(find(renderPath(spec('over', { mover: id('ball') })), 'shadow-mover')).toBeUndefined();
  });
});

/* ---- the house rules --------------------------------------- */

describe('renderPath — house rules', () => {
  it('draws one horizon and only one', () => {
    for (const relation of RELATIONS) {
      const nodes = renderPath(spec(relation));
      const band = LANDMARK_FOR[relation] === 'road' || LANDMARK_FOR[relation] === 'river';

      expect(find(nodes, 'floor') === undefined).toBe(band);
    }
  });

  it('never writes a literal colour', () => {
    for (const relation of RELATIONS) {
      for (const node of flatten(renderPath(spec(relation)))) {
        for (const attr of ['fill', 'stroke'] as const) {
          const value = String(node.attrs[attr] ?? '');
          if (value === '' || value === 'none') continue;
          expect(value).toMatch(/^var\(--[a-z0-9-]+\)$/);
        }
      }
    }
  });

  it('rounds every coordinate it produces', () => {
    for (const relation of RELATIONS) {
      for (const node of flatten(renderPath(spec(relation)))) {
        for (const value of Object.values(node.attrs)) {
          if (typeof value !== 'number') continue;
          expect(Math.round(value * 10) / 10).toBe(value);
        }
      }
    }
  });

  it('names the mover and the arrow the same way whatever the preposition is', () => {
    for (const relation of RELATIONS) {
      const nodes = renderPath(spec(relation));

      expect(find(nodes, 'mover')?.attrs['data-node']).toBe('mover');
      expect(find(nodes, 'landmark')?.attrs['data-node']).toBe('landmark');
      expect(find(nodes, 'arrow-shaft')).toBeDefined();
    }
  });

  it('stands everything that is on the floor on the same floor', () => {
    for (const relation of ['to', 'towards', 'past', 'from'] as const) {
      const mover = boxOf(renderPath(spec(relation)), 'mover', prop('man'));

      expect(mover.y + mover.h).toBeCloseTo(FLOOR, 0);
    }
  });
});
