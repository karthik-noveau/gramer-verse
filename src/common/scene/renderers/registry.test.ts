import { describeScene, renderScene, sceneProblem } from 'common/scene/renderers/registry';
import { glyphFor } from 'common/scene/renderers/relation.renderer';
import type {
  ActorSpec,
  Bilingual,
  NonEmptyString,
  PathSpec,
  PlaceSpec,
  PropId,
  RelationSpec,
  SceneKind,
  SceneSpec,
  TimelineSpec,
  VerbId,
} from 'common/scene/types';

/* ============================================================
   registry.test.ts

   Two claims: the right renderer is reached for each of the five
   kinds, and every scene can be said out loud in both languages.
   The third — that a sixth kind without a renderer does not
   compile — is in `types.test-d.ts`, because a compile error
   cannot be asserted at run time.
   ============================================================ */

const id = (value: string): PropId => value as PropId;
const bi = (en: string, ta: string): Bilingual => ({
  en: en as NonEmptyString,
  ta: ta as NonEmptyString,
});

const PLACE: PlaceSpec = {
  kind: 'place',
  figure: id('ball'),
  ground: id('box'),
  ground2: null,
  relation: 'in',
  determiner: 'the',
  count: 1,
  adjective: null,
};

const PATH: PathSpec = {
  kind: 'path',
  mover: id('man'),
  landmark: 'building',
  relation: 'to',
  arrives: true,
  arrow: 'straight',
};

const TIMELINE: TimelineSpec = {
  kind: 'timeline',
  tense: 'past-simple',
  marks: [{ id: 'year', kind: 'container', at: 0.2, to: 0.36, label: bi('2000', '2000') }],
  relation: 'in',
};

const ACTOR: ActorSpec = {
  kind: 'actor',
  actor: id('man'),
  verb: 'eat' as VerbId,
  patient: id('apple'),
  cue: 'chomp',
  voice: 'active',
  mood: 'statement',
  negated: false,
};

const RELATION: RelationSpec = {
  kind: 'relation',
  left: id('cup'),
  right: id('book'),
  connective: 'and',
  glyph: 'brace',
};

const EVERY: Readonly<Record<SceneKind, SceneSpec>> = {
  place: PLACE,
  path: PATH,
  timeline: TIMELINE,
  actor: ACTOR,
  relation: RELATION,
};

const KINDS = Object.keys(EVERY) as readonly SceneKind[];

/* ---- dispatch ---------------------------------------------- */

describe('renderScene', () => {
  it('draws something for every one of the five kinds', () => {
    for (const kind of KINDS) {
      expect(renderScene(EVERY[kind]).length).toBeGreaterThan(0);
    }
  });

  it('reaches the renderer that belongs to each kind', () => {
    /* Read off a node only that renderer makes: a dispatch that sent every
       spec to the place renderer would still return nodes. */
    const idsOf = (kind: SceneKind): readonly string[] =>
      renderScene(EVERY[kind]).map((node) => node.id);

    expect(idsOf('place')).toContain('ground');
    expect(idsOf('path')).toContain('landmark');
    expect(idsOf('timeline')).toContain('axis');
    expect(idsOf('actor')).toContain('cue');
    expect(idsOf('relation')).toContain('label-ta');
  });

  it('throws by name for a kind no renderer handles', () => {
    /* Content is JSON: a `kind` TypeScript never saw can reach here at run
       time, and it must say which one rather than render half a picture. */
    const rogue = { kind: 'sculpture' } as unknown as SceneSpec;

    expect(() => renderScene(rogue)).toThrow(/sculpture/);
    expect(() => sceneProblem(rogue)).toThrow(/scene kind/);
    expect(() => describeScene(rogue)).toThrow(/scene kind/);
  });

  it('draws nothing, and does not throw, for a spec its renderer refuses', () => {
    const impossible: PlaceSpec = { ...PLACE, relation: 'in', ground: id('tree') };

    expect(sceneProblem(impossible)).toMatch(/inside/);
    expect(renderScene(impossible)).toEqual([]);
  });
});

describe('sceneProblem', () => {
  it('says nothing about any of the five when they are well formed', () => {
    for (const kind of KINDS) {
      expect(sceneProblem(EVERY[kind])).toBeNull();
    }
  });

  it('asks the renderer that owns the kind', () => {
    expect(sceneProblem({ ...PATH, arrives: false })).toMatch(/reaches/);
    expect(sceneProblem({ ...ACTOR, cue: 'arc' })).toMatch(/chomp/);
    expect(sceneProblem({ ...RELATION, glyph: 'cause' })).toMatch(/brace/);
  });
});

/* ---- inside one frame -------------------------------------- */

