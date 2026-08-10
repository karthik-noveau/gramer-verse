import { PLACE_ADJECTIVES } from 'common/scene/renderers/place.renderer';
import { PROPS } from 'common/scene/props/index';
import { readsAs, resolve, said, tokenize } from 'pages/visualizer/utils/resolver';
import type { PlaceSpec } from 'common/scene/types';

/* ============================================================
   resolver.test.ts

   "Cannot draw" is an outcome of this product, not an error
   path, so most of what is asserted here is the quality of the
   refusal: which word was not known, what the sentence left out,
   and what to type instead.
   ============================================================ */

const drawn = (text: string): PlaceSpec => {
  const result = resolve(text);
  if (result.status !== 'drawn') {
    throw new Error(`expected "${text}" to draw, got ${result.status}`);
  }
  return result.spec;
};

const refused = (text: string): Extract<ReturnType<typeof resolve>, { status: 'cannot' }> => {
  const result = resolve(text);
  if (result.status !== 'cannot') {
    throw new Error(`expected "${text}" to be refused, got ${result.status}`);
  }
  return result;
};

describe('tokenize', () => {
  it('lowercases, drops punctuation and splits on space', () => {
    expect(tokenize('The BALL is in the box.')).toEqual(['the', 'ball', 'is', 'in', 'the', 'box']);
  });

  it('reads an empty string as no words', () => {
    expect(tokenize('   ')).toEqual([]);
  });
});

describe('resolve — sentences it can draw', () => {
  it('reads the sentence the lessons are built on', () => {
    expect(drawn('the ball is in the box')).toEqual({
      kind: 'place',
      figure: 'ball',
      ground: 'box',
      ground2: null,
      relation: 'in',
      determiner: 'the',
      count: 1,
      adjective: null,
    });
  });

  it('takes the article', () => {
    expect(drawn('a ball is on the table').determiner).toBe('a');
    expect(drawn('an apple is on the table').determiner).toBe('a');
  });

  it('takes the adjective', () => {
    expect(drawn('the red ball is on the table').adjective).toBe('red');
  });

  it('counts in words', () => {
    expect(drawn('three balls are on the table').count).toBe(3);
  });

  it('raises the count for a plural and resolves the singular', () => {
    const spec = drawn('balls are on the table');

    expect(spec.figure).toBe('ball');
    expect(spec.count).toBe(2);
  });

  it('reads a relation of three words before the one word inside it', () => {
    /* The prototype dropped `front` and `of` as stop words and matched the
       `in`, which drew a ball inside the box for a sentence that said it was
       in front of it. */
    expect(drawn('the ball is in front of the box').relation).toBe('in front of');
  });

  it('takes both grounds of a between', () => {
    const spec = drawn('the ball is between the table and the chair');

    expect(spec.relation).toBe('between');
    expect(spec.ground).toBe('table');
    expect(spec.ground2).toBe('chair');
  });

  it('needs no ground for here and there', () => {
    const spec = drawn('the man is here');

    expect(spec.relation).toBe('here');
    expect(spec.ground).toBeNull();
  });

  it('reads what is before the preposition as the thing being placed', () => {
    const spec = drawn('the cat is under the table');

    expect(spec.figure).toBe('cat');
    expect(spec.ground).toBe('table');
  });

  it('falls back to on when no relation is named', () => {
    /* Two nouns and no preposition is still a sentence somebody meant
       something by. */
    expect(drawn('the book the table').relation).toBe('on');
  });

  it('says back the sentence it actually read', () => {
    const result = resolve('the RED ball is  in the box.');

    expect(result.status === 'drawn' && result.sentence).toBe('the red ball is in the box');
  });

  it('says a plural back in words', () => {
    expect(said(drawn('two cups are on the table'))).toBe('two cups are on the table');
  });
});

