import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { TopicCard } from 'pages/topics/components/TopicCard/TopicCard';
import type { LessonId, NonEmptyString, Topic, TopicId } from 'common/scene/types';

const bi = (en: string, ta: string): { en: NonEmptyString; ta: NonEmptyString } => ({
  en: en as NonEmptyString,
  ta: ta as NonEmptyString,
});

const TOPIC: Topic = {
  id: 'prepositions' as TopicId,
  order: 5,
  title: bi('Prepositions', 'இடைச்சொல்'),
  summary: bi('Where things are.', 'பொருள்கள் எங்கே இருக்கின்றன.'),
  lessonIds: ['prep-place-in', 'prep-place-on'] as LessonId[],
};

const renderCard = (topic = TOPIC, lessons = 2): ReturnType<typeof render> =>
  render(
    <MemoryRouter>
      <TopicCard topic={topic} lessons={lessons} />
    </MemoryRouter>,
  );

describe('TopicCard', () => {
  it('names the topic in both languages', () => {
    renderCard();

    expect(screen.getByText('Prepositions')).toBeTruthy();
    expect(screen.getByText('இடைச்சொல்')).toBeTruthy();
  });

  /* Led by the question the topic answers: the summaries are answers with no
     subject, and ten of them under ten headings read as fragments. */
  it('says what the topic is, in both languages', () => {
    renderCard();

    expect(screen.getByText('What are Prepositions? Where things are.')).toBeTruthy();
    expect(
      screen.getByText('இடைச்சொல் என்றால் என்ன? பொருள்கள் எங்கே இருக்கின்றன.'),
    ).toBeTruthy();
  });

  it('links to the topic, inside the app', () => {
    renderCard();

    expect(screen.getByRole('link').getAttribute('href')).toBe('/topics/prepositions');
  });

  it('counts the lessons it was given', () => {
    renderCard();

    expect(screen.getByText('2 lessons')).toBeTruthy();
  });

  it('says one lesson rather than 1 lessons', () => {
    renderCard(TOPIC, 1);

    expect(screen.getByText('1 lesson')).toBeTruthy();
  });

  it('says a topic with none is not written yet, rather than showing an empty bar', () => {
    /* Zero is a real answer, and it is not a failure. */
    renderCard({ ...TOPIC, lessonIds: [] }, 0);

    expect(screen.getByText('No lessons yet')).toBeTruthy();
  });

  it('reports no progress, because there is none in this product', () => {
    const { container } = renderCard();

    expect(container.querySelector('progress')).toBeNull();
    expect(container.textContent).not.toMatch(/%|complete|streak/i);
  });

  it('is never locked or dimmed', () => {
    renderCard({ ...TOPIC, lessonIds: [] }, 0);

    expect(screen.getByRole('link').getAttribute('aria-disabled')).toBeNull();
  });
});
