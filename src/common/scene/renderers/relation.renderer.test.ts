import { FLOOR, FLOOR_INSET, STAGE } from 'common/scene/layout';
import {
  RELATIONS,
  glyphFor,
  relationProblem,
  renderRelation,
} from 'common/scene/renderers/relation.renderer';
import { propFor } from 'common/scene/props/index';
import type { Connective, Prop, PropId, RelationSpec, SceneNode } from 'common/scene/types';

/* ============================================================
   relation.renderer.test.ts

   These are the weakest pictures in the product, so most of
   what is asserted here is that they are not each other: the
   two that share the cause arrow point opposite ways, the two
   that share a gathering are not one drawing, and `like` and
   `as` — the pair the engine exists to keep apart — have
   nothing in common but their layout.
   ============================================================ */

const id = (value: string): PropId => value as PropId;

const CONNECTIVES = Object.keys(RELATIONS) as readonly Connective[];

const spec = (connective: Connective, over: Partial<RelationSpec> = {}): RelationSpec => ({
  kind: 'relation',
  left: id('cup'),
  right: id('book'),
  connective,
  glyph: glyphFor(connective),
  ...over,
});

/* ---- reading the tree -------------------------------------- */

const flatten = (nodes: readonly SceneNode[]): readonly SceneNode[] =>
  nodes.flatMap((node) => [node, ...flatten(node.children ?? [])]);

const find = (nodes: readonly SceneNode[], nodeId: string): SceneNode | undefined =>
  flatten(nodes).find((node) => node.id === nodeId);

const has = (nodes: readonly SceneNode[], nodeId: string): boolean =>
  find(nodes, nodeId) !== undefined;

const glyphIds = (nodes: readonly SceneNode[]): readonly string[] =>
  flatten(nodes)
    .map((node) => node.id)
    .filter((nodeId) => nodeId.startsWith('glyph'));

function placedAt(node: SceneNode | undefined): { x: number; y: number; scale: number } {
  const transform = String(node?.attrs.transform ?? '');
  const move = /translate\(([-\d.]+),([-\d.]+)\)/.exec(transform);
  const scale = /scale\(([\d.]+)\)/.exec(transform);

  return { x: Number(move?.[1] ?? 0), y: Number(move?.[2] ?? 0), scale: Number(scale?.[1] ?? 1) };
}

type Box = { readonly x: number; readonly y: number; readonly w: number; readonly h: number };

const prop = (name: string): Prop => {
  const found = propFor(id(name));
  if (!found) throw new Error(`the test asked for a prop that is not drawn: ${name}`);
  return found;
};

function boxOf(nodes: readonly SceneNode[], nodeId: string, of: Prop): Box {
  const at = placedAt(find(nodes, nodeId));
  return { x: at.x, y: at.y, w: of.box.w * at.scale, h: of.box.h * at.scale };
}

/** Which way an arrow points, read out of its shaft. */
function direction(nodes: readonly SceneNode[], nodeId: string): number {
  const d = String(find(nodes, `${nodeId}-shaft`)?.attrs.d ?? '');
  const numbers = d.match(/-?[\d.]+/g)?.map(Number) ?? [];
  const [x1 = 0, , x2 = 0] = numbers;

  return Math.sign(x2 - x1);
}

/* ---- the table --------------------------------------------- */

describe('the relation table', () => {
  it('covers all eleven connectives', () => {
    expect(CONNECTIVES).toHaveLength(11);
    expect(CONNECTIVES).toEqual(
      expect.arrayContaining([
        'and', 'but', 'or', 'because', 'so',
        'about', 'for', 'with', 'as', 'like', 'per',
      ]),
    );
  });

  it('gives every connective a word in both languages', () => {
    for (const connective of CONNECTIVES) {
      const word = RELATIONS[connective].word;

      expect(word.en).toBe(connective);
      expect(word.ta.trim().length).toBeGreaterThan(0);
    }
  });

  it('keeps `as` off the Tamil word for `like`', () => {
    /* The source glosses `as` as போல, which is what போன்ற means: like. A
       lexicon that hands both the same word teaches the confusion this
       renderer exists to prevent. */
    expect(RELATIONS.as.word.ta).not.toBe(RELATIONS.like.word.ta);
  });
});

