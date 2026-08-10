import { STAGE } from 'common/scene/layout';
import {
  NOW,
  TIME_RELATIONS,
  renderTimeline,
  timelineProblem,
  xAt,
} from 'common/scene/renderers/timeline.renderer';
import type {
  Bilingual,
  NonEmptyString,
  SceneNode,
  TenseId,
  TimeRelation,
  TimelineMark,
  TimelineSpec,
} from 'common/scene/types';

/* ============================================================
   timeline.renderer.test.ts

   The claim this renderer makes is that twelve tenses and nine
   prepositions are three pictures — a point, a stretch and an
   edge — so most of these assertions are about which of the
   three came out, and where on the axis it landed.
   ============================================================ */

const bi = (en: string, ta: string): Bilingual => ({
  en: en as NonEmptyString,
  ta: ta as NonEmptyString,
});

const WHENS = ['past', 'present', 'future'] as const;
const ASPECTS = ['simple', 'continuous', 'perfect', 'perfect-continuous'] as const;

const TENSES: readonly TenseId[] = WHENS.flatMap((when) =>
  ASPECTS.map((aspect) => `${when}-${aspect}` as TenseId),
);

const RELATIONS = Object.keys(TIME_RELATIONS) as readonly TimeRelation[];

const mark = (
  id: string,
  kind: TimelineMark['kind'],
  at: number,
  to: number | null = null,
  label: Bilingual | null = null,
): TimelineMark => ({ id, kind, at, to, label });

/** Marks that are the shape each preposition means. */
const MARKS_FOR: Readonly<Record<TimeRelation, readonly TimelineMark[]>> = {
  at: [mark('hour', 'point', 0.62, null, bi('5 PM', 'மாலை 5'))],
  on: [mark('day', 'point', 0.4, null, bi('Monday', 'திங்கள்'))],
  in: [mark('year', 'container', 0.14, 0.34, bi('2000', '2000'))],
  before: [mark('span', 'band', 0.16, 0.44, bi('before 8', '8 முன்')), mark('edge', 'boundary', 0.44)],
  after: [mark('span', 'band', 0.5, 0.82, bi('after lunch', 'பின்')), mark('edge', 'boundary', 0.5)],
  by: [mark('span', 'band', 0.4, 0.74, bi('by 6 PM', '6 க்குள்')), mark('edge', 'boundary', 0.74)],
  since: [mark('span', 'band', 0.18, 0.9, bi('since 2010', '2010 முதல்')), mark('edge', 'boundary', 0.18)],
  during: [mark('span', 'band', 0.16, 0.46, bi('the movie', 'படம்')), mark('nap', 'point', 0.3)],
  until: [mark('span', 'band', 0.5, 0.78, bi('until I come', 'வரும் வரை')), mark('edge', 'boundary', 0.78)],
};

const spec = (over: Partial<TimelineSpec> = {}): TimelineSpec => ({
  kind: 'timeline',
  tense: 'past-simple',
  marks: [],
  relation: null,
  ...over,
});

const sceneFor = (relation: TimeRelation): TimelineSpec =>
  spec({ marks: MARKS_FOR[relation], relation, tense: relation === 'since' ? 'present-perfect' : 'past-simple' });

/* ---- reading the tree -------------------------------------- */

const find = (nodes: readonly SceneNode[], id: string): SceneNode | undefined =>
  nodes.find((node) => node.id === id);

const has = (nodes: readonly SceneNode[], id: string): boolean => find(nodes, id) !== undefined;

const num = (node: SceneNode | undefined, attr: string): number => Number(node?.attrs[attr]);

type Span = { readonly x0: number; readonly x1: number };

const spanOf = (node: SceneNode | undefined): Span => ({
  x0: num(node, 'x'),
  x1: num(node, 'x') + num(node, 'width'),
});

/* ---- the axis ---------------------------------------------- */

