import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ACTORS, PROPS, PROP_IDS, propFor } from 'common/scene/props/index';
import type { Prop, SceneNode } from 'common/scene/types';

const ALL = Object.values(PROPS);

const TAMIL_CASES = ['nominative', 'accusative', 'dative', 'locative', 'ablative'] as const;

/* Every coordinate a node puts on the page.

   The path parser reads commands rather than scraping numbers: an arc is
   `A rx ry rotation large-arc sweep x y`, and pairing its numbers off blindly
   reads the sweep flag and the x as a point. That is what this test did first,
   and it reported the dog as drawn outside its own box when the dog was fine. */
const pointsFromPath = (d: string): readonly (readonly [number, number])[] => {
  const points: (readonly [number, number])[] = [];
  let cursorX = 0;
  let cursorY = 0;

  for (const [, letter, rest] of d.matchAll(/([A-Za-z])([^A-Za-z]*)/g)) {
    const numbers = (rest ?? '').trim().split(/[\s,]+/).filter(Boolean).map(Number);
    const command = (letter ?? '').toUpperCase();

    if (command === 'Z') continue;
    if (command === 'H') {
      for (const x of numbers) points.push([(cursorX = x), cursorY]);
      continue;
    }
    if (command === 'V') {
      for (const y of numbers) points.push([cursorX, (cursorY = y)]);
      continue;
    }
    /* An arc's point is its last two numbers; everything before is radii and
       flags. Everything else comes in x,y pairs. */
    const pairs = command === 'A' ? [numbers.slice(-2)] : chunk(numbers, 2);
    for (const pair of pairs) {
      const [x, y] = pair;
      if (x === undefined || y === undefined) continue;
      cursorX = x;
      cursorY = y;
      points.push([x, y]);
    }
  }
  return points;
};

function chunk(values: readonly number[], size: number): readonly number[][] {
  const out: number[][] = [];
  for (let i = 0; i + size <= values.length; i += size) out.push(values.slice(i, i + size));
  return out;
}

const pointsOf = (node: SceneNode): readonly (readonly [number, number])[] => {
  const n = (key: string): number => Number(node.attrs[key] ?? 0);
  switch (node.tag) {
    case 'rect':
      return [
        [n('x'), n('y')],
        [n('x') + n('width'), n('y') + n('height')],
      ];
    case 'circle':
      return [
        [n('cx') - n('r'), n('cy') - n('r')],
        [n('cx') + n('r'), n('cy') + n('r')],
      ];
    case 'ellipse':
      return [
        [n('cx') - n('rx'), n('cy') - n('ry')],
        [n('cx') + n('rx'), n('cy') + n('ry')],
      ];
    case 'line':
      return [
        [n('x1'), n('y1')],
        [n('x2'), n('y2')],
      ];
    case 'path':
      return pointsFromPath(String(node.attrs['d']));
    default:
      return [];
  }
};

/* Every path in the library is absolute, so a point here really is a point on
   the page. The slack allows for a stroke that overhangs its own outline; it
   is not there to excuse a prop drawn at stage coordinates. */
const withinBox = (prop: Prop, slack = 8): boolean =>
  prop
    .draw()
    .flatMap(pointsOf)
    .every(
      ([x, y]) =>
        x >= -slack && y >= -slack && x <= prop.box.w + slack && y <= prop.box.h + slack,
    );