describe('relationProblem', () => {
  it('says nothing about a scene that can be drawn', () => {
    for (const connective of CONNECTIVES) {
      expect(relationProblem(spec(connective))).toBeNull();
    }
  });

  it('refuses a glyph the relation is not drawn as', () => {
    expect(relationProblem(spec('because', { glyph: 'brace' }))).toMatch(/cause/);
    expect(renderRelation(spec('because', { glyph: 'brace' }))).toEqual([]);
  });

  it('refuses an item nobody drew', () => {
    expect(relationProblem(spec('and', { left: id('rocket') }))).toMatch(/rocket/);
    expect(relationProblem(spec('and', { right: id('rocket') }))).toMatch(/rocket/);
  });
});

/* ---- every relation draws ---------------------------------- */

describe('renderRelation — all eleven', () => {
  it('draws both items and a glyph for every relation', () => {
    for (const connective of CONNECTIVES) {
      const nodes = renderRelation(spec(connective));
      const drawn = flatten(nodes).map((node) => String(node.attrs['data-node']));

      expect(drawn).toContain('left');
      expect(drawn).toContain('right');
      expect(glyphIds(nodes).length).toBeGreaterThan(0);
    }
  });

  it('labels every one of them, in both languages', () => {
    for (const connective of CONNECTIVES) {
      const nodes = renderRelation(spec(connective));

      expect(find(nodes, 'label')?.text).toBe(connective);
      expect(find(nodes, 'label-ta')?.text).toBe(RELATIONS[connective].word.ta);
      expect(find(nodes, 'label-ta')?.attrs['xml:lang']).toBe('ta');
    }
  });

  it('draws no two relations the same', () => {
    /* The whole risk of this renderer: eleven abstractions and eight glyphs.
       Two that came out as one drawing would be two lessons teaching one
       thing. */
    const drawings = CONNECTIVES.map((connective) =>
      JSON.stringify(
        flatten(renderRelation(spec(connective))).filter(
          (node) => !node.id.startsWith('label'),
        ),
      ),
    );

    expect(new Set(drawings).size).toBe(CONNECTIVES.length);
  });
});

/* ---- the pairs that must not be confusable ----------------- */

describe('renderRelation — because and so', () => {
  it('points them opposite ways', () => {
    const because = direction(renderRelation(spec('because')), 'glyph-cause');
    const so = direction(renderRelation(spec('so')), 'glyph-cause');

    expect(because).toBe(-1);
    expect(so).toBe(1);
    expect(because).toBe(-so);
  });

  it('leaves everything else about them identical', () => {
    const without = (connective: Connective): readonly string[] =>
      flatten(renderRelation(spec(connective)))
        .filter((node) => !node.id.startsWith('glyph') && !node.id.startsWith('label'))
        .map((node) => `${node.id} ${node.attrs.transform ?? ''}`);

    expect(without('because')).toEqual(without('so'));
  });
});

describe('renderRelation — like and as', () => {
  it('gives them different glyphs', () => {
    expect(glyphFor('like')).toBe('similarity');
    expect(glyphFor('as')).toBe('role');
    expect(glyphIds(renderRelation(spec('like')))).not.toEqual(
      glyphIds(renderRelation(spec('as'))),
    );
  });

  it('draws similarity as an approximation between two separate things', () => {
    const nodes = renderRelation(spec('like'));

    expect(find(nodes, 'glyph-similarity')?.text).toBe('≈');
    expect(has(nodes, 'glyph-similarity-left')).toBe(true);
    expect(has(nodes, 'glyph-similarity-right')).toBe(true);
  });

  it('draws identity as an equals sign and a role badge naming the right item', () => {
    const nodes = renderRelation(spec('as', { left: id('man'), right: id('car') }));

    expect(find(nodes, 'glyph-role-equals')?.text).toBe('=');
    expect(find(nodes, 'glyph-role-name')?.text).toBe(prop('car').word.en.singular);
  });

  it('puts the badge over the one who is in the role', () => {
    const nodes = renderRelation(spec('as', { left: id('man'), right: id('car') }));
    const left = boxOf(nodes, 'left', prop('man'));
    const badge = find(nodes, 'glyph-role-badge');

    expect(Number(badge?.attrs.y) + Number(badge?.attrs.height)).toBeLessThan(left.y);
  });
});