describe('renderTimeline — the axis', () => {
  it('puts now at the same place in every scene there is', () => {
    const scenes = [
      ...TENSES.map((tense) => renderTimeline(spec({ tense }))),
      ...RELATIONS.map((relation) => renderTimeline(sceneFor(relation))),
    ];

    for (const nodes of scenes) {
      expect(num(find(nodes, 'now'), 'x1')).toBe(xAt(NOW));
      expect(num(find(nodes, 'now'), 'x1')).toBe(num(find(nodes, 'now'), 'x2'));
    }
  });

  it('draws now last, so a stretch spanning it cannot hide it', () => {
    const nodes = renderTimeline(spec({ tense: 'present-continuous' }));
    const band = spanOf(find(nodes, 'tense-band'));

    expect(band.x0).toBeLessThan(xAt(NOW));
    expect(band.x1).toBeGreaterThan(xAt(NOW));
    expect(nodes.findIndex((node) => node.id === 'now')).toBeGreaterThan(
      nodes.findIndex((node) => node.id === 'tense-band'),
    );
  });

  it('says which end is which', () => {
    const nodes = renderTimeline(spec());

    expect(find(nodes, 'past-label')?.text).toBe('past');
    expect(find(nodes, 'future-label')?.text).toBe('future');
    expect(find(nodes, 'now-label')?.text).toBe('now');
  });

  it('measures every mark as a fraction, so nothing knows the axis is 600 wide', () => {
    expect(xAt(0)).toBeLessThan(xAt(NOW));
    expect(xAt(1)).toBeGreaterThan(xAt(NOW));
    expect(xAt(NOW)).toBe((xAt(0) + xAt(1)) / 2);
  });
});

/* ---- twelve tenses ----------------------------------------- */

describe('renderTimeline — the twelve tenses', () => {
  it.each(TENSES)('%s renders', (tense) => {
    const nodes = renderTimeline(spec({ tense }));

    expect(has(nodes, 'tense-point') || has(nodes, 'tense-band')).toBe(true);
  });

  it('draws simple as a point, continuous as a stretch', () => {
    for (const when of WHENS) {
      const simple = renderTimeline(spec({ tense: `${when}-simple` as TenseId }));
      const continuous = renderTimeline(spec({ tense: `${when}-continuous` as TenseId }));

      expect(has(simple, 'tense-point')).toBe(true);
      expect(has(simple, 'tense-band')).toBe(false);
      expect(has(continuous, 'tense-band')).toBe(true);
      expect(has(continuous, 'tense-flag')).toBe(false);
    }
  });

  it('adds a boundary for the perfects and for nothing else', () => {
    for (const when of WHENS) {
      for (const aspect of ASPECTS) {
        const nodes = renderTimeline(spec({ tense: `${when}-${aspect}` as TenseId }));

        expect(has(nodes, 'tense-flag')).toBe(aspect.startsWith('perfect'));
      }
    }
  });

  it('puts the past before now and the future after it', () => {
    const xOf = (tense: TenseId): number => num(find(renderTimeline(spec({ tense })), 'tense-point'), 'cx');

    expect(xOf('past-simple')).toBeLessThan(xAt(NOW));
    expect(xOf('present-simple')).toBe(xAt(NOW));
    expect(xOf('future-simple')).toBeGreaterThan(xAt(NOW));
  });

  it('finishes a perfect BY its reference time, not after it', () => {
    for (const when of WHENS) {
      const nodes = renderTimeline(spec({ tense: `${when}-perfect` as TenseId }));
      const event = num(find(nodes, 'tense-point'), 'cx');
      const boundary = num(find(nodes, 'tense-flag'), 'x1');
      const reference = num(find(renderTimeline(spec({ tense: `${when}-simple` as TenseId })), 'tense-point'), 'cx');

      expect(event).toBeLessThan(boundary);
      expect(boundary).toBe(reference);
    }
  });

  it('ends a perfect continuous stretch at its boundary', () => {
    for (const when of WHENS) {
      const nodes = renderTimeline(spec({ tense: `${when}-perfect-continuous` as TenseId }));

      expect(spanOf(find(nodes, 'tense-band')).x1).toBe(num(find(nodes, 'tense-flag'), 'x1'));
    }
  });

  it('tells all twelve apart', () => {
    const shapes = TENSES.map((tense) =>
      renderTimeline(spec({ tense }))
        .filter((node) => node.id.startsWith('tense-'))
        .map((node) => `${node.id}@${String(node.attrs.cx ?? node.attrs.x ?? node.attrs.x1)}`)
        .join(' '),
    );

    expect(new Set(shapes).size).toBe(TENSES.length);
  });

  it('keeps every tense inside the axis', () => {
    for (const tense of TENSES) {
      for (const node of renderTimeline(spec({ tense }))) {
        for (const attr of ['x', 'cx', 'x1', 'x2'] as const) {
          if (!(attr in node.attrs)) continue;
          expect(Number(node.attrs[attr])).toBeGreaterThanOrEqual(0);
          expect(Number(node.attrs[attr])).toBeLessThanOrEqual(STAGE.width);
        }
      }
    }
  });
});

