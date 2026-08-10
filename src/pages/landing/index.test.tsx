import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import LandingPage from 'pages/landing/index';
import { useContentStore } from 'store/content.store';

/* ============================================================
   The front door.

   Two things it has to do that no other page does: carry its own
   chrome, and prove the product works before the visitor has
   agreed to open it. The demo beside the headline is the real
   renderer with the real sentence builder under it, so most of
   what is asserted here is that it is running.
   ============================================================ */

const renderPage = (): ReturnType<typeof render> =>
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );

/* Loaded once, before anything renders. The store caches it, so every test
   below starts with the count already in hand and nothing settles mid-test —
   except the one test that is about exactly that, which clears it first. */
beforeAll(async () => {
  await useContentStore.getState().load();
});

describe('LandingPage', () => {
  it('carries its own brand bar and footer', () => {
    /* No shell: the sidebar of ten topics beside it would be the app before
       the visitor has agreed to open the app. */
    renderPage();

    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByRole('contentinfo')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Footer' })).toBeTruthy();
  });

  it('says what the product is, in both languages', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('English grammar');
    expect(screen.getByText('ஒரு சொல்லை மாற்றுங்கள், படம் மாறும்.')).toBeTruthy();
  });

  it('offers one way in, and the bar offers the same one', () => {
    renderPage();
    const start = screen.getByRole('link', { name: 'Start' });
    const open = screen.getByRole('link', { name: 'Open the app' });

    expect(start.getAttribute('href')).toBe('/topics');
    expect(open.getAttribute('href')).toBe('/topics');
  });

  it('lists no topics — that is the page Start goes to', () => {
    /* The eyebrow carries the count and Start carries the rest. Ten topic
       names here would be /topics rendered smaller on the page whose only job
       is to send you to /topics. */
    renderPage();

    const links = screen.getAllByRole('link').map((link) => link.getAttribute('href') ?? '');

    /* No link to any single topic. The visualizer lives under /topics/ too and
       is a footer link, not a topic. */
    expect(links.filter((href) => /^\/topics\/[a-z-]+$/.test(href))).toEqual([]);
  });

  describe('the demo', () => {
    it('draws a real scene, cropped to the part that matters', () => {
      renderPage();
      const stage = screen.getByRole('img');

      expect(stage.getAttribute('viewBox')).toBe('196 100 384 252');
      expect(stage.querySelectorAll('g').length).toBeGreaterThan(0);
    });

    it('describes the scene it is showing', () => {
      renderPage();

      expect(screen.getByRole('img').getAttribute('aria-label')).toBe('the ball in the box');
    });

    it('says the sentence under it, in both languages', () => {
      const { container } = renderPage();

      expect(container.querySelector('[lang="en"]')?.textContent).toContain('The ball is in');
      expect(container.textContent).toContain('பெட்டியில்');
    });

    it('changes the picture and the sentence when a word is pressed', () => {
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /behind/ }));

      expect(screen.getByRole('img').getAttribute('aria-label')).toBe('the ball behind the box');
      expect(screen.getByRole('button', { name: /behind/ }).getAttribute('aria-pressed')).toBe(
        'true',
      );
    });

    it('swaps the ground rather than drawing a lie', () => {
      /* A box has nothing beneath it. The renderer is asked; the page keeps no
         second list of what fits under what. */
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /under/ }));

      expect(screen.getByRole('img').getAttribute('aria-label')).toBe('the ball under the table');
    });
  });

  describe('the eyebrow', () => {
    it('renders the hero before the content has loaded', async () => {
      /* A blank hero during load defeats the purpose of the page. */
      act(() => {
        useContentStore.getState().reset();
      });
      renderPage();

      expect(useContentStore.getState().status).not.toBe('ready');
      expect(screen.getByRole('img')).toBeTruthy();
      expect(screen.getByRole('link', { name: 'Start' })).toBeTruthy();
      expect(screen.queryByText(/topics · .* lessons/)).toBeNull();

      await waitFor(() => expect(useContentStore.getState().status).toBe('ready'));
    });

    it('counts the topics and lessons from the content, not from the markup', async () => {
      renderPage();

      await waitFor(() =>
        expect(screen.getByText(/topics · .* lessons/).textContent).toContain('10 topics'),
      );
      expect(screen.getByText(/topics · .* lessons/).textContent).toContain('13 lessons');
    });
  });

  describe('the cycle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      act(() => {
        jest.runOnlyPendingTimers();
      });
      jest.useRealTimers();
    });

    it('moves on by itself, so the page demonstrates itself without a click', () => {
      renderPage();
      expect(screen.getByRole('img').getAttribute('aria-label')).toContain('in the box');

      act(() => {
        jest.advanceTimersByTime(2300);
      });

      expect(screen.getByRole('img').getAttribute('aria-label')).toContain('on the box');
    });

    it('stops as soon as the visitor takes over', () => {
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /beside/ }));
      act(() => {
        jest.advanceTimersByTime(9000);
      });

      expect(screen.getByRole('img').getAttribute('aria-label')).toContain('beside the box');
    });

    it('never starts for a visitor who asked for less motion', () => {
      window.matchMedia = ((query: string) => ({
        matches: query.includes('reduce'),
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      })) as unknown as typeof window.matchMedia;

      renderPage();
      act(() => {
        jest.advanceTimersByTime(9000);
      });

      expect(screen.getByRole('img').getAttribute('aria-label')).toContain('in the box');

      // @ts-expect-error putting jsdom back the way it was found
      delete window.matchMedia;
    });
  });

  it('explains a lesson in three lines, in both languages', () => {
    renderPage();

    expect(screen.getByText('யூகியுங்கள்')).toBeTruthy();
    expect(screen.getByText(/Being wrong here is the point/)).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });
});
