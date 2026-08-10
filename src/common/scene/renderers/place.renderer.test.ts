import { FLOOR, STAGE } from 'common/scene/layout';
import {
  PLACE_ADJECTIVES,
  placeAllows,
  placeProblem,
  renderPlace,
} from 'common/scene/renderers/place.renderer';
import { propFor } from 'common/scene/props/index';
import type { FigureCount, PlaceRelation, PlaceSpec, Prop, PropId, SceneNode } from 'common/scene/types';

/* ============================================================
   place.renderer.test.ts

   Every assertion here is about the picture, not about the
   markup: where the figure ended up relative to the ground, what
   the ground hides, what order things are drawn in. That is what
   the node tree exists for.
   ============================================================ */

const id = (value: string): PropId => value as PropId;

const spec = (over: Partial<PlaceSpec> & { readonly relation: PlaceRelation }): PlaceSpec => ({
  kind: 'place',
  figure: id('ball'),
  ground: id('box'),
  ground2: null,
  determiner: 'the',
  count: 1,
  adjective: null,
  ...over,
});

/** A ground each relation can actually be drawn against. */
const GROUND_FOR: Readonly<Record<PlaceRelation, string | null>> = {
  in: 'box',
  on: 'table',
  at: 'shop',
  under: 'table',
  above: 'door',
  below: 'table',
  behind: 'car',
  'in front of': 'shop',
  between: 'box',
  near: 'tree',
  beside: 'table',
  here: null,
  there: null,
};

const RELATIONS = Object.keys(GROUND_FOR) as readonly PlaceRelation[];

const sceneFor = (relation: PlaceRelation, over: Partial<PlaceSpec> = {}): PlaceSpec => {
  const ground = GROUND_FOR[relation];
  return spec({
    relation,
    figure: id('cat'),
    ground: ground === null ? null : id(ground),
    ground2: relation === 'between' ? id('chair') : null,
    ...over,
  });
};

/* ---- reading the tree -------------------------------------- */

const flatten = (nodes: readonly SceneNode[]): readonly SceneNode[] =>
  nodes.flatMap((node) => [node, ...flatten(node.children ?? [])]);

const find = (nodes: readonly SceneNode[], nodeId: string): SceneNode | undefined =>
  nodes.find((node) => node.id === nodeId);

const indexOf = (nodes: readonly SceneNode[], nodeId: string): number =>
  nodes.findIndex((node) => node.id === nodeId);

type Placed = { readonly x: number; readonly y: number; readonly scale: number };

function placedAt(node: SceneNode | undefined): Placed {
  const transform = String(node?.attrs.transform ?? '');
  const move = /translate\(([-\d.]+),([-\d.]+)\)/.exec(transform);
  const scale = /scale\(([\d.]+)\)/.exec(transform);

  return {
    x: Number(move?.[1] ?? 0),
    y: Number(move?.[2] ?? 0),
    scale: Number(scale?.[1] ?? 1),
  };
}

type Box = { readonly left: number; readonly top: number; readonly right: number; readonly bottom: number };

function boxOf(nodes: readonly SceneNode[], nodeId: string, prop: Prop): Box {
  const at = placedAt(find(nodes, nodeId));
  return {
    left: at.x,
    top: at.y,
    right: at.x + prop.box.w * at.scale,
    bottom: at.y + prop.box.h * at.scale,
  };
}

const prop = (name: string): Prop => {
  const found = propFor(id(name));
  if (!found) throw new Error(`the test asked for a prop that is not drawn: ${name}`);
  return found;
};

const figureBoxes = (nodes: readonly SceneNode[], name: string): readonly Box[] =>
  nodes
    .filter((node) => node.id.startsWith('figure-'))
    .map((node) => node.id)
    .map((nodeId) => boxOf(nodes, nodeId, prop(name)));

/* ---- what can be drawn ------------------------------------- */

