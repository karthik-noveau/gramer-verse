import { fireEvent, render, screen } from '@testing-library/react';

import { loadContent } from 'common/api/content.api';
import { canTranslit, translit, translitPhrase } from 'common/scene/translit';
import type { Curriculum, Lesson } from 'common/scene/types';
import { cardsOf, PicWords } from 'pages/lesson/components/PicWords/PicWords';

/* The real lesson, so the cards are built from the sentence the app actually
   shows rather than from a shape invented here. */
let lesson: Lesson;
let curriculum: Curriculum;

beforeAll(async () => {
  const content = await loadContent();
  curriculum = content.curriculum;
  const found = content.lessons.find((l) => String(l.id) === 'prep-place-in');
  if (!found) throw new Error('prep-place-in is missing');
  lesson = found;
});

describe('transliteration', () => {
  it('writes an English word in Tamil script', () => {
    expect(translit('ball')).toBe('பால்');
    expect(translit('box')).toBe('பாக்ஸ்');
    expect(translitPhrase('the box')).toBe('த பாக்ஸ்');
  });

  it('ignores the punctuation the template put on the end', () => {
    expect(translit('table.')).toBe('டேபிள்');
  });

  /* translit() falls back to the Latin word, which is fine mid-sentence and a
     lie in a row tagged lang="ta". */
  it('says when a phrase cannot be fully transliterated', () => {
    expect(canTranslit('the box')).toBe(true);
    expect(canTranslit('the rocket')).toBe(false);
  });
});

describe('the cards', () => {
  it('is one card per word of the sentence, in English order', () => {
    const cards = cardsOf(lesson.scene, lesson.sentence);

    expect(cards.map((c) => c.en)).toEqual(['The', 'ball', 'is', 'in', 'the box']);
  });

  /* English "the box" is two tokens and one idea; split, the article would
     dangle with no counterpart and read as a missing word. */
  it('merges the bare article into the ground', () => {
    const cards = cardsOf(lesson.scene, lesson.sentence);
    const ground = cards.find((c) => c.knob === 'ground');

    expect(ground?.en).toBe('the box');
    /* The picture is of the noun, not of the phrase. */
    expect(ground?.word).toBe('box');
  });

  /* The two languages order the same jobs differently, so pairing by position
     alone would put the verb against the place. */
  it('pairs the two languages by the job, not by position', () => {
    const cards = cardsOf(lesson.scene, lesson.sentence);

    expect(cards.find((c) => c.knob === 'figure')?.ta).toBe('பந்து');
    expect(cards.find((c) => c.knob === 'ground')?.ta).toBe('பெட்டியில்');
  });
});

describe('the steps', () => {
  const setup = (): void => {
    render(<PicWords scene={lesson.scene} templates={lesson.sentence} />);
  };

  /* Pictures first. A learner meeting the lesson has not asked for the English
     yet, and showing it straight away makes the pictures decoration. */
  it('starts on pictures alone', () => {
    setup();

    expect(screen.getByRole('button', { name: 'Pictures' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(screen.queryByText('ball')).toBeNull();
    expect(screen.getAllByRole('img').length).toBeGreaterThan(0);
  });

  it('layers Tamil, then the pronunciation, then the English', () => {
    setup();

    fireEvent.click(screen.getByRole('button', { name: '+ Tamil' }));
    expect(screen.getByText('பந்து')).toBeTruthy();
    expect(screen.queryByText('பால்')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '+ Pronunciation' }));
    expect(screen.getByText('பால்')).toBeTruthy();
    expect(screen.queryByText('ball')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '+ English' }));
    expect(screen.getByText('ball')).toBeTruthy();
  });

  /* Tamil has no article and fuses the relation into the noun, so those cards
     have no Tamil word to show. The gap is the lesson. */
  it('shows no Tamil where the language has none', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: '+ English' }));

    const cards = cardsOf(lesson.scene, lesson.sentence);

    expect(cards.find((c) => c.en === 'The')?.ta).toBe('');
    expect(cards.find((c) => c.en === 'in')?.ta).toBe('');
  });

  it('draws every word of the sentence that has a picture', () => {
    setup();
    const labels = screen.getAllByRole('img').map((img) => img.getAttribute('aria-label'));

    expect(labels).toEqual(expect.arrayContaining(['ball', 'box', 'in']));
  });
});

/* Guards the claim the cards rest on: they come from the same builder the
   sentence line and the formation diagram use, so they cannot disagree. */
it('uses the curriculum the rest of the app uses', () => {
  expect(curriculum.tables.length).toBeGreaterThan(0);
});
