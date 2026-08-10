import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import VisualizerPage from 'pages/visualizer/index';
import { useVisualizerStore } from 'store/visualizer.store';

/* ============================================================
   The visualizer.

   Two ways to a picture — typing a sentence and pressing a word
   — and a refusal that is a first-class outcome rather than an
   error. What is checked here is that both ways work and that
   neither takes the learner's own sentence away.
   ============================================================ */

const renderPage = (): ReturnType<typeof render> =>
  render(
    <MemoryRouter>
      <VisualizerPage />
    </MemoryRouter>,
  );

/** The picture, not the word-order diagram beside it — both are images, and
 *  both should be. */
const stage = (): SVGSVGElement =>
  screen
    .getAllByRole('img')
    .find((node) => node.closest('[class*="stage"]') !== null) as unknown as SVGSVGElement;
const field = (): HTMLInputElement => screen.getByLabelText('Sentence to draw') as HTMLInputElement;

beforeEach(() => {
  useVisualizerStore.getState().reset();
});

describe('VisualizerPage', () => {
  it('draws the opening sentence', () => {
    renderPage();

    expect(stage().getAttribute('aria-label')).toBe('the ball in the box');
  });

  it('says the sentence in both languages, neither of them labelled', () => {
    const { container } = renderPage();

    expect(container.querySelector('[class*="lineTa"]')?.textContent).toContain('பெட்டியில்');
    expect(container.textContent).toContain('The ball is in the box.');
    /* Which language a line is in is legible from the script. */
    expect(container.textContent).not.toMatch(/English:|Tamil:/);
  });

  describe('typing', () => {
    it('draws on Enter, with no submit button anywhere', () => {
      renderPage();

      expect(screen.queryByRole('button', { name: /draw|submit|go/i })).toBeNull();

      fireEvent.change(field(), { target: { value: 'a red apple is under the table' } });
      fireEvent.submit(field().closest('form') as HTMLFormElement);

      expect(stage().getAttribute('aria-label')).toBe('a red apple under the table');
    });

    it('moves the controls to match what was typed', () => {
      renderPage();

      fireEvent.change(field(), { target: { value: 'three cups are on the chair' } });
      fireEvent.submit(field().closest('form') as HTMLFormElement);

      const picker = within(screen.getByRole('group', { name: 'Preposition' }));
      expect(picker.getByRole('button', { name: /^on/ }).getAttribute('aria-pressed')).toBe('true');
      expect(
        within(screen.getByRole('group', { name: /How many/ }))
          .getByRole('button', { name: 'three' })
          .getAttribute('aria-pressed'),
      ).toBe('true');
    });

    it('fills and draws in one click from an example', () => {
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /the cat is behind the chair/ }));

      expect(field().value).toBe('the cat is behind the chair');
      expect(stage().getAttribute('aria-label')).toBe('the cat behind the chair');
    });
  });

  describe('what it cannot draw', () => {
    it('names the words rather than failing', () => {
      renderPage();

      fireEvent.change(field(), { target: { value: 'the rocket is on the launchpad' } });
      fireEvent.submit(field().closest('form') as HTMLFormElement);

      expect(screen.getByText('rocket')).toBeTruthy();
      expect(screen.getByText('launchpad')).toBeTruthy();
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('draws the nearest sentence when it is taken, and types it in', () => {
      renderPage();

      fireEvent.change(field(), { target: { value: 'the rocket is on the launchpad' } });
      fireEvent.submit(field().closest('form') as HTMLFormElement);
      fireEvent.click(screen.getByRole('button', { name: 'Try it' }));

      expect(field().value).toContain('ball');
      expect(screen.queryByText(/Not in the drawing library/)).toBeNull();
      expect(stage()).toBeTruthy();
      expect(stage().getAttribute('aria-label')).toContain('ball');
    });
  });

  describe('the picker', () => {
    it('shows the words of the chosen group', () => {
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /^Direction/ }));
      const picker = within(screen.getByRole('group', { name: 'Preposition' }));

      expect(picker.getByRole('button', { name: /^towards/ })).toBeTruthy();
      expect(picker.queryByRole('button', { name: /^behind/ })).toBeNull();
    });

    it('draws a direction with its own renderer', () => {
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /^Direction/ }));
      fireEvent.click(
        within(screen.getByRole('group', { name: 'Preposition' })).getByRole('button', {
          name: /^over/,
        }),
      );

      expect(stage().getAttribute('aria-label')).toContain('moving over');
    });

    it('hides the knobs and says why, for a word they cannot move', () => {
      /* A knob that changes nothing is worse than no knob. */
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /^Time/ }));

      expect(screen.queryByRole('group', { name: /How many/ })).toBeNull();
      expect(screen.getByText(/a diagram, not a scene/)).toBeTruthy();
    });

    it('does not rewrite the learner’s sentence', () => {
      renderPage();

      fireEvent.change(field(), { target: { value: 'my own words' } });
      fireEvent.click(
        within(screen.getByRole('group', { name: 'Preposition' })).getByRole('button', {
          name: /^under/,
        }),
      );

      /* And the ground was swapped for one that can hold it: a box has nothing
         beneath it, so `under` moves to the table rather than drawing nothing. */
      expect(field().value).toBe('my own words');
      expect(stage().getAttribute('aria-label')).toBe('the ball under the table');
    });
  });

  it('leaves a trail back through prepositions', () => {
    renderPage();
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });

    expect(within(crumbs).getByRole('link', { name: 'Prepositions' }).getAttribute('href')).toBe(
      '/topics/prepositions',
    );
  });
});
