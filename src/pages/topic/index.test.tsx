import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';

import TopicPage from 'pages/topic/index';
import { authoredFor } from 'pages/topic/index';
import type { Lesson, LessonId, NonEmptyString, OutlineGroup, TopicId } from 'common/scene/types';
import { useContentStore } from 'store/content.store';

/* ============================================================
   /topics/:topicId — one topic, whole.

   The source table above the outline, and the outline listing
   everything the notes list — including the rows this app cannot
   draw yet, which are shown and not linked.
   ============================================================ */

const at = (path: string): ReturnType<typeof render> =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/topics/:topicId" element={<TopicPage />} />
      </Routes>
    </MemoryRouter>,
  );

beforeAll(async () => {
  await useContentStore.getState().load();
});

describe('TopicPage', () => {
  describe('prepositions — the topic with four groups', () => {
    it('names the topic in both languages', () => {
      at('/topics/prepositions');

      /* One heading carrying both scripts, the Tamil beside the English. */
      const heading = screen.getByRole('heading', { level: 1 });

      expect(heading.querySelector('[lang="en"]')?.textContent).toBe('Prepositions');
      expect(heading.querySelector('[lang="ta"]')?.textContent).toBe('இடைச்சொல்');
    });

    it('renders the topic’s source tables above the outline', () => {
      at('/topics/prepositions');
      const tables = screen.getAllByRole('table');

      expect(tables.length).toBeGreaterThanOrEqual(5);
      /* The table comes first in the document, which is what "above" means to
         anything reading the page in order. */
      const outline = screen.getByRole('heading', { name: 'What is in it' });
      expect(tables[0]?.compareDocumentPosition(outline)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('renders group tabs, because this topic declares four', () => {
      at('/topics/prepositions');

      expect(screen.getAllByRole('tab')).toHaveLength(4);
      expect(screen.getByRole('tab', { name: 'Place' })).toBeTruthy();
      expect(screen.getByRole('tab', { name: 'Time' })).toBeTruthy();
    });

    it('shows the first group’s lines, and moves when a tab is pressed', () => {
      at('/topics/prepositions');

      expect(screen.getAllByText('under').length).toBeGreaterThan(0);

      fireEvent.click(screen.getByRole('tab', { name: 'Direction' }));

      expect(screen.getByRole('tab', { selected: true }).textContent).toBe('Direction');
      expect(screen.getAllByText('towards').length).toBeGreaterThan(0);
    });

    it('links the lines this app can draw and leaves the rest as text', () => {
      at('/topics/prepositions');
      const lessons = screen
        .getAllByRole('link')
        .filter((link) => link.getAttribute('href')?.startsWith('/lessons/'));

      /* The thirteen place lessons are authored; the direction, time and other
         groups are not. */
      expect(lessons.length).toBeGreaterThanOrEqual(10);
      expect(screen.getAllByText('Not drawn yet').length).toBeGreaterThan(0);
    });

    it('starts at the first lesson of the topic — there is no resume', () => {
      at('/topics/prepositions');
      const start = screen.getByRole('link', { name: /^Start with/ });

      expect(start.getAttribute('href')).toBe('/lessons/prep-place-in');
    });

    it('leaves a trail back to the topics', () => {
      at('/topics/prepositions');
      const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });

      expect(crumbs.textContent).toContain('Topics');
      expect(crumbs.textContent).toContain('Prepositions');
      expect(crumbs.querySelector('a')?.getAttribute('href')).toBe('/topics');
    });
  });

  describe('a topic with one group', () => {
    it('renders a plain list rather than a single tab', () => {
      /* One option is not a choice, and a tab nobody can move away from is a
         control that does nothing. */
      at('/topics/articles');

      expect(screen.queryAllByRole('tab')).toHaveLength(0);
      expect(screen.getByRole('heading', { name: 'What is in it' })).toBeTruthy();
    });

    it('offers no Start when the topic has no authored lesson', () => {
      at('/topics/articles');

      expect(screen.queryByRole('link', { name: /^Start with/ })).toBeNull();
    });
  });

  describe('an address that is not a topic', () => {
    it('says so and leaves the address alone', () => {
      /* A redirect would hide the typo that caused it. */
      at('/topics/punctuation');

      expect(screen.getByText(/There is no topic called/)).toBeTruthy();
      expect(screen.getByRole('link', { name: 'All topics' }).getAttribute('href')).toBe('/topics');
      expect(screen.queryByRole('heading', { name: 'What is in it' })).toBeNull();
    });
  });
});

/* ---- matching the outline to what is authored -------------- */

const bi = (en: string, ta: string): { en: NonEmptyString; ta: NonEmptyString } => ({
  en: en as NonEmptyString,
  ta: ta as NonEmptyString,
});

const lesson = (id: string, title: string): Lesson =>
  ({
    id: id as LessonId,
    topicId: 'prepositions' as TopicId,
    order: 1,
    title: bi(title, 'x'),
  }) as Lesson;

const group = (title: string): OutlineGroup => ({ title: bi(title, 'x'), lessons: [] });

describe('authoredFor', () => {
  it('matches a line to the lesson of the same name', () => {
    const lessons = [lesson('prep-place-on', 'on')];

    expect(authoredFor(lessons, group('Place'), 'on')?.id).toBe('prep-place-on');
  });

  it('matches whatever the case', () => {
    const lessons = [lesson('prep-place-in', 'in')];

    expect(authoredFor(lessons, group('Place'), 'In')).toBeTruthy();
  });

  it('finds nothing where nothing is authored', () => {
    expect(authoredFor([], group('Place'), 'in')).toBeUndefined();
  });

  it('uses the group to tell two lines of the same name apart', () => {
    /* `in` is both a place and a time preposition, and only the place one is
       drawn. */
    const lessons = [lesson('prep-place-in', 'in'), lesson('prep-time-in', 'in')];

    expect(authoredFor(lessons, group('Place'), 'in')?.id).toBe('prep-place-in');
    expect(authoredFor(lessons, group('Time'), 'in')?.id).toBe('prep-time-in');
  });

  it('guesses at nothing when it cannot tell', () => {
    const lessons = [lesson('one', 'in'), lesson('two', 'in')];

    expect(authoredFor(lessons, group('Place'), 'in')).toBeUndefined();
  });
});
