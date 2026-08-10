import { propFor } from 'common/scene/props/index';
import { articleFor, buildSentence, sentenceText } from 'common/scene/sentence';
import type {
  ActorSpec,
  PlaceRelation,
  PlaceSpec,
  Prop,
  PropId,
  SentenceTemplates,
  VerbId,
} from 'common/scene/types';
import { caseFor, postpositionFor } from 'common/utils/tamil';

/* ============================================================
   sentence.test.ts

   The module most likely to be silently wrong, so the tests read
   the sentences out: every preposition against every ground it
   can be drawn with, both languages, compared to the form the
   source notes give.
   ============================================================ */

const id = (value: string): PropId => value as PropId;

const PLACE_TEMPLATE: SentenceTemplates = {
  en: [
    { slot: 'det' },
    { slot: 'adj' },
    { slot: 'figure' },
    { slot: 'be' },
    { slot: 'relation' },
    { slot: 'text', text: 'the' },
    { slot: 'ground' },
  ],
  ta: [
    { slot: 'det' },
    { slot: 'adj' },
    { slot: 'figure', case: 'nominative' },
    { slot: 'ground', case: 'locative' },
    { slot: 'be' },
  ],
};

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

/** The template a `between` lesson writes: English names both grounds, Tamil
 *  says both inside the one declined word. */
const TWO_GROUNDS: SentenceTemplates = {
  en: [
    ...PLACE_TEMPLATE.en,
    { slot: 'text', text: 'and' },
    { slot: 'text', text: 'the' },
    { slot: 'ground2' },
  ],
  ta: PLACE_TEMPLATE.ta,
};

const place = (over: Partial<PlaceSpec> = {}): PlaceSpec => ({ ...PLACE, ...over });

const en = (spec: PlaceSpec | ActorSpec, templates = PLACE_TEMPLATE): string =>
  sentenceText(buildSentence(spec, templates).en);
const ta = (spec: PlaceSpec | ActorSpec, templates = PLACE_TEMPLATE): string =>
  sentenceText(buildSentence(spec, templates).ta);

const prop = (name: string): Prop => {
  const found = propFor(id(name));
  if (!found) throw new Error(`the test asked for a prop that is not drawn: ${name}`);
  return found;
};

/* ---- English ------------------------------------------------ */

describe('the English line', () => {
  it('puts the words in the order the template gives', () => {
    expect(en(place())).toBe('The ball is in the box');
  });

  it('starts with a capital, and only the first word', () => {
    expect(en(place({ determiner: 'a' })).startsWith('A ')).toBe(true);
    expect(en(place())).toContain('the box');
  });

  it('agrees the verb with the count', () => {
    expect(en(place({ count: 1 }))).toContain(' is ');
    expect(en(place({ count: 2 }))).toBe('Two balls are in the box');
    expect(en(place({ count: 3 }))).toBe('Three balls are in the box');
  });

  it('counts in words, not in numerals', () => {
    /* One sentence counting in two notations — "3 balls" beside மூன்று — is
       two ways of writing the same number in one line. */
    expect(en(place({ count: 3 }))).not.toMatch(/\d/);
  });

  it('drops the adjective slot when there is no adjective', () => {
    expect(en(place())).toBe('The ball is in the box');
    expect(en(place({ adjective: 'red' }))).toBe('The red ball is in the box');
  });
});

describe('a and an', () => {
  it('follows the sound of the next word, not its first letter', () => {
    expect(articleFor('hour')).toBe('an');
    expect(articleFor('honest')).toBe('an');
    expect(articleFor('university')).toBe('a');
    expect(articleFor('uniform')).toBe('a');
    expect(articleFor('apple')).toBe('an');
    expect(articleFor('ball')).toBe('a');
  });

  it('decides on the adjective when there is one in front of the noun', () => {
    /* *a red apple*, never *an red apple*: the article agrees with the word
       that follows it. */
    expect(en(place({ figure: id('apple'), determiner: 'a' }))).toBe('An apple is in the box');
    expect(en(place({ figure: id('apple'), determiner: 'a', adjective: 'red' }))).toBe(
      'A red apple is in the box',
    );
    expect(en(place({ figure: id('ball'), determiner: 'a', adjective: 'red' }))).toBe(
      'A red ball is in the box',
    );
  });

  it('says a number instead of an article when there is more than one', () => {
    expect(en(place({ determiner: 'a', count: 2 }))).toBe('Two balls are in the box');
  });
});