describe('placeAllows', () => {
  it('lets a container be gone in and refuses one that is solid', () => {
    expect(placeAllows('in', 'box')).toBe(true);
    expect(placeAllows('in', 'table')).toBe(false);
    expect(placeAllows('in', 'chair')).toBe(false);
  });

  it('lets a thing on legs be gone under and refuses one sitting flat', () => {
    expect(placeAllows('under', 'table')).toBe(true);
    expect(placeAllows('under', 'chair')).toBe(true);
    expect(placeAllows('under', 'box')).toBe(false);
  });

  it('needs a second ground for between and only for between', () => {
    expect(placeAllows('between', 'box')).toBe(false);
    expect(placeAllows('between', 'box', 'chair')).toBe(true);
    expect(placeAllows('beside', 'box')).toBe(true);
  });

  it('needs no ground at all for here and there', () => {
    expect(placeAllows('here', null)).toBe(true);
    expect(placeAllows('there', null)).toBe(true);
  });

  it('refuses every grounded relation when the ground is not drawn', () => {
    for (const relation of RELATIONS) {
      if (GROUND_FOR[relation] === null) continue;
      expect(placeAllows(relation, 'unicorn')).toBe(false);
      expect(placeAllows(relation, null)).toBe(false);
    }
  });
});

describe('placeProblem', () => {
  it('says nothing about a scene that can be drawn', () => {
    for (const relation of RELATIONS) {
      expect(placeProblem(sceneFor(relation))).toBeNull();
    }
  });

  it('names the missing second ground rather than drawing a wrong picture', () => {
    expect(placeProblem(spec({ relation: 'between' }))).toMatch(/two grounds/);
  });

  it('refuses in without an inside and under without clearance', () => {
    expect(placeProblem(spec({ relation: 'in', ground: id('table') }))).toMatch(/inside/);
    expect(placeProblem(spec({ relation: 'under', ground: id('box') }))).toMatch(/under/);
  });

  it('refuses an adjective that changes nothing in the picture', () => {
    expect(placeProblem(spec({ relation: 'on', ground: id('table'), adjective: 'wooden' }))).toMatch(
      /wooden/,
    );
    expect(placeProblem(spec({ relation: 'on', ground: id('table'), adjective: 'red' }))).toBeNull();
  });

  it('refuses a figure nobody drew', () => {
    expect(placeProblem(spec({ relation: 'on', figure: id('dragon') }))).toMatch(/dragon/);
  });
});

describe('renderPlace — refusal', () => {
  it('draws nothing rather than a picture that contradicts its sentence', () => {
    expect(renderPlace(spec({ relation: 'between' }))).toEqual([]);
    expect(renderPlace(spec({ relation: 'in', ground: id('table') }))).toEqual([]);
    expect(renderPlace(spec({ relation: 'under', ground: id('box') }))).toEqual([]);
    expect(renderPlace(spec({ relation: 'on', ground: null }))).toEqual([]);
    expect(renderPlace(spec({ relation: 'on', figure: id('dragon') }))).toEqual([]);
  });
});

/* ---- one test per relation --------------------------------- */