describe('renderRelation — and and with', () => {
  it('gathers both under one brace', () => {
    for (const connective of ['and', 'with'] as const) {
      const nodes = renderRelation(spec(connective));
      const left = boxOf(nodes, 'left', prop('cup'));
      const right = boxOf(nodes, 'right', prop('book'));
      const brace = String(find(nodes, 'glyph-brace')?.attrs.d ?? '');
      const [x0 = 0] = brace.match(/-?[\d.]+/g)?.map(Number) ?? [];

      expect(x0).toBeLessThanOrEqual(left.x);
      expect(brace).toContain(`H${Math.round((right.x + right.w + 10) * 10) / 10}`);
    }
  });

  it('adds the journey to `with`, which is what it has over `and`', () => {
    expect(has(renderRelation(spec('with')), 'glyph-together')).toBe(true);
    expect(has(renderRelation(spec('and')), 'glyph-together')).toBe(false);
  });
});

describe('renderRelation — the rest', () => {
  it('sets the two sides of `but` against a divider', () => {
    const nodes = renderRelation(spec('but'));
    const left = boxOf(nodes, 'left', prop('cup'));
    const right = boxOf(nodes, 'right', prop('book'));
    const divider = Number(find(nodes, 'glyph-divider')?.attrs.x1);

    expect(divider).toBeGreaterThan(left.x + left.w);
    expect(divider).toBeLessThan(right.x);
    expect(has(nodes, 'glyph-contrast')).toBe(true);
  });

  it('branches `or` to two options and draws neither as taken', () => {
    const nodes = renderRelation(spec('or'));

    expect(has(nodes, 'glyph-branch-high')).toBe(true);
    expect(has(nodes, 'glyph-branch-low')).toBe(true);
    expect(Number(find(nodes, 'left')?.attrs.opacity)).toBeLessThan(1);
    expect(Number(find(nodes, 'right')?.attrs.opacity)).toBeLessThan(1);
    /* Two options at one height are a row, not a choice. */
    expect(placedAt(find(nodes, 'left')).y).not.toBeCloseTo(placedAt(find(nodes, 'right')).y, 0);
  });

  it('rings the one `for` benefits, and points at them', () => {
    const nodes = renderRelation(spec('for'));
    const right = boxOf(nodes, 'right', prop('book'));
    const ring = find(nodes, 'glyph-for-ring');

    expect(direction(nodes, 'glyph-cause')).toBe(1);
    expect(Number(ring?.attrs.x)).toBeLessThan(right.x);
    expect(Number(ring?.attrs.x) + Number(ring?.attrs.width)).toBeGreaterThan(right.x + right.w);
  });

  it('puts the topic of `about` inside the bubble, over the thing itself', () => {
    const nodes = renderRelation(spec('about'));
    const bubble = find(nodes, 'glyph-bubble');
    const topic = boxOf(nodes, 'right', prop('book'));
    const thing = boxOf(nodes, 'left', prop('cup'));

    expect(topic.x).toBeGreaterThanOrEqual(Number(bubble?.attrs.x));
    expect(topic.y).toBeGreaterThanOrEqual(Number(bubble?.attrs.y));
    expect(topic.x + topic.w).toBeLessThanOrEqual(
      Number(bubble?.attrs.x) + Number(bubble?.attrs.width),
    );
    expect(topic.y + topic.h).toBeLessThanOrEqual(
      Number(bubble?.attrs.y) + Number(bubble?.attrs.height),
    );
    expect(thing.y).toBeGreaterThan(topic.y + topic.h);
  });

  it('repeats the pair three times for `per`', () => {
    const nodes = renderRelation(spec('per'));

    for (let row = 0; row < 3; row += 1) {
      expect(has(nodes, `left-${row}`)).toBe(true);
      expect(has(nodes, `right-${row}`)).toBe(true);
      expect(find(nodes, `glyph-rate-equals-${row}`)?.text).toBe('=');
    }
    expect(has(nodes, 'left-3')).toBe(false);
    /* Three rows down the stage, not three things in a row. */
    expect(placedAt(find(nodes, 'left-0')).y).toBeLessThan(placedAt(find(nodes, 'left-2')).y);
  });
});