/* ---- Tamil -------------------------------------------------- */

describe('the Tamil line', () => {
  it('is built in its own order, with no word for the preposition', () => {
    expect(ta(place())).toBe('அந்த பந்து பெட்டியில் உள்ளது');
    /* The English has seven words and the Tamil four: they are not the same
       sentence with the words swapped. */
    expect(buildSentence(place(), PLACE_TEMPLATE).ta).toHaveLength(4);
  });

  it('declines the ground for the relation, whatever the template said', () => {
    /* The template hard-codes the locative because that is what the lesson
       started with. A knob that moves the relation has to move the ending, or
       the sentence claims one thing and the picture shows another. */
    expect(ta(place({ relation: 'under', ground: id('table') }))).toBe(
      'அந்த பந்து மேசைக்கு கீழ் உள்ளது',
    );
    expect(caseFor('under')).toBe('dative');
  });

  it('uses ஒரு and அந்த for the articles Tamil does not have', () => {
    expect(ta(place({ determiner: 'a' }))).toContain('ஒரு');
    expect(ta(place({ determiner: 'the' }))).toContain('அந்த');
  });

  it('counts and pluralises the figure', () => {
    expect(ta(place({ count: 2 }))).toBe('இரண்டு பந்துகள் பெட்டியில் உள்ளன');
    expect(ta(place({ count: 3 }))).toContain('மூன்று');
  });

  it('says the adjective in Tamil, not in English', () => {
    expect(ta(place({ adjective: 'red' }))).toContain('சிவப்பு');
    expect(ta(place({ adjective: 'red' }))).not.toContain('red');
  });

  it('joins two grounds the way the notes join them', () => {
    const between = place({ relation: 'between', ground: id('table'), ground2: id('chair') });

    expect(ta(between)).toBe('அந்த பந்து மேசை மற்றும் நாற்காலிக்கு இடையில் உள்ளது');
    expect(en(between, TWO_GROUNDS)).toBe('The ball is between the table and the chair');
  });

  it('says here and there without a ground at all, and with no word left holding nothing', () => {
    expect(ta(place({ relation: 'here', ground: null }))).toBe('அந்த பந்து உள்ளது');
    /* Not "The ball is here the": the article goes when its noun does. */
    expect(en(place({ relation: 'here', ground: null }))).toBe('The ball is here');
  });

  it('drops the whole "and the" when the second ground is turned off', () => {
    expect(en(place({ relation: 'on', ground: id('table') }), TWO_GROUNDS)).toBe(
      'The ball is on the table',
    );
  });
});

/* ---- every preposition against every ground ---------------- */

describe('every place preposition against every ground', () => {
  const GROUNDS = ['box', 'table', 'chair', 'tree', 'car', 'door', 'shop'];
  const GROUNDED: readonly PlaceRelation[] = [
    'in', 'on', 'at', 'under', 'above', 'below', 'behind', 'in front of', 'near', 'beside',
  ];

  it('puts the right ending on every ground, for every relation', () => {
    for (const relation of GROUNDED) {
      for (const name of GROUNDS) {
        const line = ta(place({ relation, ground: id(name) }));
        const grammaticalCase = caseFor(relation);
        const after = postpositionFor(relation);

        expect(grammaticalCase).not.toBeNull();
        expect(line).toContain(prop(name).word.ta[grammaticalCase ?? 'nominative']);
        if (after) expect(line).toContain(after);
        /* Never the bare noun where a declined one belongs. */
        expect(line).not.toContain(` ${prop(name).word.ta.nominative} உள்ளது`);
      }
    }
  });

  it('leaves both lines grammatical whatever the knobs are set to', () => {
    for (const relation of GROUNDED) {
      for (const count of [1, 2, 3] as const) {
        for (const determiner of ['a', 'the'] as const) {
          const spec = place({ relation, ground: id('table'), count, determiner });

          expect(en(spec)).toMatch(/^[A-Z]/);
          expect(en(spec)).toContain(count === 1 ? ' is ' : ' are ');
          expect(ta(spec)).toContain(count === 1 ? 'உள்ளது' : 'உள்ளன');
          expect(ta(spec).split(' ').every((word) => word.length > 0)).toBe(true);
        }
      }
    }
  });
});