describe('renderPlace — every relation', () => {
  it('draws all thirteen, each with a floor and its figure', () => {
    for (const relation of RELATIONS) {
      const nodes = renderPlace(sceneFor(relation));

      expect(find(nodes, 'floor')).toBeDefined();
      expect(find(nodes, 'figure-0')).toBeDefined();
      expect(find(nodes, 'ground') === undefined).toBe(GROUND_FOR[relation] === null);
    }
  });

  it('in — the figure sits inside the ground’s own container', () => {
    const nodes = renderPlace(sceneFor('in', { figure: id('ball') }));
    const ground = placedAt(find(nodes, 'ground'));
    const [ix, iy, iw, ih] = prop('box').inside ?? [0, 0, 0, 0];
    const [figure] = figureBoxes(nodes, 'ball');

    expect(figure?.left).toBeGreaterThanOrEqual(ground.x + ix);
    expect(figure?.right).toBeLessThanOrEqual(ground.x + ix + iw);
    expect(figure?.top).toBeGreaterThanOrEqual(ground.y + iy);
    expect(figure?.bottom).toBeLessThanOrEqual(ground.y + iy + ih);
  });

  it('on — the figure stands on the surface the ground declares', () => {
    const nodes = renderPlace(sceneFor('on', { figure: id('book') }));
    const ground = boxOf(nodes, 'ground', prop('table'));
    const [figure] = figureBoxes(nodes, 'book');

    expect(figure?.bottom).toBeCloseTo(ground.top + (prop('table').surfaceY ?? 0), 1);
    expect(figure?.left).toBeGreaterThanOrEqual(ground.left);
    expect(figure?.right).toBeLessThanOrEqual(ground.right);
  });

  it('on — a ground with no surface takes a sensible height, not its box top', () => {
    const nodes = renderPlace(sceneFor('on', { figure: id('cup'), ground: id('tree') }));
    const ground = boxOf(nodes, 'ground', prop('tree'));
    const [figure] = figureBoxes(nodes, 'cup');

    expect(prop('tree').surfaceY).toBeNull();
    expect(figure?.bottom).toBeGreaterThan(ground.top);
  });

  it('at — the figure straddles the ground’s edge and stands nearer than it', () => {
    const nodes = renderPlace(sceneFor('at', { figure: id('woman') }));
    const ground = boxOf(nodes, 'ground', prop('shop'));
    const [figure] = figureBoxes(nodes, 'woman');

    expect(figure?.left).toBeLessThan(ground.left);
    expect(figure?.right).toBeGreaterThan(ground.left);
    expect(figure?.bottom).toBeGreaterThan(FLOOR);
  });

  it('under — the figure is beneath the ground and above the floor', () => {
    const nodes = renderPlace(sceneFor('under'));
    const ground = boxOf(nodes, 'ground', prop('table'));
    const [figure] = figureBoxes(nodes, 'cat');

    expect(figure?.top).toBeGreaterThan(ground.top + (prop('table').surfaceY ?? 0));
    expect(figure?.bottom).toBeLessThanOrEqual(FLOOR);
    expect(figure?.left).toBeGreaterThanOrEqual(ground.left);
    expect(figure?.right).toBeLessThanOrEqual(ground.right);
  });

  it('above — the figure clears the ground, and the gap is drawn', () => {
    const nodes = renderPlace(sceneFor('above', { figure: id('clock') }));
    const ground = boxOf(nodes, 'ground', prop('door'));
    const [figure] = figureBoxes(nodes, 'clock');
    const gap = find(nodes, 'mark-gap');

    expect(figure?.bottom).toBeLessThan(ground.top);
    expect(figure?.top).toBeGreaterThanOrEqual(0);
    expect(gap?.attrs['stroke-dasharray']).toBeTruthy();
  });

  it('below — the figure is lower than the ground’s level and clear of its body', () => {
    const nodes = renderPlace(sceneFor('below', { figure: id('ball') }));
    const ground = boxOf(nodes, 'ground', prop('table'));
    const [figure] = figureBoxes(nodes, 'ball');
    const level = find(nodes, 'mark-level');

    expect(figure?.top).toBeGreaterThan(ground.top);
    expect(figure?.left).toBeGreaterThan(ground.right);
    expect(Number(level?.attrs.y1)).toBeCloseTo(ground.top, 1);
    expect(find(nodes, 'mark-drop')).toBeDefined();
  });

  it('behind — the ground is drawn over the figure and hides most of it', () => {
    const nodes = renderPlace(sceneFor('behind', { figure: id('dog') }));
    const ground = boxOf(nodes, 'ground', prop('car'));
    const [figure] = figureBoxes(nodes, 'dog');

    expect(indexOf(nodes, 'figure-0')).toBeLessThan(indexOf(nodes, 'ground'));
    expect(figure?.bottom).toBeGreaterThan(ground.top);
    expect(figure?.top).toBeLessThan(ground.top);
    expect(placedAt(find(nodes, 'figure-0')).scale).toBeLessThan(1);
  });

  it('in front of — the figure is drawn over the ground, lower and larger', () => {
    const nodes = renderPlace(sceneFor('in front of', { figure: id('man') }));
    const ground = boxOf(nodes, 'ground', prop('shop'));
    const [figure] = figureBoxes(nodes, 'man');

    expect(indexOf(nodes, 'figure-0')).toBeGreaterThan(indexOf(nodes, 'ground'));
    expect(figure?.bottom).toBeGreaterThan(FLOOR);
    expect(figure?.bottom).toBeGreaterThan(ground.bottom);
    expect(placedAt(find(nodes, 'figure-0')).scale).toBeGreaterThan(1);
    expect(find(nodes, 'shadow-figure-0')).toBeDefined();
  });

  it('between — two grounds, and the figure in the space they leave', () => {
    const nodes = renderPlace(sceneFor('between', { figure: id('ball') }));
    const left = boxOf(nodes, 'ground', prop('box'));
    const right = boxOf(nodes, 'ground-2', prop('chair'));
    const [figure] = figureBoxes(nodes, 'ball');

    expect(figure?.left).toBeGreaterThan(left.right);
    expect(figure?.right).toBeLessThan(right.left);
  });

  it('between — both grounds are the same size and answer to the same word', () => {
    const nodes = renderPlace(sceneFor('between', { figure: id('ball') }));

    expect(placedAt(find(nodes, 'ground')).scale).toBe(placedAt(find(nodes, 'ground-2')).scale);
    expect(find(nodes, 'ground')?.attrs['data-node']).toBe('ground');
    expect(find(nodes, 'ground-2')?.attrs['data-node']).toBe('ground');
  });

  it('near — clear of the ground, further off than beside, with the gap measured', () => {
    const near = renderPlace(sceneFor('near'));
    const beside = renderPlace(sceneFor('beside', { ground: id('tree') }));
    const gapOf = (nodes: readonly SceneNode[]): number => {
      const ground = boxOf(nodes, 'ground', prop('tree'));
      const [figure] = figureBoxes(nodes, 'cat');
      return (figure?.left ?? 0) - ground.right;
    };

    expect(gapOf(near)).toBeGreaterThan(gapOf(beside));
    expect(find(near, 'mark-span')).toBeDefined();
    expect(find(beside, 'mark-span')).toBeUndefined();
  });

  it('beside — both stand on the floor, side by side, touching neither', () => {
    const nodes = renderPlace(sceneFor('beside', { figure: id('chair'), ground: id('table') }));
    const ground = boxOf(nodes, 'ground', prop('table'));
    const [figure] = figureBoxes(nodes, 'chair');

    expect(figure?.left).toBeGreaterThan(ground.right);
    expect(figure?.bottom).toBeCloseTo(FLOOR, 1);
    expect(ground.bottom).toBeCloseTo(FLOOR, 1);
  });

  it('here — the figure stands in the speaker’s own spot, and larger for being near', () => {
    const nodes = renderPlace(sceneFor('here', { figure: id('man') }));
    const [figure] = figureBoxes(nodes, 'man');
    const spot = find(nodes, 'mark-spot');

    expect(find(nodes, 'ground')).toBeUndefined();
    expect(spot).toBeDefined();
    expect(Number(spot?.attrs.cx)).toBeCloseTo(((figure?.left ?? 0) + (figure?.right ?? 0)) / 2, 0);
    expect(placedAt(find(nodes, 'figure-0')).scale).toBeGreaterThan(1);
  });

  it('there — away from the spot, smaller, with the distance pointed out', () => {
    const nodes = renderPlace(sceneFor('there', { figure: id('man') }));
    const [figure] = figureBoxes(nodes, 'man');
    const spot = find(nodes, 'mark-spot');

    expect(Number(spot?.attrs.cx)).toBeLessThan(figure?.left ?? 0);
    expect(placedAt(find(nodes, 'figure-0')).scale).toBeLessThan(1);
    expect(find(nodes, 'mark-there')).toBeDefined();
  });

  it('here and there put the figure at opposite sizes and distances', () => {
    const here = renderPlace(sceneFor('here', { figure: id('man') }));
    const there = renderPlace(sceneFor('there', { figure: id('man') }));

    expect(placedAt(find(here, 'figure-0')).scale).toBeGreaterThan(
      placedAt(find(there, 'figure-0')).scale,
    );
  });
});