/* ---- the rules every renderer keeps ------------------------ */

describe('renderRelation — the house rules', () => {
  it('normalises two items of very different sizes towards one height', () => {
    const nodes = renderRelation(spec('and', { left: id('man'), right: id('cup') }));
    const man = boxOf(nodes, 'left', prop('man'));
    const cup = boxOf(nodes, 'right', prop('cup'));
    const natural = prop('man').box.h / prop('cup').box.h;

    expect(natural).toBeGreaterThan(2.5);
    /* Not to equality: the cup would have to be drawn at nearly twice life
       size, and a cup the height of a man is a barrel. The cap is 1.4, so what
       is left of the difference is what the cap left. */
    expect(man.h / cup.h).toBeLessThanOrEqual(1.4);
    expect(man.h / cup.h).toBeLessThan(natural);
  });

  it('stands the pair on the floor where there is one, and draws none where there is not', () => {
    const nodes = renderRelation(spec('and'));

    expect(has(nodes, 'floor')).toBe(true);
    expect(boxOf(nodes, 'left', prop('cup')).y + boxOf(nodes, 'left', prop('cup')).h).toBeCloseTo(
      FLOOR,
      0,
    );
    expect(has(nodes, 'shadow-left')).toBe(true);
    expect(has(renderRelation(spec('per')), 'floor')).toBe(false);
    expect(has(renderRelation(spec('per')), 'shadow-left-0')).toBe(false);
  });

  it('keeps every item on the stage, for every relation and both orders', () => {
    for (const connective of CONNECTIVES) {
      for (const [left, right] of [['man', 'ball'], ['ball', 'tree'], ['tree', 'man']] as const) {
        const nodes = renderRelation(spec(connective, { left: id(left), right: id(right) }));

        for (const item of flatten(nodes).filter((node) =>
          /^(left|right)(-\d)?$/.test(node.id),
        )) {
          const of = item.id.startsWith('left') ? prop(left) : prop(right);
          const box = boxOf(nodes, item.id, of);

          expect(box.x).toBeGreaterThanOrEqual(FLOOR_INSET - 0.1);
          expect(box.x + box.w).toBeLessThanOrEqual(STAGE.width - FLOOR_INSET + 0.1);
          expect(box.y).toBeGreaterThanOrEqual(-0.1);
          expect(box.y + box.h).toBeLessThanOrEqual(STAGE.height + 0.1);
        }
      }
    }
  });

  it('names no literal colour', () => {
    for (const connective of CONNECTIVES) {
      for (const node of flatten(renderRelation(spec(connective)))) {
        for (const [, value] of Object.entries(node.attrs)) {
          if (typeof value !== 'string') continue;
          expect(value).not.toMatch(/#[0-9a-f]{3}|rgb\(/i);
        }
      }
    }
  });

  it('rounds every coordinate it draws', () => {
    for (const connective of CONNECTIVES) {
      for (const node of flatten(renderRelation(spec(connective)))) {
        for (const [key, value] of Object.entries(node.attrs)) {
          if (typeof value !== 'number') continue;
          if (!/^(x|y|cx|cy|x1|y1|x2|y2|width|height|r|rx|ry)$/.test(key)) continue;
          expect(Math.round(value * 10) / 10).toBe(value);
        }
      }
    }
  });

  it('gives every top-level node a stable id and both items a role', () => {
    const nodes = renderRelation(spec('and'));
    const ids = nodes.map((node) => node.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(find(nodes, 'left')?.attrs['data-node']).toBe('left');
    expect(find(nodes, 'right')?.attrs['data-node']).toBe('right');
  });
});