/* ---- nine prepositions ------------------------------------- */

describe('renderTimeline — the nine time prepositions', () => {
  it.each(RELATIONS)('%s renders every mark its shape is made of', (relation) => {
    const nodes = renderTimeline(sceneFor(relation));

    for (const authored of MARKS_FOR[relation]) {
      expect(has(nodes, `mark-${authored.id}`)).toBe(true);
    }
  });

  it('at is a point, on rests on the axis, in contains — the three place pictures', () => {
    const at = renderTimeline(sceneFor('at'));
    const on = renderTimeline(sceneFor('on'));
    const inside = renderTimeline(sceneFor('in'));

    expect(find(at, 'mark-hour')?.tag).toBe('circle');
    /* A slab with something to rest on, the way a book rests on a table. */
    expect(find(on, 'mark-day')?.tag).toBe('rect');
    expect(has(on, 'mark-day-rest')).toBe(true);
    /* An outline you are inside, the way a ball is inside a box. */
    expect(find(inside, 'mark-year')?.attrs.fill).toBe('none');
    expect(find(inside, 'mark-year')?.attrs['stroke-dasharray']).toBeTruthy();
  });

  it('projects every stretch back onto the axis, so an event can be seen inside it', () => {
    for (const relation of ['in', 'before', 'after', 'by', 'since', 'during', 'until'] as const) {
      const nodes = renderTimeline(sceneFor(relation));
      const stretch = MARKS_FOR[relation].find((m) => m.kind === 'band' || m.kind === 'container');

      expect(has(nodes, `mark-${String(stretch?.id)}-tie-0`)).toBe(true);
      expect(has(nodes, `mark-${String(stretch?.id)}-tie-1`)).toBe(true);
    }
  });

  it('during — the point falls inside the band', () => {
    const nodes = renderTimeline(sceneFor('during'));
    const band = spanOf(find(nodes, 'mark-span'));
    const point = num(find(nodes, 'mark-nap'), 'cx');

    expect(point).toBeGreaterThan(band.x0);
    expect(point).toBeLessThan(band.x1);
  });

  it('since — the stretch runs to now, whatever the content said', () => {
    const authored = MARKS_FOR.since[0];
    const nodes = renderTimeline(sceneFor('since'));

    expect(authored?.to).toBeGreaterThan(NOW);
    expect(spanOf(find(nodes, 'mark-span')).x1).toBe(xAt(NOW));
  });

  it('by and until stop hard; before and after only mark an edge', () => {
    const dashOf = (relation: TimeRelation): unknown =>
      find(renderTimeline(sceneFor(relation)), 'mark-edge')?.attrs['stroke-dasharray'];

    expect(dashOf('by')).toBeUndefined();
    expect(dashOf('until')).toBeUndefined();
    expect(dashOf('before')).toBeTruthy();
    expect(dashOf('after')).toBeTruthy();
  });

  it('labels both languages, below everything, inside the stage', () => {
    for (const relation of RELATIONS) {
      const nodes = renderTimeline(sceneFor(relation));
      const labelled = MARKS_FOR[relation].filter((m) => m.label !== null);

      for (const authored of labelled) {
        const en = find(nodes, `mark-${authored.id}-label`);
        const ta = find(nodes, `mark-${authored.id}-label-ta`);

        expect(en?.text).toBe(authored.label?.en);
        expect(ta?.attrs['xml:lang']).toBe('ta');
        expect(num(ta, 'y')).toBeGreaterThan(num(en, 'y'));
        expect(num(en, 'x')).toBeGreaterThan(0);
        expect(num(en, 'x')).toBeLessThan(STAGE.width);
      }
    }
  });

  it('keeps a long label on the stage even at the far edge of the axis', () => {
    const nodes = renderTimeline(
      spec({
        relation: 'at',
        marks: [mark('late', 'point', 1, null, bi('a very late hour indeed', 'மிக தாமதமான நேரம்'))],
      }),
    );

    expect(num(find(nodes, 'mark-late-label'), 'x')).toBeLessThan(STAGE.width);
  });
});