describe('the prop library', () => {
  it('has sixteen props, and the registry lists every one', () => {
    expect(ALL).toHaveLength(16);
    expect(PROP_IDS).toHaveLength(16);
    expect(new Set(PROP_IDS).size).toBe(16);
  });

  it('resolves every id, and nothing else', () => {
    for (const propId of PROP_IDS) {
      expect(propFor(propId)?.id).toBe(propId);
    }
    expect(propFor('rocket')).toBeUndefined();
    expect(propFor(null)).toBeUndefined();
    expect(propFor(undefined)).toBeUndefined();
  });

  it('keys the registry by the prop’s own id', () => {
    for (const [key, prop] of Object.entries(PROPS)) {
      expect(String(prop.id)).toBe(key);
    }
  });

  describe('words', () => {
    it.each(Object.keys(PROPS))('%s has English singular and plural', (key) => {
      const prop = PROPS[key] as Prop;

      expect(prop.word.en.singular.trim().length).toBeGreaterThan(0);
      expect(prop.word.en.plural.trim().length).toBeGreaterThan(0);
    });

    it.each(Object.keys(PROPS))('%s declines in all five Tamil cases', (key) => {
      const prop = PROPS[key] as Prop;

      for (const grammaticalCase of TAMIL_CASES) {
        expect(prop.word.ta[grammaticalCase].trim().length).toBeGreaterThan(0);
      }
      /* Five distinct forms: a case copied from another is a case nobody
         wrote. */
      expect(new Set(TAMIL_CASES.map((c) => prop.word.ta[c])).size).toBe(5);
    });

    it('gives living things the -இடம் locative, not -இல்', () => {
      /* The vowel is written as a SIGN here, not as the independent letter:
         பூனை + இடம் is பூனையிடம், where the இ is ி on the ய. Matching the
         independent இ (U+0B87) finds nothing — which is what this test did
         first, and it was the test that was wrong, not the words. */
      for (const actor of ACTORS) {
        expect(actor.word.ta.locative).toMatch(/[ிஇ]டம்$/);
        expect(actor.word.ta.ablative).toMatch(/[ிஇ]டமிருந்து$/);
      }
    });
  });

  describe('geometry', () => {
    it.each(Object.keys(PROPS))('%s draws inside its own box', (key) => {
      expect(withinBox(PROPS[key] as Prop)).toBe(true);
    });

    it.each(Object.keys(PROPS))('%s declares a box with real dimensions', (key) => {
      const prop = PROPS[key] as Prop;

      expect(prop.box.w).toBeGreaterThan(0);
      expect(prop.box.h).toBeGreaterThan(0);
    });

    it('puts a surface inside the box it belongs to, never at the very top', () => {
      for (const prop of ALL) {
        if (prop.surfaceY === null) continue;
        expect(prop.surfaceY).toBeGreaterThanOrEqual(0);
        expect(prop.surfaceY).toBeLessThan(prop.box.h);
      }
    });

    it('gives the table a surface below its box top, so nothing floats', () => {
      const table = PROPS['table'] as Prop;

      /* The tabletop is 16 thick; the surface is inside that thickness. */
      expect(table.surfaceY).toBe(14);
    });

    it('keeps every `inside` rectangle within its prop', () => {
      for (const prop of ALL) {
        if (!prop.inside) continue;
        const [x, y, w, h] = prop.inside;
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x + w).toBeLessThanOrEqual(prop.box.w);
        expect(y + h).toBeLessThanOrEqual(prop.box.h);
      }
    });

    it('makes the box big enough inside for the ball at full size', () => {
      const boxProp = PROPS['box'] as Prop;
      const ballProp = PROPS['ball'] as Prop;
      const [, , w, h] = boxProp.inside ?? [0, 0, 0, 0];

      expect(w).toBeGreaterThanOrEqual(ballProp.box.w);
      expect(h).toBeGreaterThanOrEqual(ballProp.box.h);
    });

    it('says which props have room beneath them', () => {
      expect((PROPS['table'] as Prop).clearance).toBe(true);
      expect((PROPS['chair'] as Prop).clearance).toBe(true);
      /* A box sits flat on the floor: "under the box" has nowhere to go. */
      expect((PROPS['box'] as Prop).clearance).toBe(false);
    });
  });

  describe('anchors', () => {
    it('gives every actor a mouth, an eye and a foot', () => {
      for (const actor of ACTORS) {
        expect(actor.anchors.mouth).toBeDefined();
        expect(actor.anchors.eye).toBeDefined();
        expect(actor.anchors.foot).toBeDefined();
      }
    });

    it('gives the people a hand as well — they are the ones who give and throw', () => {
      for (const personId of ['man', 'woman']) {
        expect((PROPS[personId] as Prop).anchors.hand).toBeDefined();
      }
    });

    it('keeps every anchor inside the actor’s box', () => {
      for (const actor of ACTORS) {
        for (const [name, point] of Object.entries(actor.anchors)) {
          const [x, y] = point as readonly [number, number];
          expect({ name, x, y }).toMatchObject({ name });
          expect(x).toBeGreaterThanOrEqual(0);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(actor.box.w);
          expect(y).toBeLessThanOrEqual(actor.box.h);
        }
      }
    });

    it('puts an animal’s mouth ahead of its eye — they face right in profile', () => {
      for (const animal of [PROPS['cat'], PROPS['dog']] as Prop[]) {
        const mouth = animal.anchors.mouth as readonly [number, number];
        const eye = animal.anchors.eye as readonly [number, number];

        expect(mouth[0]).toBeGreaterThan(eye[0]);
      }
    });

    it('puts a person’s mouth below their eye — they face the reader', () => {
      /* The animals are drawn in profile and the people front-on, so "ahead"
         means something different for each. Asserting one rule for both was
         how this test first failed. */
      for (const personId of ['man', 'woman']) {
        const person = PROPS[personId] as Prop;
        const mouth = person.anchors.mouth as readonly [number, number];
        const eye = person.anchors.eye as readonly [number, number];

        expect(mouth[1]).toBeGreaterThan(eye[1]);
      }
    });

    it('gives objects no anchors', () => {
      for (const prop of ALL) {
        if (ACTORS.includes(prop)) continue;
        expect(Object.keys(prop.anchors)).toEqual([]);
      }
    });
  });

  describe('recolouring', () => {
    it.each(Object.keys(PROPS))('%s recolours without changing shape', (key) => {
      const prop = PROPS[key] as Prop;
      const plain = prop.draw();
      const red = prop.draw('var(--accent)');

      expect(red).toHaveLength(plain.length);
      expect(red.map((n) => n.tag)).toEqual(plain.map((n) => n.tag));
      expect(red.map((n) => n.id)).toEqual(plain.map((n) => n.id));

      /* Everything except the fills is identical. */
      const withoutFill = (nodes: readonly SceneNode[]): unknown =>
        nodes.map(({ attrs, ...rest }) => ({
          ...rest,
          attrs: Object.fromEntries(
            Object.entries(attrs).filter(([key]) => key !== 'fill' && key !== 'stroke'),
          ),
        }));
      expect(withoutFill(red)).toEqual(withoutFill(plain));
    });

    it('actually changes something when recoloured', () => {
      for (const prop of ALL) {
        /* Not a colour any prop already defaults to: the apple defaults to
           --prop-red, so recolouring it red proved nothing. */
        expect(JSON.stringify(prop.draw('var(--accent)'))).not.toEqual(
          JSON.stringify(prop.draw()),
        );
      }
    });
  });

  describe('colour', () => {
    it('names no literal colour — every fill is a token', () => {
      for (const prop of ALL) {
        expect(JSON.stringify(prop.draw())).not.toMatch(/#[0-9a-f]{3,8}|rgba?\(/i);
      }
    });

    it('uses only tokens that exist in the theme', () => {
      const css = readFileSync(join(__dirname, '..', '..', '..', 'theme', 'colours.css'), 'utf8');
      const declared = new Set([...css.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1]));

      for (const prop of ALL) {
        for (const [, token] of JSON.stringify(prop.draw()).matchAll(/var\((--[a-z0-9-]+)\)/g)) {
          expect(declared.has(token)).toBe(true);
        }
      }
    });

    it('declares the illustrative colours once, so they do not follow the scheme', () => {
      const css = readFileSync(join(__dirname, '..', '..', '..', 'theme', 'colours.css'), 'utf8');
      const dark = css.slice(css.indexOf(':root[data-theme="dark"]'));

      expect(dark).not.toMatch(/--prop-/);
    });
  });

  describe('against the content lexicon', () => {
    /* The lexicon and the registry are two lists of the same props: the
       content layer needs the words to validate a lesson, and the scene layer
       needs them to build a sentence. The scene engine may not import from
       common/api, so they are separate files — and this is what keeps them
       from drifting. */
    const lexicon = JSON.parse(
      readFileSync(
        join(__dirname, '..', '..', '..', 'content', 'lexicon', 'props.json'),
        'utf8',
      ),
    ) as readonly { id: string; word: Prop['word'] }[];

    it('covers exactly the same props', () => {
      expect(lexicon.map((p) => p.id).sort()).toEqual([...PROP_IDS].sort());
    });

    it('says the same words in both places', () => {
      for (const entry of lexicon) {
        expect(PROPS[entry.id]?.word).toEqual(entry.word);
      }
    });
  });
});