/* ---- knob tags ---------------------------------------------- */

describe('the tokens', () => {
  it('tags each word with the knob that produced it, in both lines', () => {
    const built = buildSentence(place({ adjective: 'red' }), PLACE_TEMPLATE);
    const tagsOf = (tokens: readonly { text: string; knob: string | null }[]): readonly (string | null)[] =>
      tokens.map((token) => token.knob);

    expect(tagsOf(built.en)).toEqual([
      'determiner', 'adjective', 'figure', null, 'relation', null, 'ground',
    ]);
    expect(tagsOf(built.ta)).toEqual(['determiner', 'adjective', 'figure', 'ground', null]);
  });

  it('tags the determiner as the count when there is more than one', () => {
    const built = buildSentence(place({ count: 2 }), PLACE_TEMPLATE);

    expect(built.en[0]?.knob).toBe('count');
    expect(built.ta[0]?.knob).toBe('count');
  });

  it('tags the same knob in both lines, so one change can flash in both', () => {
    const built = buildSentence(place(), PLACE_TEMPLATE);
    const inEn = new Set(built.en.map((token) => token.knob).filter(Boolean));
    const inTa = new Set(built.ta.map((token) => token.knob).filter(Boolean));

    for (const knob of ['figure', 'ground', 'determiner']) {
      expect(inEn.has(knob)).toBe(true);
      expect(inTa.has(knob)).toBe(true);
    }
  });

  it('joins into text with real spaces in it', () => {
    /* A sentence spaced by CSS alone is one unbroken word to a screen reader. */
    const built = buildSentence(place(), PLACE_TEMPLATE);

    expect(sentenceText(built.en)).toBe('The ball is in the box');
    expect(sentenceText(built.en).split(' ')).toHaveLength(6);
    expect(sentenceText(built.ta)).toContain(' ');
  });

  it('keeps punctuation against the word before it', () => {
    const withStop: SentenceTemplates = {
      en: [...PLACE_TEMPLATE.en, { slot: 'text', text: '.' }],
      ta: PLACE_TEMPLATE.ta,
    };

    expect(en(place(), withStop)).toBe('The ball is in the box.');
  });
});

/* ---- the other scene kinds --------------------------------- */

describe('an actor sentence', () => {
  const ACTOR_TEMPLATE: SentenceTemplates = {
    en: [
      { slot: 'text', text: 'the' },
      { slot: 'actor' },
      { slot: 'verb' },
      { slot: 'text', text: 'the' },
      { slot: 'patient' },
    ],
    ta: [
      { slot: 'patient', case: 'accusative' },
      { slot: 'verb' },
      { slot: 'actor', case: 'nominative' },
    ],
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

  it('agrees the verb with its one subject', () => {
    expect(en(ACTOR, ACTOR_TEMPLATE)).toBe('The man eats the apple');
  });

  it('puts the patient in the accusative and the verb before the actor', () => {
    /* Tamil's own order, and its own form of the verb: the adjectival
       participle, which says something about the man rather than telling him
       to eat. */
    expect(ta(ACTOR, ACTOR_TEMPLATE)).toBe('ஆப்பிளை சாப்பிடும் மனிதன்');
  });

  it('leaves out a patient that is not there', () => {
    const alone: ActorSpec = { ...ACTOR, verb: 'laugh' as VerbId, patient: null };

    expect(en(alone, ACTOR_TEMPLATE)).toBe('The man laughs');
    expect(ta(alone, ACTOR_TEMPLATE)).toBe('சிரிக்கும் மனிதன்');
  });

  it('writes nothing for a slot the scene does not have', () => {
    /* A place scene has no verb. The token is dropped rather than written as a
       gap or as the word "undefined". */
    const built = buildSentence(place(), {
      en: [{ slot: 'figure' }, { slot: 'verb' }],
      ta: [{ slot: 'figure', case: 'nominative' }],
    });

    expect(sentenceText(built.en)).toBe('Ball');
  });
});
