import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { LessonRow } from 'pages/topic/components/LessonRow/LessonRow';
import type {
  Lesson,
  LessonId,
  NonEmptyString,
  OutlineLesson,
  PlaceSpec,
  PropId,
  TopicId,
} from 'common/scene/types';

const bi = (en: string, ta: string): { en: NonEmptyString; ta: NonEmptyString } => ({
  en: en as NonEmptyString,
  ta: ta as NonEmptyString,
});

const OUTLINE: OutlineLesson = {
  title: 'in' as NonEmptyString,
  titleTa: 'உள்ளே' as NonEmptyString,
  example: bi('The ball is in the box.', 'பந்து பெட்டியில் உள்ளது.'),
};

const SCENE: PlaceSpec = {
  kind: 'place',
  figure: 'ball' as PropId,
  ground: 'box' as PropId,
  ground2: null,
  relation: 'in',
  determiner: 'the',
  count: 1,
  adjective: null,
};

const LESSON: Lesson = {
  id: 'prep-place-in' as LessonId,
  topicId: 'prepositions' as TopicId,
  order: 1,
  title: bi('in', 'உள்ளே'),
  idea: bi('Inside something.', 'ஒன்றின் உள்ளே.'),
  scene: SCENE,
  knobs: [],
  predict: null,
  why: bi('The box has sides.', 'பெட்டிக்குப் பக்கங்கள் உள்ளன.'),
  sentence: { en: [{ slot: 'figure' }], ta: [{ slot: 'figure', case: 'nominative' }] },
};

const renderRow = (props: Partial<Parameters<typeof LessonRow>[0]> = {}): ReturnType<typeof render> =>
  render(
    <MemoryRouter>
      <ul>
        <LessonRow n={1} outline={OUTLINE} {...props} />
      </ul>
    </MemoryRouter>,
  );

describe('LessonRow', () => {
  it('names the line in both languages', () => {
    renderRow();

    expect(screen.getByText('in')).toBeTruthy();
    expect(screen.getByText('உள்ளே')).toBeTruthy();
  });

  it('shows the example sentence the notes gave, in both languages', () => {
    renderRow();

    expect(screen.getByText('The ball is in the box.')).toBeTruthy();
    expect(screen.getByText('பந்து பெட்டியில் உள்ளது.')).toBeTruthy();
  });

  it('says nothing where the notes gave no Tamil, rather than inventing one', () => {
    /* Thirty-two rows of the outline are English example sentences the source
       never translated. A gloss made up here would be the app putting words
       into the notes' mouth. */
    const { container } = renderRow({
      outline: { title: 'This is a pen' as NonEmptyString, titleTa: null, example: null },
    });

    expect(screen.getByText('This is a pen')).toBeTruthy();
    expect(container.querySelectorAll('[lang="ta"]')).toHaveLength(0);
  });

  it('links to a lesson this app can draw', () => {
    renderRow({ lesson: LESSON });

    expect(screen.getByRole('link').getAttribute('href')).toBe('/lessons/prep-place-in');
    expect(screen.getByText('Drawn')).toBeTruthy();
  });

  it('is not a link when there is no lesson behind it', () => {
    /* Still listed: the notes are the curriculum, and hiding what is not built
       yet would make the topic look shorter than it is. */
    renderRow();

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Not drawn yet')).toBeTruthy();
  });

  it('numbers the line', () => {
    renderRow({ n: 7 });

    expect(screen.getByText('7')).toBeTruthy();
  });
});
