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

const renderCard = (topic = TOPIC): ReturnType<typeof render> =>
  render(
    <MemoryRouter>
      <TopicCard topic={topic} />
    </MemoryRouter>,
  );

describe('TopicCard', () => {
  it('names the topic in both languages', () => {
    renderCard();

    expect(screen.getByText('Prepositions')).toBeTruthy();
    expect(screen.getByText('இடைச்சொல்')).toBeTruthy();
  });

  it('does not repeat a topic explanation on the index card', () => {
    renderCard();

    expect(screen.queryByText(/What are Prepositions/)).toBeNull();
    expect(screen.queryByText(/பொருள்கள் எங்கே இருக்கின்றன/)).toBeNull();
  });

  it('links to the topic, inside the app', () => {
    renderCard();

    expect(screen.getByRole('link').getAttribute('href')).toBe('/topics/prepositions');
  });

  it('keeps lesson counts inside the topic rather than ranking cards by them', () => {
    renderCard();

    expect(screen.queryByText(/lessons?/i)).toBeNull();
  });

  it('reports no progress, because there is none in this product', () => {
    const { container } = renderCard();

    expect(container.querySelector('progress')).toBeNull();
    expect(container.textContent).not.toMatch(/%|complete|streak/i);
  });

  it('is never locked or dimmed', () => {
    renderCard({ ...TOPIC, lessonIds: [] });

    expect(screen.getByRole('link').getAttribute('aria-disabled')).toBeNull();
  });
});