/* ---- number ------------------------------------------------ */

describe('renderPlace — number', () => {
  const COUNTS: readonly FigureCount[] = [1, 2, 3];

  it('draws one node per copy, in a row, at every count', () => {
    for (const count of COUNTS) {
      const nodes = renderPlace(sceneFor('beside', { count }));
      const boxes = figureBoxes(nodes, 'cat');

      expect(boxes).toHaveLength(count);
      for (let i = 1; i < boxes.length; i += 1) {
        expect(boxes[i]?.left).toBeGreaterThan(boxes[i - 1]?.left ?? 0);
        expect(boxes[i]?.bottom).toBeCloseTo(boxes[i - 1]?.bottom ?? 0, 1);
      }
    }
  });

  it('in — never overflows the container, at any count', () => {
    const [ix, iy, iw, ih] = prop('box').inside ?? [0, 0, 0, 0];

    for (const count of COUNTS) {
      const nodes = renderPlace(sceneFor('in', { figure: id('ball'), count }));
      const ground = placedAt(find(nodes, 'ground'));

      for (const box of figureBoxes(nodes, 'ball')) {
        expect(box.left).toBeGreaterThanOrEqual(ground.x + ix);
        expect(box.right).toBeLessThanOrEqual(ground.x + ix + iw);
        expect(box.top).toBeGreaterThanOrEqual(ground.y + iy);
        expect(box.bottom).toBeLessThanOrEqual(ground.y + iy + ih);
      }
    }
  });

  it('in — a big figure still fits the container it is in', () => {
    const [ix, , iw] = prop('box').inside ?? [0, 0, 0, 0];
    const nodes = renderPlace(sceneFor('in', { figure: id('ball'), adjective: 'big', count: 3 }));
    const ground = placedAt(find(nodes, 'ground'));

    for (const box of figureBoxes(nodes, 'ball')) {
      expect(box.left).toBeGreaterThanOrEqual(ground.x + ix);
      expect(box.right).toBeLessThanOrEqual(ground.x + ix + iw);
    }
  });

  it('clamps rather than running off the stage, at every relation and count', () => {
    for (const relation of RELATIONS) {
      for (const count of COUNTS) {
        const nodes = renderPlace(sceneFor(relation, { figure: id('chair'), adjective: 'big', count }));

        for (const box of figureBoxes(nodes, 'chair')) {
          expect(box.left).toBeGreaterThanOrEqual(0);
          expect(box.right).toBeLessThanOrEqual(STAGE.width);
        }
      }
    }
  });
});

