import { render } from '@testing-library/react';

import { Art, artFor, hasArt } from 'common/art/Art';
import { lookup } from 'common/art/forWord';

/* The claim this file checks is the one the whole picture column rests on:
   a word either has a drawing or it does not, and the app never invents one. */

describe('the word lookup', () => {
  it('finds a word in each family', () => {
    expect(lookup('in')?.family).toBe('prep');
    expect(lookup('box')?.family).toBe('thing');
    expect(lookup('they')?.family).toBe('pronoun');
    expect(lookup('the')?.family).toBe('article');
    expect(lookup('because')?.family).toBe('conj');
    expect(lookup('always')?.family).toBe('adv');
    expect(lookup('brave')?.family).toBe('adj2');
    expect(lookup('how many')?.family).toBe('wh');
    expect(lookup('must')?.family).toBe('verb');
    expect(lookup('simple past')?.family).toBe('tense');
    expect(lookup('imperative')?.family).toBe('sent');
  });

  /* The whole cell has to be the word — never its first word. A source row
     carries example sentences as well as the word it teaches, and "I do my
     work" starts with a pronoun; matching loosely put a picture of "I" beside
     the verb "do" on all forty-seven rows of the main-verbs table. */
  it('matches the whole cell, never its first word', () => {
    expect(lookup('I do my work')).toBeNull();
    expect(lookup('The ball is in the box')).toBeNull();
    expect(lookup('I')?.family).toBe('pronoun');
  });

  it('reads a multi-word entry as one word', () => {
    expect(lookup('in front of')?.family).toBe('prep');
    expect(lookup('how often')?.family).toBe('wh');
  });

  /* the source writes some entries as alternatives in one cell */
  it('takes the first of an alternatives cell', () => {
    expect(lookup('until / till')?.family).toBe('prep');
  });

  it('gives the family the spelling its drawing was written for', () => {
    expect(lookup('simple present')?.value).toBe('Simple present');
    expect(lookup('what')?.value).toBe('What');
    /* Pronouns are the one place where case is meaning. */
    expect(lookup('I')?.value).toBe('I');
  });

  it('knows nothing about a word with no drawing', () => {
    expect(lookup('cricket')).toBeNull();
    expect(lookup('')).toBeNull();
    expect(lookup(null)).toBeNull();
  });
});

describe('the drawing', () => {
  it('draws every word the lookup claims', () => {
    /* Every word in the index has to survive the round trip. A family that
       lists a word it cannot draw would leave an empty cell where the column
       promised a picture. */
    const words = [
      'in', 'on', 'at', 'under', 'above', 'below', 'behind', 'beside',
      'between', 'near', 'in front of', 'there', 'here', 'before', 'after',
      'by', 'since', 'during', 'until', 'till', 'to', 'into', 'towards',
      'along', 'across', 'over', 'past', 'from', 'about', 'for', 'with',
      'as', 'like', 'per',
      'table', 'box', 'chair', 'ball', 'apple', 'cup', 'cat',
      'I', 'we', 'you', 'he', 'she', 'it', 'they',
      'a', 'an', 'the',
      'person', 'place', 'thing', 'animal',
      'and', 'but', 'or', 'because', 'so',
      'quickly', 'slowly', 'loudly', 'softly', 'always', 'usually', 'often',
      'sometimes', 'never', 'yesterday', 'today', 'tomorrow', 'well', 'badly',
      'big', 'small', 'tall', 'short', 'happy', 'sad', 'beautiful', 'good',
      'bad', 'strong', 'weak', 'fast', 'slow', 'clever', 'kind', 'brave',
      'honest',
      'what', 'when', 'where', 'why', 'who', 'whose', 'which', 'how',
      'how much', 'how many', 'how long', 'how far', 'how old', 'how often',
      'be form', 'have form', 'can', 'could', 'will', 'would', 'may', 'might',
      'must', 'shall', 'should', 'ought to',
      'simple present', 'present continuous', 'present perfect',
      'present perfect continuous', 'simple past', 'past continuous',
      'past perfect', 'past perfect continuous', 'simple future',
      'future continuous', 'future perfect', 'future perfect continuous',
      'positive', 'negative', 'question', 'yes / no question', 'imperative',
      'exclamatory',
    ];

    const undrawn = words.filter((word) => !hasArt(word));

    expect(undrawn).toEqual([]);
  });

  /* Nothing means nothing. A word with no drawing gets no cell, not a letter
     tile — a big grey "B" is decoration pretending to be a picture. */
  it('draws nothing for a word it has no picture of', () => {
    expect(artFor('cricket')).toBeNull();
    expect(hasArt('cricket')).toBe(false);

    const { container } = render(<Art word="cricket" />);

    expect(container.querySelector('svg')).toBeNull();
  });

  it('labels the drawing with the word as the source wrote it', () => {
    const { container } = render(<Art word="in front of" />);
    const svg = container.querySelector('svg');

    expect(svg?.getAttribute('aria-label')).toBe('in front of');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 48 48');
  });

  it('draws a prop from the same definition the stage uses', () => {
    /* `box` is drawn by the prop, not by a second copy of it, so the icon and
       the scene cannot drift apart. */
    const { container } = render(<Art word="box" />);

    expect(container.querySelector('svg g')).not.toBeNull();
  });
});
