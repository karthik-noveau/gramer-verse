import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import VisualizerPage from 'pages/visualizer/index';
import { useVisualizerStore } from 'store/visualizer.store';
import { useContentStore } from 'store/content.store';
import { examplesFor } from 'pages/visualizer/utils/examples';

/* ============================================================
   The visualizer.

   Examples and relationship controls update the picture. The caption
   stays read-only; saved drafts and unsupported scene feedback are retained.
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

beforeAll(async () => { await useContentStore.getState().load(); });

beforeEach(() => {
  useVisualizerStore.getState().reset();
});

describe('VisualizerPage', () => {
  it.each([
    ['Direction', 'prep-dir'], ['Time', 'prep-time'], ['Other roles', 'prep-other'],
  ])('shows sentences, Tamil, audio and formation for every %s word', (label, group) => {
    const { container } = renderPage();
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Preposition group' }))
      .getByRole('button', { name: new RegExp(`^${label}`) }));
    for (const example of examplesFor(useContentStore.getState().curriculum, group as string)) {
      fireEvent.click(within(screen.getByRole('group', { name: 'Preposition' }))
        .getByRole('button', { name: example.word }));
      expect(container.querySelector('[class*="lineEn"]')?.textContent).toBe(example.en);
      expect(container.querySelector('[class*="lineTa"]')?.textContent).toBe(example.formation?.ta);
      expect(screen.getByRole('group', { name: 'Listen to the visualized sentence' })).toBeTruthy();
      expect(screen.getByRole('region', { name: 'Formation' })).toBeTruthy();
      expect(field().value).toBe(example.en);
    }
  });

  it('offers time sentences in the dropdown and selects them as time, not place', () => {
    const { container } = renderPage();
    fireEvent.click(screen.getByRole('button', { name: /^Time/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Choose an example sentence' }));
    expect(screen.getAllByRole('option')).toHaveLength(9);
    expect(screen.queryByRole('option', { name: 'the ball is in the box' })).toBeNull();
    fireEvent.click(screen.getByRole('option', { name: 'The meeting is on Monday' }));
    expect(useVisualizerStore.getState().group).toBe('prep-time');
    expect(useVisualizerStore.getState().cannot).toBeNull();
    expect(container.querySelector('[class*="lineEn"]')?.textContent).toBe('The meeting is on Monday');
  });
  it('draws the opening sentence', () => {
    renderPage();

    expect(stage().getAttribute('aria-label')).toBe('the ball in the box');
  });

  it('frames the cutaway and tabletop closely, retaining the full stage for distance', () => {
    renderPage();
    const closeUp = stage().getAttribute('viewBox')?.split(' ').map(Number) ?? [];
    expect(closeUp[2]).toBe(520);
    expect((closeUp[2] ?? 0) / (closeUp[3] ?? 1)).toBeCloseTo(720 / 420);

    fireEvent.click(within(screen.getByRole('group', { name: 'Preposition' }))
      .getByRole('button', { name: 'on' }));
    const tabletop = stage().getAttribute('viewBox')?.split(' ').map(Number) ?? [];
    expect(tabletop[2]).toBeLessThan(720);
    expect((tabletop[2] ?? 0) / (tabletop[3] ?? 1)).toBeCloseTo(720 / 420);
    fireEvent.click(within(screen.getByRole('group', { name: 'Preposition' }))
      .getByRole('button', { name: 'near' }));
    expect(stage().getAttribute('viewBox')).toBe('0 0 720 420');
  });

  it('says the sentence in both languages, neither of them labelled', () => {
    const { container } = renderPage();

    expect(container.querySelector('[class*="lineTa"]')?.textContent).toContain('பெட்டியில்');
    expect(container.textContent).toContain('The ball is in the box.');
    /* Which language a line is in is legible from the script. */
    expect(container.textContent).not.toMatch(/English:|Tamil:/);
  });

  it('offers normal and slow voice playback for the visualized sentence', () => {
    renderPage();

    const listen = within(screen.getByRole('group', { name: 'Listen to the visualized sentence' }));
    expect(listen.getByRole('button', { name: /Hear/ })).toBeTruthy();
    expect(listen.getByRole('button', { name: /Slow/ })).toBeTruthy();
  });

  describe('choosing sentences', () => {
    it('keeps the caption read-only without a form that can submit it', () => {
      renderPage();

      expect(field().readOnly).toBe(true);
      expect(field().closest('form')).toBeNull();
      fireEvent.focus(field());
      fireEvent.keyDown(field(), { key: 'Enter' });
      expect(stage().getAttribute('aria-label')).toBe('the ball in the box');
    });

    it('moves the controls to match the chosen example', () => {
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: 'Choose an example sentence' }));
      fireEvent.click(screen.getByRole('option', { name: 'three cups are on the table' }));

      const picker = within(screen.getByRole('group', { name: 'Preposition' }));
      expect(picker.getByRole('button', { name: /^on/ }).getAttribute('aria-pressed')).toBe('true');
      expect(
        within(screen.getByRole('group', { name: /How many/ }))
          .getByRole('button', { name: 'three' })
          .getAttribute('aria-pressed'),
      ).toBe('true');
    });

    it('draws immediately when an example is chosen, without a separate button', () => {
      renderPage();

      expect(screen.queryByRole('listbox')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Draw' })).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'Choose an example sentence' }));
      fireEvent.click(screen.getByRole('option', { name: 'the cat is behind the chair' }));

      expect(field().value).toBe('the cat is behind the chair');
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(stage().getAttribute('aria-label')).toBe('the cat behind the chair');
    });

    it('draws an example when the keyboard selection is confirmed with Enter', () => {
      renderPage();

      fireEvent.keyDown(field(), { key: 'ArrowDown' });
      fireEvent.keyDown(field(), { key: 'ArrowDown' });
      fireEvent.keyDown(field(), { key: 'Enter' });

      expect(field().value).toBe('a red apple is under the table');
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(stage().getAttribute('aria-label')).toBe('a red apple under the table');
    });

    it('dismisses the dropdown with Escape and outside clicks without changing the sentence', () => {
      renderPage();

      const sentence = field().value;
      fireEvent.keyDown(field(), { key: 'ArrowDown' });
      fireEvent.keyDown(field(), { key: 'Escape' });
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(field().value).toBe(sentence);

      fireEvent.click(screen.getByRole('button', { name: 'Choose an example sentence' }));
      fireEvent.pointerDown(document.body);
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(field().value).toBe(sentence);
    });
  });

  describe('what it cannot draw', () => {
    it('names the words rather than failing', () => {
      renderPage();

      act(() => useVisualizerStore.getState().submit('the rocket is on the launchpad'));

      expect(screen.getByText('rocket')).toBeTruthy();
      expect(screen.getByText('launchpad')).toBeTruthy();
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('draws the nearest sentence when it is taken, and updates the caption', () => {
      renderPage();

      act(() => useVisualizerStore.getState().submit('the rocket is on the launchpad'));
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

      expect(stage().getAttribute('aria-label')).toBe('The plane flew over the city');
      expect(within(stage() as unknown as HTMLElement).getByText('City')).toBeTruthy();
    });

    it('hides place-only knobs and explains the time relationship in the picture', () => {
      /* A knob that changes nothing is worse than no knob. */
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /^Time/ }));

      expect(screen.queryByRole('group', { name: /How many/ })).toBeNull();
      expect(screen.getByText('Within a period of time')).toBeTruthy();
      expect(screen.queryByText(/a diagram, not a scene/)).toBeNull();
    });

    it('preserves a previously saved draft when choosing a relationship', () => {
      renderPage();

      act(() => useVisualizerStore.getState().setTyped('my own words'));
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

  it('does not repeat page navigation as a breadcrumb', () => {
    renderPage();
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).toBeNull();
  });
});