describe('resolve — what it will not draw', () => {
  it('says nothing at all about an empty box', () => {
    /* Not an error: there is nothing to say yet. */
    expect(resolve('').status).toBe('empty');
    expect(resolve('   ').status).toBe('empty');
  });

  it('names each word nobody drew', () => {
    const result = refused('the rocket is on the launchpad');

    expect(result.unknown).toEqual(['rocket', 'launchpad']);
  });

  it('reports what the sentence left out, apart from the words it did not know', () => {
    /* One list saying "rocket, nowhere to put it" is two different problems
       wearing one label. */
    const result = refused('the rocket is on');

    expect(result.unknown).toEqual(['rocket']);
    expect(result.gaps).toEqual(['nothing to place', 'nowhere to put it']);
  });

  it('says when there is nothing to place', () => {
    expect(refused('on the table').gaps).toContain('nothing to place');
  });

  it('says when there is nowhere to put it', () => {
    expect(refused('the ball is').gaps).toContain('nowhere to put it');
  });

  it('says when a between has only one thing to be between', () => {
    expect(refused('the ball is between the table').gaps).toContain(
      'only one thing to be between',
    );
  });

  it('refuses a relation the ground cannot hold', () => {
    /* Nothing goes inside a table. The renderer is what says so; this is where
       a typed sentence meets that answer. */
    expect(resolve('the ball is in the table').status).toBe('cannot');
  });

  it('ignores the words that carry no part of the picture', () => {
    const result = resolve('the very big ball is quite on the table');

    expect(result.status).toBe('drawn');
  });

  it('names an action as an action rather than as an unknown word', () => {
    /* `eats` is a verb this app draws — in a lesson, where a scene has an
       actor. The visualizer draws where things are, so it is still refused,
       but as an action and not as a word nobody knows. */
    const result = refused('the cat eats the apple');

    expect(result.verb).toEqual({ word: 'eats', drawable: true });
    expect(result.unknown).toEqual([]);
  });

  it('reads a verb in any of its forms', () => {
    for (const form of ['eat', 'eats', 'ate', 'eating']) {
      expect(refused(`the cat ${form} the apple`).verb?.word).toBe(form);
    }
  });

  it('names a verb the lexicon knows and cannot draw', () => {
    /* Engine 14's decision: an undrawable verb is refused by name, never given
       a vague animation. */
    const result = resolve('the man remembers the box', {
      verbs: [
        { id: 'remember', drawable: false },
        { id: 'remembers', drawable: false },
      ],
    });

    expect(result.status === 'cannot' && result.verb?.word).toBe('remembers');
  });

  it('always offers something it can draw', () => {
    for (const text of [
      'the rocket is on the launchpad',
      'on the table',
      'the ball is',
      'the ball is in the table',
      'the ball is between the table',
      'zzz',
    ]) {
      const result = refused(text);

      expect(result.suggestion.length).toBeGreaterThan(0);
      /* And the suggestion is itself drawable — offering "the ball is in the
         table" would be suggesting the one thing that cannot happen. */
      expect(resolve(result.suggestion).status).toBe('drawn');
    }
  });

  it('keeps what it understood in the suggestion', () => {
    expect(refused('the cup is in the launchpad').suggestion).toContain('cup');
    expect(refused('the rocket is under the table').suggestion).toContain('under the table');
  });
});

describe('a word that could be two things', () => {
  it('has none in this lexicon', () => {
    /* The rule below exists for the first one added, not for one that is
       already here. */
    const both = Object.keys(PROPS).filter((id) =>
      Object.prototype.hasOwnProperty.call(PLACE_ADJECTIVES, id),
    );

    expect(both).toEqual([]);
  });

  it('reads a word with a noun after it as the adjective', () => {
    expect(readsAs('red', ['ball'])).toBe('adjective');
  });

  it('reads a word with nothing after it as the noun', () => {
    expect(readsAs('ball', [])).toBe('prop');
    expect(readsAs('red', [])).toBe('adjective');
  });

  it('knows a word that is neither', () => {
    expect(readsAs('rocket', [])).toBe('neither');
  });
});