/* ---- article ----------------------------------------------- */

describe('renderPlace — article', () => {
  const ringOf = (nodes: readonly SceneNode[]): SceneNode | undefined =>
    find(find(nodes, 'figure-0')?.children ?? [], 'determiner');

  it('draws the indefinite dashed and the definite solid', () => {
    const indefinite = renderPlace(sceneFor('on', { determiner: 'a' }));
    const definite = renderPlace(sceneFor('on', { determiner: 'the' }));

    expect(ringOf(indefinite)?.attrs['stroke-dasharray']).toBeTruthy();
    expect(ringOf(definite)?.attrs['stroke-dasharray']).toBeUndefined();
    expect(ringOf(definite)?.attrs.stroke).toBe('var(--accent)');
  });

  it('says the word too — a difference in line style alone is not enough', () => {
    for (const determiner of ['a', 'the'] as const) {
      const nodes = renderPlace(sceneFor('on', { determiner }));

      expect(find(nodes, 'determiner-label')?.text).toBe(determiner);
    }
  });

  it('keeps the label on the stage even when the figure is at the top of it', () => {
    const nodes = renderPlace(sceneFor('above', { figure: id('clock') }));
    const label = find(nodes, 'determiner-label');

    expect(Number(label?.attrs.y)).toBeGreaterThan(0);
    expect(Number(label?.attrs.y)).toBeLessThan(STAGE.height);
  });

  it('drops both when there is more than one figure — two balls are not "a two balls"', () => {
    const nodes = renderPlace(sceneFor('on', { count: 2 }));

    expect(ringOf(nodes)).toBeUndefined();
    expect(find(nodes, 'determiner-label')).toBeUndefined();
  });
});

/* ---- adjective --------------------------------------------- */

