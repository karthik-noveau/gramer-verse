import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';

import LessonPage from 'pages/lesson/index';
import { HOLD_MS } from 'pages/lesson/hooks/usePredict';
import { useContentStore } from 'store/content.store';
import { useLessonStore } from 'store/lesson.store';
import { useUiStore } from 'store/ui.store';

/* ============================================================
   /lessons/:lessonId — the product.

   Engines 16 to 21 are each tested where they live; what is
   checked here is that they are wired to each other. The last
   test is the whole loop in one go: predict, be wrong, watch the
   correction, turn a knob, read both sentences, move on.
   ============================================================ */

const at = (path: string): ReturnType<typeof render> =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/lessons/:lessonId" element={<LessonPage />} />
      </Routes>
    </MemoryRouter>,
  );

/* Scoped to the stage: the picture-words row above it is drawings too, and
   every one of them is a labelled image. */
const stage = (): SVGSVGElement =>
  document.querySelector('.stage svg[role="img"]') as unknown as SVGSVGElement;

beforeAll(async () => {
  await useContentStore.getState().load();
});

beforeEach(() => {
  useLessonStore.getState().reset();
  useUiStore.setState({ skipPredict: false });
});

describe('LessonPage', () => {
  describe('the workspace', () => {
    it('names the lesson in both languages', () => {
      at('/lessons/prep-place-in');

      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('in');
      expect(screen.getByText('உள்ளே')).toBeTruthy();
    });

    it('says the one idea of the lesson, in both languages', () => {
      at('/lessons/prep-place-on');

      expect(screen.getByText('Touching the top of something.')).toBeTruthy();
      expect(screen.getByText('ஒன்றின் மேற்பரப்பைத் தொட்டு இருப்பது.')).toBeTruthy();
    });

    it('draws the lesson’s own scene', () => {
      at('/lessons/prep-place-in');

      expect(stage().getAttribute('aria-label')).toBe('the ball in the box');
    });

    it('says the sentence under it, in both languages', () => {
      const { container } = at('/lessons/prep-place-in');

      expect(container.textContent).toContain('The ball is in the box');
      expect(container.textContent).toContain('பந்து பெட்டியில் உள்ளது');
    });

    it('explains why the picture looks like that', () => {
      at('/lessons/prep-place-in');
      const why = screen.getByRole('region', { name: /Why the picture/ });

      expect(within(why).getByText(/sides/i)).toBeTruthy();
    });

    it('does not repeat page navigation as a breadcrumb', () => {
      at('/lessons/prep-place-in');
      expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).toBeNull();
    });

    it('keeps the source table behind a drawer rather than on the page', () => {
      at('/lessons/prep-place-in');

      expect(screen.queryByRole('dialog')).toBeNull();

      fireEvent.click(screen.getByRole('button', { name: 'Open notes' }));

      const drawer = screen.getByRole('dialog');
      expect(within(drawer).getAllByRole('table').length).toBeGreaterThan(0);
    });
  });

  describe('the question', () => {
    it('locks the knobs until it is answered', () => {
      at('/lessons/prep-place-in');
      const place = within(screen.getByRole('group', { name: /The place/ }));

      for (const chip of place.getAllByRole('button')) {
        expect(chip.getAttribute('aria-disabled')).toBe('true');
      }
    });

    it('hides the knob the question is about', () => {
      /* The relation knob is what the question asks about, and a disabled
         control would still show which option is set — which is the answer. */
      at('/lessons/prep-place-in');

      expect(screen.queryByRole('group', { name: /The word/ })).toBeNull();
    });

    it('unlocks and shows the knob once it is answered', () => {
      at('/lessons/prep-place-in');

      fireEvent.click(screen.getByText('inside the box'));
      const place = within(screen.getByRole('group', { name: /The place/ }));

      expect(screen.getByRole('group', { name: /The word/ })).toBeTruthy();
      expect(place.getAllByRole('button')[0]?.getAttribute('aria-disabled')).toBeNull();
    });

    it('skips the question entirely when the learner has turned it off', () => {
      useUiStore.setState({ skipPredict: true });
      at('/lessons/prep-place-in');

      expect(screen.queryByText('inside the box')).toBeNull();
      expect(screen.getByRole('group', { name: /The word/ })).toBeTruthy();
    });
  });

  describe('the whole loop', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      act(() => {
        jest.runOnlyPendingTimers();
      });
      jest.useRealTimers();
    });

    it('predicts wrongly, draws it, corrects it, then takes a knob', () => {
      at('/lessons/prep-place-in');
      expect(stage().getAttribute('aria-label')).toBe('the ball in the box');

      /* Say the wrong thing. */
      fireEvent.click(screen.getByText('on top of the box'));

      /* And there it is, drawn — the ball on the box, where the learner said
         it would be. */
      expect(stage().getAttribute('aria-label')).toBe('the ball on the box');
      expect(screen.getByText('What you said')).toBeTruthy();
      expect(screen.getByText('What is true here')).toBeTruthy();

      /* Then the truth. */
      act(() => {
        jest.advanceTimersByTime(HOLD_MS + 50);
      });
      expect(stage().getAttribute('aria-label')).toBe('the ball in the box');

      /* The knobs are open now, and one of them changes the picture and both
         sentences together. */
      fireEvent.click(within(screen.getByRole('group', { name: /How many/ })).getByText('two'));

      expect(stage().getAttribute('aria-label')).toBe('two balls in the box');
      expect(screen.getByText('balls')).toBeTruthy();
      expect(screen.getByText('பந்துகள்')).toBeTruthy();
    });
  });

  describe('moving on', () => {
    it('offers the next lesson of the topic', () => {
      at('/lessons/prep-place-in');
      const next = screen.getByRole('link', { name: /→$/ });

      expect(next.getAttribute('href')).toBe('/lessons/prep-place-on');
    });

    it('links back to the topic', () => {
      at('/lessons/prep-place-in');

      expect(screen.getByRole('link', { name: /All prepositions/ }).getAttribute('href')).toBe(
        '/topics/prepositions',
      );
    });

    it('says so at the end rather than offering a button that goes nowhere', () => {
      /* `there` is the last authored lesson, and no later topic has any. */
      at('/lessons/prep-place-there');

      expect(screen.getByText(/last lesson written so far/)).toBeTruthy();
      expect(screen.queryByRole('link', { name: /→$/ })).toBeNull();
    });

    it('starts the next lesson clean', () => {
      const { unmount } = at('/lessons/prep-place-in');
      fireEvent.click(screen.getByText('inside the box'));
      fireEvent.click(within(screen.getByRole('group', { name: /How many/ })).getByText('two'));
      unmount();

      at('/lessons/prep-place-on');

      /* Engine 18 resets on close; what is checked here is that this page
         actually triggers it. */
      expect(useLessonStore.getState().predict.answered).toBe(false);
      expect(stage().getAttribute('aria-label')).toBe('the book on the table');
    });
  });

  it('says so when the address is not a lesson, and keeps the address', () => {
    at('/lessons/not-a-lesson');

    expect(screen.getByText(/There is no lesson called/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'All topics' }).getAttribute('href')).toBe('/topics');
    expect(screen.queryByRole('img')).toBeNull();
  });
});