/* ---- refusal ------------------------------------------------ */

describe('timelineProblem', () => {
  it('says nothing about a scene that can be drawn', () => {
    for (const relation of RELATIONS) expect(timelineProblem(sceneFor(relation))).toBeNull();
    for (const tense of TENSES) expect(timelineProblem(spec({ tense }))).toBeNull();
  });

  it('refuses a stretch with no end, and one that ends before it starts', () => {
    expect(timelineProblem(spec({ marks: [mark('a', 'band', 0.2)] }))).toMatch(/no end/);
    expect(timelineProblem(spec({ marks: [mark('a', 'band', 0.6, 0.2)] }))).toMatch(/before it starts/);
  });

  it('refuses a mark off the axis', () => {
    expect(timelineProblem(spec({ marks: [mark('a', 'point', 1.4)] }))).toMatch(/off the axis/);
    expect(timelineProblem(spec({ marks: [mark('a', 'band', 0.2, 1.2)] }))).toMatch(/off the axis/);
  });

  it('refuses two marks with the same name — the animation would match them', () => {
    expect(timelineProblem(spec({ marks: [mark('a', 'point', 0.2), mark('a', 'point', 0.4)] }))).toMatch(
      /both called/,
    );
  });

  it('refuses a preposition drawn out of the wrong shapes', () => {
    expect(timelineProblem(spec({ relation: 'in', marks: [mark('a', 'point', 0.3)] }))).toMatch(/container/);
    expect(timelineProblem(spec({ relation: 'during', marks: [mark('a', 'band', 0.2, 0.5)] }))).toMatch(
      /point/,
    );
  });

  it('draws nothing at all for any of them', () => {
    expect(renderTimeline(spec({ relation: 'in', marks: [mark('a', 'point', 0.3)] }))).toEqual([]);
    expect(renderTimeline(spec({ marks: [mark('a', 'band', 0.2)] }))).toEqual([]);
  });
});

/* ---- the house rules --------------------------------------- */

describe('renderTimeline — house rules', () => {
  const every = (): readonly SceneNode[] => [
    ...TENSES.flatMap((tense) => renderTimeline(spec({ tense }))),
    ...RELATIONS.flatMap((relation) => renderTimeline(sceneFor(relation))),
  ];

  it('never writes a literal colour', () => {
    for (const node of every()) {
      for (const attr of ['fill', 'stroke'] as const) {
        const value = String(node.attrs[attr] ?? '');
        if (value === '' || value === 'none') continue;
        expect(value).toMatch(/^var\(--[a-z0-9-]+\)$/);
      }
    }
  });

  it('rounds every coordinate it produces', () => {
    for (const node of every()) {
      for (const value of Object.values(node.attrs)) {
        if (typeof value !== 'number') continue;
        expect(Math.round(value * 10) / 10).toBe(value);
      }
    }
  });

  it('gives every node in a scene a distinct name', () => {
    for (const relation of RELATIONS) {
      const ids = renderTimeline(sceneFor(relation)).map((node) => node.id);

      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('keeps the event and the time it is in in different colours', () => {
    const nodes = renderTimeline(sceneFor('in'));

    expect(find(nodes, 'tense-point')?.attrs.fill).toBe('var(--r-figure)');
    expect(find(nodes, 'mark-year')?.attrs.stroke).toBe('var(--r-ground)');
  });
});
