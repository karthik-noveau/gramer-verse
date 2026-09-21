import { fireEvent, render, screen, cleanup } from '@testing-library/react';

import { useReducedMotion } from 'common/hooks/useReducedMotion';
import { propFor } from 'common/scene/props';
import { renderPlace } from 'common/scene/renderers/place.renderer';
import type { PlaceSpec, PropId } from 'common/scene/types';
import { PrepositionPicture, placeFrame } from './PrepositionPicture';
import { useVisualizerStore, selectScene, WORDS } from 'store/visualizer.store';

jest.mock('common/hooks/useReducedMotion', () => ({ useReducedMotion: jest.fn(() => false) }));
const motion = jest.mocked(useReducedMotion);

beforeEach(() => { useVisualizerStore.getState().reset(); motion.mockReturnValue(false); });

function picture(group: string, word: string): ReturnType<typeof render> {
  const store = useVisualizerStore.getState();
  store.setGroup(group);
  store.choose(word);
  const spec = selectScene(useVisualizerStore.getState());
  if (!spec) throw new Error(`Missing scene ${group}: ${word}`);
  return render(<PrepositionPicture spec={spec} english={`Example: ${word}`} tamil="எடுத்துக்காட்டு" />);
}

describe('preposition pictures', () => {
  it.each(['prep-place', 'prep-dir', 'prep-time', 'prep-other'])(
    'renders every %s option with a meaning and a labelled image', (group) => {
      for (const word of WORDS[group] ?? []) {
        const { container } = picture(group, word);
        expect(screen.getAllByRole('img')).toHaveLength(1);
        expect(container.querySelector('[class*="meaning"]')?.textContent?.length).toBeGreaterThan(5);
        expect(container.querySelector('figure svg')?.getAttribute('viewBox')).toBeTruthy();
        expect(container.querySelector('figcaption[lang="ta"]')?.textContent).toBeTruthy();
        cleanup();
      }
    },
  );

  it('replays a finite direction animation without losing its sentence', () => {
    const { container } = picture('prep-dir', 'into');
    const original = screen.getByRole('img');
    const animation = container.querySelector('animateMotion');
    expect(animation?.getAttribute('dur')).toBe('2.8s');
    expect(animation?.getAttribute('repeatCount')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Replay movement' }));
    expect(screen.getByRole('img')).not.toBe(original);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Example: into');
  });

  it('shows the end state without animation or replay for reduced motion', () => {
    motion.mockReturnValue(true);
    const { container } = picture('prep-dir', 'over');
    expect(container.querySelector('animateMotion')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Replay movement' })).toBeNull();
    expect(container.querySelector('[data-journey]')?.getAttribute('transform')).toBe('translate(530 105)');
  });

  it.each([
    ['to', 'School'], ['towards', 'Station'], ['from', 'Office'], ['over', 'City'],
    ['into', 'Inside the room'], ['across', 'Road'], ['along', 'Along the riverbank'], ['past', 'Park'],
  ])('%s illustrates its actual destination or path', (word, label) => {
    picture('prep-dir', word);
    expect(screen.getByText(label)).toBeTruthy();
  });

  it.each([
    ['in', '2000'], ['on', 'Monday'], ['at', '5 PM'], ['before', '8 AM'], ['after', 'Lunch'],
    ['by', '6 PM'], ['since', '2010'], ['during', 'Sleeping'], ['until', 'I arrive'],
  ])('%s names the time or event from its sentence', (word, label) => {
    picture('prep-time', word);
    expect(screen.getByText(label)).toBeTruthy();
  });

  it.each([
    ['before', 'Arrive', '8 AM', true], ['after', 'Meet', 'Lunch', false],
    ['by', 'Work finished', '6 PM', true],
  ] as const)('%s places the event on the correct side of its reference', (word, event, reference, earlier) => {
    picture('prep-time', word);
    const eventX = Number(screen.getByText(event).getAttribute('x'));
    const referenceX = Number(screen.getByText(reference).getAttribute('x'));
    expect(eventX < referenceX).toBe(earlier);
  });

  it('distinguishes an identity from a resemblance', () => {
    picture('prep-other', 'as');
    expect(screen.getByText('DRIVER')).toBeTruthy();
    expect(screen.queryByText('≈')).toBeNull();
    cleanup();
    picture('prep-other', 'like');
    expect(screen.getByText('≈')).toBeTruthy();
    expect(screen.getByText('A bird sings')).toBeTruthy();
  });

  it('shows a consistent per-unit price across three quantities', () => {
    picture('prep-other', 'per');
    for (const count of [1, 2, 3]) {
      expect(screen.getByText(`${count} kg`)).toBeTruthy();
      expect(screen.getByText(`$${count * 10}`)).toBeTruthy();
    }
  });
});

describe('place framing', () => {
  it.each([1, 2, 3] as const)('fits %i tall figures without clipping them', (count) => {
    const spec: PlaceSpec = {
      kind: 'place', figure: 'man' as PropId, ground: 'box' as PropId, ground2: null,
      relation: 'on', determiner: 'the', adjective: 'big', count,
    };
    const [x, y, width, height] = placeFrame(spec);
    for (const node of renderPlace(spec)) {
      if (!node.id.startsWith('figure-') && node.id !== 'ground') continue;
      const prop = propFor(node.id === 'ground' ? spec.ground : spec.figure);
      if (!prop) throw new Error('Missing prop');
      const at = String(node.attrs.transform).match(/translate\(([-\d.]+),([-\d.]+)\)/);
      const scale = Number(String(node.attrs.transform).match(/scale\(([-\d.]+)\)/)?.[1] ?? 1);
      const px = Number(at?.[1]);
      const py = Number(at?.[2]);
      expect(px).toBeGreaterThanOrEqual(x);
      expect(py).toBeGreaterThanOrEqual(y);
      expect(px + prop.box.w * scale).toBeLessThanOrEqual(x + width);
      expect(py + prop.box.h * scale).toBeLessThanOrEqual(y + height);
    }
  });
});
