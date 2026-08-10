import { PROPS } from 'common/scene/props/index';
import type { PlaceRelation, Prop } from 'common/scene/types';
import {
  ADJECTIVE_TA,
  DETERMINER_TA,
  NUMBER_TA,
  beTa,
  caseFor,
  placeIn,
  pluralOf,
  postpositionFor,
} from 'common/utils/tamil';

/* ============================================================
   tamil.test.ts

   The morphology, checked word by word against the source
   notes' own preposition table and against every prop in the
   library. This is the file where being quietly wrong costs the
   most: a bad ending is still a Tamil-looking word.
   ============================================================ */

const RELATIONS: readonly PlaceRelation[] = [
  'in', 'on', 'at', 'under', 'above', 'below', 'behind', 'in front of',
  'between', 'near', 'beside', 'here', 'there',
];

describe('caseFor', () => {
  it('gives in, on and at the locative and nothing after it', () => {
    /* The claim half the place lessons rest on: Tamil has no separate word for
       these, only an ending. */
    for (const relation of ['in', 'on', 'at'] as const) {
      expect(caseFor(relation)).toBe('locative');
      expect(postpositionFor(relation)).toBe('');
    }
  });

  it('gives every other grounded relation the dative and a postposition', () => {
    for (const relation of ['under', 'above', 'below', 'behind', 'in front of', 'between', 'near', 'beside'] as const) {
      expect(caseFor(relation)).toBe('dative');
      expect(postpositionFor(relation).length).toBeGreaterThan(0);
    }
  });

  it('gives here and there no case at all — there is no ground to decline', () => {
    for (const relation of ['here', 'there'] as const) {
      expect(caseFor(relation)).toBeNull();
      expect(postpositionFor(relation).length).toBeGreaterThan(0);
    }
  });

  it('covers all thirteen relations', () => {
    for (const relation of RELATIONS) {
      expect(placeIn(relation)).toBeDefined();
    }
    expect(RELATIONS).toHaveLength(13);
  });

  it('says the source notes’ own words', () => {
    expect(postpositionFor('under')).toBe('கீழ்');
    expect(postpositionFor('below')).toBe('கீழே');
    expect(postpositionFor('above')).toBe('மேலே');
    expect(postpositionFor('behind')).toBe('பின்னால்');
    expect(postpositionFor('in front of')).toBe('முன்னால்');
    expect(postpositionFor('between')).toBe('இடையில்');
    expect(postpositionFor('near')).toBe('அருகில்');
    expect(postpositionFor('beside')).toBe('பக்கத்தில்');
  });
});

describe('pluralOf', () => {
  /* Every prop in the library, written out. A rule is only as good as the
     words it is asked for, and these are all the words it will ever be asked
     for. */
  const EXPECTED: Readonly<Record<string, string>> = {
    மேசை: 'மேசைகள்',
    பெட்டி: 'பெட்டிகள்',
    நாற்காலி: 'நாற்காலிகள்',
    பந்து: 'பந்துகள்',
    'ஆப்பிள்': 'ஆப்பிள்கள்',
    கோப்பை: 'கோப்பைகள்',
    புத்தகம்: 'புத்தகங்கள்',
    கடிகாரம்: 'கடிகாரங்கள்',
    மரம்: 'மரங்கள்',
    பூனை: 'பூனைகள்',
    'நாய்': 'நாய்கள்',
    மனிதன்: 'மனிதர்கள்',
    'பெண்': 'பெண்கள்',
  };

  it.each(Object.entries(EXPECTED))('makes %s into %s', (singular, plural) => {
    expect(pluralOf(singular)).toBe(plural);
  });

  it('drops the ம் rather than writing கள் after it', () => {
    /* மரம்கள் is not a word. */
    expect(pluralOf('மரம்')).not.toContain('ம்கள்');
  });

  it('takes the personal plural for a noun ending in ன்', () => {
    expect(pluralOf('மனிதன்')).toBe('மனிதர்கள்');
    expect(pluralOf('மனிதன்')).not.toBe('மனிதன்கள்');
  });

  it('pluralises every prop in the library into something longer than it was', () => {
    for (const prop of Object.values(PROPS) as readonly Prop[]) {
      const plural = pluralOf(prop.word.ta.nominative);

      expect(plural.endsWith('கள்')).toBe(true);
      expect(plural.length).toBeGreaterThan(prop.word.ta.nominative.length);
    }
  });
});

describe('the words Tamil uses where English has none', () => {
  it('glosses the articles the way the source notes do', () => {
    expect(DETERMINER_TA.a).toBe('ஒரு');
    expect(DETERMINER_TA.the).toBe('அந்த');
  });

  it('counts to three, and no further', () => {
    expect(NUMBER_TA[1]).toBe('ஒரு');
    expect(NUMBER_TA[2]).toBe('இரண்டு');
    expect(NUMBER_TA[3]).toBe('மூன்று');
    expect(NUMBER_TA[4]).toBeUndefined();
  });

  it('agrees the be-word with the count', () => {
    expect(beTa(false)).toBe('உள்ளது');
    expect(beTa(true)).toBe('உள்ளன');
  });

  it('has a word for every adjective the picture can change', () => {
    for (const adjective of ['red', 'green', 'blue', 'yellow', 'big', 'small']) {
      expect(ADJECTIVE_TA[adjective]).toBeDefined();
    }
  });
});
