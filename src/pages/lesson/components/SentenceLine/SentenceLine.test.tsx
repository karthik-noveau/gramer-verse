import { act, render, screen } from '@testing-library/react';

import { SentenceLine } from 'pages/lesson/components/SentenceLine/SentenceLine';
import type { PlaceSpec, PropId, SentenceTemplates } from 'common/scene/types';

/* ============================================================
   SentenceLine.test.tsx

   Two things matter here and they are both easy to get wrong
   invisibly: the line has to read as a sentence to anything that
   reads text, and the flash has to land on the word the knob
   owns in *both* languages — which are almost never the same
   word in the same place.
   ============================================================ */

const id = (value: string): PropId => value as PropId;

const SCENE: PlaceSpec = {
  kind: 'place',
  figure: id('ball'),
  ground: id('box'),
  ground2: null,
  relation: 'in',
  determiner: 'the',
  count: 1,
  adjective: null,
};

const TEMPLATES: SentenceTemplates = {
  en: [
    { slot: 'det' },
    { slot: 'figure' },
    { slot: 'be' },
    { slot: 'relation' },
    { slot: 'text', text: 'the' },
    { slot: 'ground' },
  ],
  ta: [
    { slot: 'figure', case: 'nominative' },
    { slot: 'ground', case: 'locative' },
    { slot: 'be' },
  ],
};

const lines = (): readonly HTMLElement[] => [
  ...document.querySelectorAll<HTMLElement>('[lang="en"], [lang="ta"]'),
];

const litWords = (): readonly string[] =>
  [...document.querySelectorAll<HTMLElement>('[class*="flash"]')].map(
    (node) => node.textContent ?? '',
  );

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('SentenceLine', () => {
  it('says the sentence in both languages', () => {
    render(<SentenceLine scene={SCENE} templates={TEMPLATES} />);

    expect(screen.getByText('The')).toBeTruthy();
    expect(screen.getByText('பெட்டியில்')).toBeTruthy();
  });

  it('tags each line with its own language', () => {
    const { container } = render(<SentenceLine scene={SCENE} templates={TEMPLATES} />);

    expect(container.querySelector('[lang="en"]')?.textContent).toContain('ball');
    expect(container.querySelector('[lang="ta"]')?.textContent).toContain('பந்து');
  });

  it('reads as a sentence, with real spaces in it', () => {
    /* Spaced by CSS alone it is one unbroken word to a screen reader. */
    const { container } = render(<SentenceLine scene={SCENE} templates={TEMPLATES} />);
    const english = container.querySelector('[lang="en"]');

    expect(english?.textContent?.replace(/\s+/g, ' ').trim()).toBe('The ball is in the box');
    expect(lines().length).toBeGreaterThan(0);
  });

  it('marks the words a knob owns, and leaves the fixed ones plain', () => {
    const { container } = render(<SentenceLine scene={SCENE} templates={TEMPLATES} />);
    const bound = [...container.querySelectorAll<HTMLElement>('[data-knob]')].map(
      (node) => node.dataset.knob,
    );

    expect(bound).toContain('figure');
    expect(bound).toContain('ground');
    expect(bound).toContain('relation');
    /* "is" and the second "the" belong to no knob and cannot change. */
    expect(container.querySelectorAll('[data-knob]').length).toBeLessThan(
      container.querySelectorAll('span').length,
    );
  });

  it('flashes the changed word in both lines at once', () => {
    /* The whole point of showing both: the English swaps a word in the middle
       and the Tamil changes an ending near the start, and they happen
       together. */
    render(<SentenceLine scene={SCENE} templates={TEMPLATES} flash="ground" />);

    expect(litWords()).toEqual(['box', 'பெட்டியில்']);
  });

  it('flashes by knob tag, never by position', () => {
    /* The Tamil ground is the second word and the English one is the sixth. */
    const { container } = render(
      <SentenceLine scene={SCENE} templates={TEMPLATES} flash="ground" />,
    );
    const english = [...(container.querySelector('[lang="en"]')?.children ?? [])];
    const tamil = [...(container.querySelector('[lang="ta"]')?.children ?? [])];

    const litIndex = (nodes: readonly Element[]): number =>
      nodes.findIndex((node) => node.className.includes('flash'));

    expect(litIndex(english)).not.toBe(litIndex(tamil));
  });

  it('puts the flash out again', () => {
    render(<SentenceLine scene={SCENE} templates={TEMPLATES} flash="ground" />);
    expect(litWords()).toHaveLength(2);

    act(() => {
      jest.advanceTimersByTime(700);
    });

    expect(litWords()).toHaveLength(0);
  });

  it('flashes again when the same knob is turned again', () => {
    /* Rapid presses restart the flash rather than queueing one each. */
    const { rerender } = render(
      <SentenceLine scene={SCENE} templates={TEMPLATES} flash="count" />,
    );

    act(() => {
      jest.advanceTimersByTime(700);
    });
    expect(litWords()).toHaveLength(0);

    rerender(
      <SentenceLine scene={{ ...SCENE, count: 2 }} templates={TEMPLATES} flash="count" />,
    );

    expect(litWords().length).toBeGreaterThan(0);
  });

  it('lights nothing when nothing has been turned', () => {
    render(<SentenceLine scene={SCENE} templates={TEMPLATES} flash={null} />);

    expect(litWords()).toHaveLength(0);
  });

  it('rebuilds the sentence when the scene changes', () => {
    const { rerender } = render(<SentenceLine scene={SCENE} templates={TEMPLATES} />);

    rerender(
      <SentenceLine scene={{ ...SCENE, count: 2 }} templates={TEMPLATES} flash="count" />,
    );

    expect(screen.getByText('balls')).toBeTruthy();
    expect(screen.getByText('are')).toBeTruthy();
    expect(screen.getByText('பந்துகள்')).toBeTruthy();
  });
});
