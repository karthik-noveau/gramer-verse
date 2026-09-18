import { act, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { AppRoutes } from 'App';
import { useContentStore } from 'store/content.store';

/* The shell fills its sidebar from the content store, so every render here
   would otherwise settle a promise outside act(). Loading it up front makes
   the tests deterministic and keeps act() warnings meaning something. */
beforeEach(async () => {
  useContentStore.getState().reset();
  await act(async () => {
    await useContentStore.getState().load();
  });
});

const at = (path: string): ReturnType<typeof render> =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );

/* Every page is a lazy chunk, so every assertion here is asynchronous — the
   first frame is the Suspense fallback. */
describe('routing', () => {
  /* First in the file on purpose: once a chunk has been imported, Jest's
     module cache resolves it immediately and the fallback never renders. */
  it('shows a spinner while the chunk resolves, not a blank frame', async () => {
    at('/topics');

    expect(screen.getByRole('status')).toBeTruthy();
    /* Let the chunk land before the test ends: a suspended resource that
       resolves after the last assertion resolves outside act(). */
    await screen.findByRole('heading', { level: 1, name: 'Start anywhere' });
  });

  it.each([
    /* A regex: the headline breaks over two lines and italicises its last
       word, so its accessible name is assembled rather than typed. */
    ['/', /English grammar/],
    ['/topics', 'Start anywhere'],
    /* A regex again: the topic heading carries the Tamil beside the English,
       so its accessible name is both. */
    ['/topics/prepositions', /Prepositions/],
    ['/lessons/prep-place-in', 'in'],
    ['/topics/prepositions/visualizer', 'Preposition visualizer'],
  ] as readonly (readonly [string, string | RegExp])[])('%s renders its page', async (path, heading) => {
    at(path);

    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeTruthy();
  });

  /* Every page but one. The front door carries its own brand bar and footer,
     and a sidebar of ten topics beside it would be the app before the visitor
     has agreed to open the app. */
  it('renders the front door outside the shell', async () => {
    at('/');
    await screen.findByRole('heading', { level: 1 });

    expect(screen.queryByRole('complementary', { name: 'Topics' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Start' })).toBeTruthy();
  });

  it('renders the shell around every other page', async () => {
    at('/topics');
    await screen.findByRole('heading', { level: 1, name: 'Start anywhere' });

    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByRole('main')).toBeTruthy();
    expect(screen.getByRole('contentinfo')).toBeTruthy();
  });

  it('fills the sidebar from the content store', async () => {
    at('/topics');
    await screen.findByRole('heading', { level: 1, name: 'Start anywhere' });

    const sidebar = await screen.findByRole('complementary', { name: 'Topics' });
    await waitFor(() =>
      expect(within(sidebar).getByRole('link', { name: 'Prepositions' })).toBeTruthy(),
    );
    /* The topic index, followed by ten individual topics. */
    expect(within(sidebar).getByRole('link', { name: 'All topics' })).toBeTruthy();
    expect(sidebar.querySelectorAll('a')).toHaveLength(11);
  });

  it('marks the topic a lesson belongs to, which its URL does not say', async () => {
    at('/lessons/prep-place-in');
    await screen.findByRole('heading', { level: 1, name: 'in' });

    const sidebar = screen.getByRole('complementary', { name: 'Topics' });
    await waitFor(() =>
      expect(
        within(sidebar).getByRole('link', { name: 'Prepositions' }).getAttribute('aria-current'),
      ).toBe('page'),
    );
  });

  it('keeps the visualizer from being read as a topic id', async () => {
    at('/topics/prepositions/visualizer');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Preposition visualizer' }),
    ).toBeTruthy();
  });

  describe('unknown addresses', () => {
    it('renders not-found and shows what was asked for', async () => {
      at('/lessons/does-not-exist/nope');

      expect(await screen.findByRole('heading', { name: 'This page is not here' })).toBeTruthy();
      expect(screen.getByText('/lessons/does-not-exist/nope')).toBeTruthy();
    });

    it('does not redirect — the address stays as typed', async () => {
      at('/nope?from=email#top');
      await screen.findByRole('heading', { name: 'This page is not here' });

      expect(screen.getByText('/nope?from=email#top')).toBeTruthy();
    });

    it('offers three ways out', async () => {
      at('/nope');
      await screen.findByRole('heading', { name: 'This page is not here' });

      const page = within(screen.getByRole('alert'));

      expect(page.getByRole('link', { name: 'All topics' })).toBeTruthy();
      expect(page.getByRole('link', { name: 'Home' })).toBeTruthy();
      expect(page.getByRole('link', { name: 'Visualizer' })).toBeTruthy();
    });

    /* An id that does not exist is the page's own empty state, not a 404, and
       the address is left as it was typed. What matters here is that the
       router does not turn it into a not-found. */
    it('routes an unknown topic id to the topic page, not to not-found', async () => {
      at('/topics/not-a-topic');

      expect(await screen.findByText(/There is no topic called/)).toBeTruthy();
      expect(screen.queryByText(/Nothing at this address/i)).toBeNull();
    });

    it('routes an unknown lesson id to the lesson page, not to not-found', async () => {
      at('/lessons/not-a-lesson');

      expect(await screen.findByText(/There is no lesson called/)).toBeTruthy();
    });
  });

  describe('addresses that moved', () => {
    it('sends /dashboard to topics', async () => {
      at('/dashboard');

      expect(await screen.findByRole('heading', { level: 1, name: 'Start anywhere' })).toBeTruthy();
    });

    it('sends /practice to the visualizer', async () => {
      at('/practice');

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Preposition visualizer' }),
      ).toBeTruthy();
    });
  });

  describe('sloppy addresses', () => {
    it('ignores a trailing slash', async () => {
      at('/topics/');

      expect(await screen.findByRole('heading', { level: 1, name: 'Start anywhere' })).toBeTruthy();
    });

    it('ignores case', async () => {
      at('/Topics');

      expect(await screen.findByRole('heading', { level: 1, name: 'Start anywhere' })).toBeTruthy();
    });
  });
});