describe('the whole catalogue', () => {
  /* Every scene the five renderers can be asked for, near enough: each kind
     swept across the thing that changes most about it. */
  const CATALOGUE: readonly SceneSpec[] = [
    ...(['in', 'on', 'at', 'under', 'above', 'below', 'behind', 'in front of', 'near', 'beside', 'here', 'there'] as const).map(
      /* `in` needs something with an inside and `under` something with legs;
         the table has legs and the box has an inside. */
      (relation): SceneSpec => ({ ...PLACE, relation, ground: id(relation === 'in' ? 'box' : 'table') }),
    ),
    { ...PLACE, relation: 'between', ground: id('table'), ground2: id('chair') },
    ...(['present-simple', 'past-perfect', 'future-continuous'] as const).map(
      (tense): SceneSpec => ({ ...TIMELINE, tense }),
    ),
    ...(['eat', 'read', 'throw', 'kick'] as const).map(
      (verb): SceneSpec => ({
        ...ACTOR,
        verb: verb as VerbId,
        cue: verb === 'eat' ? 'chomp' : verb === 'read' ? 'gaze' : verb === 'throw' ? 'arc' : 'impact',
        patient: id(verb === 'read' ? 'book' : verb === 'eat' ? 'apple' : 'ball'),
      }),
    ),
    ...(['and', 'but', 'or', 'because', 'so', 'about', 'for', 'with', 'as', 'like', 'per'] as const).map(
      (connective): SceneSpec => ({ ...RELATION, connective, glyph: glyphFor(connective) }),
    ),
    PATH,
  ];

  it('draws every scene in it', () => {
    for (const spec of CATALOGUE) {
      expect(sceneProblem(spec)).toBeNull();
      expect(renderScene(spec).length).toBeGreaterThan(0);
    }
  });

  /* A knob moves and the picture has to follow inside one frame. The path from
     spec to node tree is the part of that budget this engine owns; the DOM
     write is React's and is measured in Stage.test.tsx by rendering. The
     threshold is a whole frame per scene, which is roughly a hundred times
     what these actually take — it is here to catch a renderer that starts
     doing real work, not to police microseconds. */
  it('builds every one of them well inside a frame', () => {
    /* The fastest of five, not one reading: a single timing on a loaded
       machine measures the scheduler as much as the code, and a test that
       fails when something else is compiling is a test nobody trusts. */
    const fastest = (work: () => void): number => {
      let best = Infinity;
      for (let run = 0; run < 5; run += 1) {
        const started = performance.now();
        work();
        best = Math.min(best, performance.now() - started);
      }
      return best;
    };

    for (const spec of CATALOGUE) {
      expect(
        fastest(() => {
          renderScene(spec);
          describeScene(spec);
        }),
      ).toBeLessThan(16);
    }
  });
});

/* ---- descriptions ------------------------------------------ */

describe('describeScene', () => {
  it('describes every kind in both languages', () => {
    for (const kind of KINDS) {
      const said = describeScene(EVERY[kind]);

      expect(said.en.trim().length).toBeGreaterThan(0);
      expect(said.ta.trim().length).toBeGreaterThan(0);
      /* Tamil, not English spelled in Tamil's place. */
      expect(said.ta).toMatch(/[஀-௿]/);
    }
  });

  it('says where the figure is, and declines the ground for it', () => {
    const said = describeScene(PLACE);

    expect(said.en).toBe('the ball in the box');
    /* பெட்டியில் — the locative. Tamil has no separate word for "in", which is
       what half the place lessons are about, so the description must show the
       ending rather than insert a word. */
    expect(said.ta).toBe('பெட்டியில் பந்து');
  });

  it('counts and colours the figure the way the picture does', () => {
    expect(describeScene({ ...PLACE, count: 2, determiner: 'a' }).en).toBe('two balls in the box');
    expect(describeScene({ ...PLACE, adjective: 'red' }).en).toBe('the red ball in the box');
  });

  it('uses the dative and a postposition where Tamil needs one', () => {
    const under = describeScene({ ...PLACE, relation: 'under', ground: id('table') });

    expect(under.en).toBe('the ball under the table');
    expect(under.ta).toBe('மேசைக்கு கீழ் பந்து');
  });

  it('names the landmark of a path, which is not a prop and has its own words', () => {
    const said = describeScene(PATH);

    expect(said.en).toBe('a man moving to the building');
    expect(said.ta).toBe('கட்டிடத்திற்கு மனிதன்');
    expect(describeScene({ ...PATH, relation: 'from', arrow: 'straight' }).ta).toContain(
      'கட்டிடத்திலிருந்து',
    );
  });

  it('names the tense and every mark on a timeline', () => {
    const said = describeScene(TIMELINE);

    expect(said.en).toContain('past simple');
    expect(said.en).toContain('2000');
    expect(said.ta).toContain('இறந்த காலம்');
  });

  it('says who did what to what, and who the sentence is about', () => {
    const said = describeScene(ACTOR);

    expect(said.en).toBe('a man eating an apple — the sentence is about the man');
    /* ஆப்பிளை சாப்பிடும் மனிதன்: the patient in the accusative, the verb as an
       adjectival participle, the actor last. */
    expect(said.ta).toBe('ஆப்பிளை சாப்பிடும் மனிதன்');
  });

  it('moves who the sentence is about when the voice changes, and marks a negation', () => {
    expect(describeScene({ ...ACTOR, voice: 'passive' }).en).toContain('about the apple');
    expect(describeScene({ ...ACTOR, negated: true }).en).toContain('not eating');
    expect(describeScene({ ...ACTOR, negated: true }).ta).toContain('இல்லை');
    expect(describeScene({ ...ACTOR, mood: 'question' }).en).toContain('a question');
  });

  it('leaves out a patient that is not there', () => {
    const said = describeScene({ ...ACTOR, verb: 'laugh' as VerbId, patient: null });

    expect(said.en).toBe('a man laughing — the sentence is about the man');
    expect(said.ta).toBe('சிரிக்கும் மனிதன்');
  });

  it('puts a conjunction between the two and a role marker after them', () => {
    expect(describeScene(RELATION).en).toBe('a cup and a book');
    expect(describeScene(RELATION).ta).toBe('கோப்பை மற்றும் புத்தகம்');

    const about = describeScene({ ...RELATION, connective: 'about', glyph: 'bubble' });
    expect(about.en).toBe('a cup about a book');
    expect(about.ta).toBe('புத்தகத்தை பற்றி கோப்பை');
  });

  it('says so, in both languages, when the scene cannot be drawn', () => {
    const said = describeScene({ ...PLACE, figure: id('rocket') });

    expect(said.en).toMatch(/cannot be drawn/);
    expect(said.ta).toMatch(/[஀-௿]/);
  });
});
