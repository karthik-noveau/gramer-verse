import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router';
import type { JSX } from 'react';
import { useContentStore } from 'store/content.store';
import { useVisualizerStore } from 'store/visualizer.store';
import VisualizerPage from './index';
import { timeObservation } from './TimeExperiment';

function Location(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  return <><output data-testid="location">{location.search}</output><button onClick={() => navigate('?group=time&word=until')}>Open until bookmark</button></>;
}
function at(search = ''): ReturnType<typeof render> {
  return render(<MemoryRouter initialEntries={[`/topics/prepositions/visualizer${search}`]}><VisualizerPage /><Location /></MemoryRouter>);
}
const word = (name: string): HTMLElement => within(screen.getByRole('group', { name: 'Preposition' })).getByRole('button', { name });
const mode = (name: string): HTMLElement => within(screen.getByRole('group', { name: 'Learning mode' })).getByRole('button', { name: new RegExp(name) });

beforeAll(async () => { await useContentStore.getState().load(); });
beforeEach(() => { useVisualizerStore.getState().reset(); });

describe('unified preposition experience', () => {
  it('loads bookmarks, follows navigation, and keeps group, word and mode in the URL', () => {
    at('?group=time&word=by');
    expect(word('by').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(word('after'));
    expect(screen.getByTestId('location').textContent).toContain('word=after');
    fireEvent.click(mode('Compare'));
    expect(screen.getByTestId('location').textContent).toContain('mode=compare');
    fireEvent.click(screen.getByRole('button', { name: 'Open until bookmark' }));
    expect(word('until').getAttribute('aria-pressed')).toBe('true');
    expect(mode('Explore').getAttribute('aria-pressed')).toBe('true');
  });

  it('scrubs across the deadline and distinguishes by from before at the exact boundary', () => {
    at('?group=time&word=by');
    const slider = screen.getByRole('slider', { name: 'Animation progress' });
    fireEvent.change(slider, { target: { value: '80' } });
    expect(screen.getByText(/Completion here meets the deadline/)).toBeTruthy();
    fireEvent.change(slider, { target: { value: '81' } });
    expect(screen.getByText(/Completion here misses the deadline/)).toBeTruthy();
    fireEvent.click(word('before'));
    fireEvent.change(screen.getByRole('slider'), { target: { value: '80' } });
    expect(screen.getByText(/this is no longer before it/)).toBeTruthy();
    expect(timeObservation('after', .25)).toContain('not after');
    expect(timeObservation('after', .251)).toContain('Later');
  });

  it('plays, pauses, slows and resets the timeline when the word changes', () => {
    jest.useFakeTimers();
    const view = at('?group=time&word=until');
    fireEvent.click(screen.getByRole('button', { name: 'Replay animation' }));
    act(() => { jest.advanceTimersByTime(1000); });
    const slider = screen.getByRole('slider') as HTMLInputElement;
    expect(Number(slider.value)).toBeGreaterThan(5);
    fireEvent.click(screen.getByRole('button', { name: 'Pause animation' }));
    const paused = slider.value;
    act(() => { jest.advanceTimersByTime(1000); });
    expect(slider.value).toBe(paused);
    fireEvent.click(screen.getByRole('button', { name: 'Slow animation' }));
    fireEvent.click(screen.getByRole('button', { name: 'Play timeline' }));
    act(() => { jest.advanceTimersByTime(1000); });
    expect(Number(slider.value) - Number(paused)).toBeLessThan(6);
    fireEvent.click(word('since'));
    expect((screen.getByRole('slider') as HTMLInputElement).value).toBe('50');
    expect(screen.getByRole('button', { name: 'Play timeline' })).toBeTruthy();
    view.unmount();
    jest.useRealTimers();
  });

  it('compares deadlines and duration at the same time without changing the selected word or draft', () => {
    at('?group=time&word=since');
    act(() => useVisualizerStore.getState().setTyped('my draft'));
    fireEvent.click(mode('Compare'));
    expect(screen.getByRole('img', { name: 'by: finish work at or before 6 PM' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'until: work continues until 6 PM' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'on vs at' }));
    expect(screen.getByText('Zoom from a day to a moment.')).toBeTruthy();
    fireEvent.click(mode('Explore'));
    expect(word('since').getAttribute('aria-pressed')).toBe('true');
    expect((screen.getByRole('combobox') as HTMLInputElement).value).toBe('my draft');
  });

  it('supports correction, honest first-attempt scoring, completion and restart', () => {
    at('?group=time&mode=practice');
    fireEvent.click(screen.getByRole('button', { name: /01 until/ }));
    expect(screen.getByText(/try another word/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /02 by/ }));
    expect(screen.getByText(/That’s right/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Next situation/ }));
    fireEvent.click(screen.getByRole('button', { name: /03 until/ }));
    fireEvent.click(screen.getByRole('button', { name: /Next situation/ }));
    fireEvent.click(screen.getByRole('button', { name: /02 since/ }));
    fireEvent.click(screen.getByRole('button', { name: /See results/ }));
    expect(screen.getByText(/2 of 3 correct on the first try/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Practice again' }));
    expect(screen.getByText(/6 PM is the deadline/)).toBeTruthy();
  });

  it.each(['Compare', 'Practice'])('returns to Explore when changing categories from %s', (previousMode) => {
    at('?group=time');
    for (const category of ['Place', 'Direction', 'Time', 'Other roles']) {
      fireEvent.click(mode(previousMode));
      fireEvent.click(within(screen.getByRole('navigation', { name: 'Preposition group' })).getByRole('button', { name: new RegExp(`^${category}`) }));
      expect(mode('Explore').getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByRole('group', { name: 'Preposition' })).toBeTruthy();
      expect(screen.getByTestId('location').textContent).not.toContain('mode=');
    }
  });

  it('starts a fresh comparison after changing groups', () => {
    at('?group=time&mode=compare');
    fireEvent.click(screen.getByRole('button', { name: 'since vs during' }));
    fireEvent.click(screen.getByRole('button', { name: /^Place/ }));
    fireEvent.click(mode('Compare'));
    expect(screen.getByText('Contact changes the meaning.')).toBeTruthy();
  });

  it('keeps the draggable room, word selection, sentence and formation synchronized', () => {
    at();
    act(() => useVisualizerStore.getState().setTyped('my draft'));
    fireEvent.click(screen.getByRole('button', { name: /Move the ball/ }));
    const ball = screen.getByRole('button', { name: /Ball: The ball is under the table/ });
    expect(word('under').getAttribute('aria-pressed')).toBe('true');
    ball.focus();
    fireEvent.keyDown(ball, { key: 'ArrowLeft' });
    expect(screen.getByRole('button', { name: /Ball: The ball is on the table/ })).toBe(ball);
    expect(word('on').getAttribute('aria-pressed')).toBe('true');
    expect(document.activeElement).toBe(ball);
    expect((screen.getByRole('combobox') as HTMLInputElement).value).toBe('my draft');
    fireEvent.click(word('between'));
    expect(screen.getByRole('button', { name: /Ball: The ball is between the box and the table/ })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Formation' })).toBeTruthy();
    const supported = ['in', 'on', 'under', 'behind', 'between'];
    const picker = within(screen.getByRole('group', { name: 'Preposition' }));
    expect(picker.getAllByRole('button').filter((button) => !(button as HTMLButtonElement).disabled).map((button) => button.textContent)).toEqual(supported);
    const location = screen.getByTestId('location').textContent;
    fireEvent.click(word('above'));
    expect(screen.getByRole('button', { name: /Ball: The ball is between/ })).toBe(ball);
    expect(screen.getByTestId('location').textContent).toBe(location);
    // Navigation stays in the room, skips unsupported words, and wraps both ways.
    fireEvent.click(screen.getByRole('button', { name: 'Next preposition' }));
    expect(word('in').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Previous preposition' }));
    expect(word('between').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(word('on'));
    fireEvent.click(screen.getByRole('button', { name: 'Next preposition' }));
    expect(screen.getByRole('button', { name: /Ball: The ball is under the table/ })).toBe(ball);
    fireEvent.click(screen.getByRole('button', { name: 'Picture' }));
    expect(picker.getAllByRole('button').every((button) => !(button as HTMLButtonElement).disabled)).toBe(true);
    fireEvent.click(word('above'));
    expect(screen.queryByRole('button', { name: /Ball:/ })).toBeNull();
    expect(word('above').getAttribute('aria-pressed')).toBe('true');
  });

  it('snaps a drag using SVG coordinates and leaves the selection intact on pointer cancellation', () => {
    at();
    fireEvent.click(screen.getByRole('button', { name: /Move the ball/ }));
    const ball = screen.getByRole('button', { name: /Ball:/ });
    const svg = ball.closest('svg')!;
    Object.defineProperties(svg, {
      getScreenCTM: { value: () => ({ inverse: () => ({}) }) },
      createSVGPoint: { value: () => ({ x: 0, y: 0, matrixTransform(): { x: number; y: number } { return { x: this.x / 2, y: this.y / 2 }; } }) },
    });
    Object.defineProperties(ball, {
      setPointerCapture: { value: jest.fn() }, hasPointerCapture: { value: () => true }, releasePointerCapture: { value: jest.fn() },
    });
    const pointer = (type: string, x: number, y: number): void => {
      const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 });
      Object.defineProperty(event, 'pointerId', { value: 1 }); fireEvent(ball, event);
    };
    pointer('pointerdown', 780, 626); pointer('pointermove', 780, 398); pointer('pointerup', 780, 398);
    expect(word('on').getAttribute('aria-pressed')).toBe('true');
    pointer('pointerdown', 780, 398); pointer('pointermove', 320, 546); pointer('pointercancel', 320, 546);
    expect(word('on').getAttribute('aria-pressed')).toBe('true');
  });

  it('previews the relationship while holding, preserves the grab offset, and commits only on release', () => {
    at();
    fireEvent.click(screen.getByRole('button', { name: /Move the ball/ }));
    const ball = screen.getByRole('button', { name: /Ball:/ });
    const svg = ball.closest('svg')!;
    Object.defineProperties(svg, {
      getScreenCTM: { value: () => ({ inverse: () => ({}) }) },
      createSVGPoint: { value: () => ({ x: 0, y: 0, matrixTransform(): { x: number; y: number } { return { x: this.x / 2, y: this.y / 2 }; } }) },
    });
    Object.defineProperties(ball, {
      setPointerCapture: { value: jest.fn() }, hasPointerCapture: { value: () => true }, releasePointerCapture: { value: jest.fn() },
    });
    const pointer = (type: string, x: number, y: number): void => {
      const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 });
      Object.defineProperty(event, 'pointerId', { value: 1 }); fireEvent(ball, event);
    };
    // Grab four SVG pixels to the right and three below the ball's centre.
    pointer('pointerdown', 788, 632);
    expect(ball.parentElement?.style.transform).toBe('translate(390px, 313px)');
    pointer('pointermove', 788, 404);
    expect(ball.parentElement?.style.transform).toBe('translate(390px, 199px)');
    expect(svg.querySelector('[data-ball-shadow]')?.getAttribute('cx')).toBe('390');
    expect(svg.querySelector('[data-ball-shadow]')?.getAttribute('cy')).toBe('226');
    expect(word('on').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('LIVE PREVIEW · RELEASE TO PLACE')).toBeTruthy();
    expect(document.querySelector('[class*="lineEn"]')?.textContent).toBe('The ball is on the table.');
    expect(useVisualizerStore.getState().word).toBe('under');
    expect(screen.getByTestId('location').textContent).toContain('word=under');
    pointer('pointermove', 208, 206);
    expect(screen.getByText('Move the ball around the box and table.')).toBeTruthy();
    expect(within(screen.getByRole('group', { name: 'Preposition' })).getAllByRole('button').every((button) => button.getAttribute('aria-pressed') === 'false')).toBe(true);
    pointer('pointermove', 788, 404);
    pointer('pointerup', 788, 404);
    expect(useVisualizerStore.getState().word).toBe('on');
    expect(screen.queryByText('LIVE PREVIEW · RELEASE TO PLACE')).toBeNull();
    expect(screen.getByTestId('location').textContent).toContain('word=on');
  });

  it('recovers invalid URL values and supports every group in both new modes', () => {
    at('?group=bad&word=bad&mode=bad');
    expect(word('in').getAttribute('aria-pressed')).toBe('true');
    for (const group of ['Place', 'Direction', 'Time', 'Other roles']) {
      fireEvent.click(within(screen.getByRole('navigation', { name: 'Preposition group' })).getByRole('button', { name: new RegExp(`^${group}`) }));
      fireEvent.click(mode('Compare'));
      const pairs = within(screen.getByRole('group', { name: 'Comparison pairs' })).getAllByRole('button');
      for (const pair of pairs) { fireEvent.click(pair); expect(screen.getAllByRole('img')).toHaveLength(2); }
      fireEvent.click(mode('Practice'));
      expect(screen.getByRole('region', { name: 'Practice prepositions' })).toBeTruthy();
    }
  });
});