describe('renderPlace — adjective', () => {
  const fillsOf = (nodes: readonly SceneNode[]): readonly string[] =>
    flatten(find(nodes, 'figure-0')?.children ?? [])
      .map((node) => String(node.attrs.fill ?? ''))
      .filter((fill) => fill !== '' && fill !== 'none');

  it('changes the fill for a colour and leaves the size alone', () => {
    const plain = renderPlace(sceneFor('on', { figure: id('ball') }));
    const red = renderPlace(sceneFor('on', { figure: id('ball'), adjective: 'red' }));

    expect(fillsOf(red)).toContain('var(--prop-red)');
    expect(fillsOf(plain)).not.toContain('var(--prop-red)');
    expect(placedAt(find(red, 'figure-0')).scale).toBe(placedAt(find(plain, 'figure-0')).scale);
  });

  it('changes the scale for a size and leaves the colour alone', () => {
    const plain = renderPlace(sceneFor('on', { figure: id('ball') }));
    const big = renderPlace(sceneFor('on', { figure: id('ball'), adjective: 'big' }));
    const small = renderPlace(sceneFor('on', { figure: id('ball'), adjective: 'small' }));

    expect(placedAt(find(big, 'figure-0')).scale).toBeGreaterThan(1);
    expect(placedAt(find(small, 'figure-0')).scale).toBeLessThan(1);
    expect(fillsOf(big)).toEqual(fillsOf(plain));
  });

  it('offers no adjective that changes nothing', () => {
    for (const [name, effect] of Object.entries(PLACE_ADJECTIVES)) {
      expect(effect.fill !== null || effect.scale !== 1).toBe(true);
      expect(placeProblem(sceneFor('on', { adjective: name }))).toBeNull();
    }
  });
});

/* ---- the animation contract -------------------------------- */

describe('renderPlace — node identity', () => {
  it('names every figure the same way whatever the relation is', () => {
    const ids = RELATIONS.map((relation) =>
      renderPlace(sceneFor(relation, { count: 3 }))
        .filter((node) => node.id.startsWith('figure-'))
        .map((node) => node.id),
    );

    for (const set of ids) {
      expect(set).toEqual(['figure-0', 'figure-1', 'figure-2']);
    }
  });

  it('keeps the ground and the floor named the same across a relation change', () => {
    for (const relation of RELATIONS) {
      const nodes = renderPlace(sceneFor(relation));
      const names = nodes.map((node) => node.id);

      expect(names).toContain('floor');
      if (GROUND_FOR[relation] !== null) expect(names).toContain('ground');
    }
  });

  it('gives every node in a scene a distinct name at the level it is drawn', () => {
    for (const relation of RELATIONS) {
      const nodes = renderPlace(sceneFor(relation, { count: 3 }));
      const names = nodes.map((node) => node.id);

      expect(new Set(names).size).toBe(names.length);
    }
  });
});

/* ---- the house rules --------------------------------------- */

describe('renderPlace — house rules', () => {
  const COLOUR_ATTRS = ['fill', 'stroke'] as const;

  it('never writes a literal colour', () => {
    for (const relation of RELATIONS) {
      for (const node of flatten(renderPlace(sceneFor(relation, { count: 2 })))) {
        for (const attr of COLOUR_ATTRS) {
          const value = String(node.attrs[attr] ?? '');
          if (value === '' || value === 'none') continue;
          expect(value).toMatch(/^var\(--[a-z0-9-]+\)$/);
        }
      }
    }
  });

  it('rounds every coordinate it produces', () => {
    for (const relation of RELATIONS) {
      for (const node of flatten(renderPlace(sceneFor(relation, { count: 3 })))) {
        for (const value of Object.values(node.attrs)) {
          if (typeof value !== 'number') continue;
          expect(Math.round(value * 10) / 10).toBe(value);
        }
      }
    }
  });

  it('draws the floor first, so nothing in the scene is drawn under the room', () => {
    for (const relation of RELATIONS) {
      expect(renderPlace(sceneFor(relation))[0]?.id).toBe('floor');
    }
  });

  it('gives the ground a shadow, so it does not read as a sticker', () => {
    const nodes = renderPlace(sceneFor('beside'));
    const ground = boxOf(nodes, 'ground', prop('table'));
    const shadow = find(nodes, 'shadow-ground');

    expect(Number(shadow?.attrs.cx)).toBeCloseTo((ground.left + ground.right) / 2, 0);
  });
});
