import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { ContentError } from 'common/api/validate';
import TopicsPage from 'pages/topics/index';
import { useContentStore } from 'store/content.store';

/* ============================================================
   /topics — the way in.

   The topic index stays concise and builds every card directly
   from the authored curriculum.
   ============================================================ */

const renderPage = (): ReturnType<typeof render> =>
  render(
    <MemoryRouter>
      <TopicsPage />
    </MemoryRouter>,
  );

const ready = async (): Promise<void> => {
  await useContentStore.getState().load();
};

describe('TopicsPage', () => {
  describe('with the shipped content', () => {
    beforeEach(async () => {
      await ready();
    });

    it('renders every topic, in teaching order', () => {
      renderPage();
      const cards = screen.getAllByRole('link').filter((link) => /^\/topics\/[a-z-]+$/.test(link.getAttribute('href') ?? ''));

      expect(cards).toHaveLength(10);
      /* Teaching order, which is the topics' own `order` and not the order the
         file happens to list them in. */
      expect(cards[0]?.textContent).toContain('Tenses');
      expect(cards[0]?.textContent).toContain('1');
    });

    it('counts the lessons of each topic from its own list', () => {
      renderPage();
      const prepositions = screen
        .getAllByRole('link')
        .find((link) => link.getAttribute('href') === '/topics/prepositions');

      expect(prepositions?.textContent).toContain('13 lessons');
    });

    it('keeps the introduction concise', () => {
      renderPage();

      expect(screen.getByRole('heading', { name: 'Start anywhere.' })).toBeTruthy();
      expect(screen.queryByText(/Nothing is locked/)).toBeNull();
      expect(screen.queryByText(/எங்கிருந்தும் தொடங்கலாம்/)).toBeNull();
    });

    it('offers the one thing that is not a topic, in one click', () => {
      renderPage();
      const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'));

      expect(hrefs).toContain('/topics/prepositions/visualizer');
    });

    it('reports no progress of any kind', () => {
      /* None exists in this product, and a page must not invent a metric to
         fill space. */
      const { container } = renderPage();

      expect(container.textContent).not.toMatch(/streak|continue where|% complete/i);
    });

    it('locks nothing', () => {
      renderPage();

      for (const link of screen.getAllByRole('link')) {
        expect(link.getAttribute('aria-disabled')).toBeNull();
      }
    });
  });

  describe('before and instead of content', () => {
    beforeEach(() => {
      useContentStore.getState().reset();
    });

    it('shows the shape of the answer while it is on its way', async () => {
      const { container } = renderPage();

      expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
      expect(screen.queryByRole('alert')).toBeNull();
      await waitFor(() => expect(useContentStore.getState().status).toBe('ready'));
    });

    it('names the file and the rule when the content will not load', () => {
      /* `load` is replaced as well as the status: the page asks for content on
         mount, and a store that would happily load on the second ask never
         stays in the state this test is about. */
      useContentStore.setState({
        load: () => Promise.resolve(),
        status: 'error',
        error: new ContentError([
          { file: 'lessons/prepositions-place.json', path: 'lessons[0].why.ta', rule: 'Tamil text is missing or empty' },
        ]),
        topics: [],
        lessons: [],
        lexicon: null,
      });

      renderPage();

      expect(screen.getByRole('alert')).toBeTruthy();
      expect(
        screen.getByText(/lessons\[0\]\.why\.ta → Tamil text is missing or empty/),
      ).toBeTruthy();
      expect(screen.getByRole('link', { name: 'Back to the start' })).toBeTruthy();
    });

    it('says so plainly when there is nothing in the curriculum', () => {
      useContentStore.setState({
        load: () => Promise.resolve(),
        status: 'ready',
        topics: [],
        lessons: [],
        lexicon: { props: [], verbs: [], propIds: new Set(), verbIds: new Set() },
        curriculum: { outlines: [], tables: [], corrections: [], formation: { rows: {}, words: {} } },
        error: null,
      });

      renderPage();

      expect(screen.getByText('No topics yet')).toBeTruthy();
      /* An empty screen with no exit is a dead end. */
      expect(screen.getByRole('link', { name: 'Back to the start' })).toBeTruthy();
    });
  });
});
