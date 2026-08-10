import type { JSX } from 'react';
import { act, render, screen } from '@testing-library/react';

import { useMediaQuery } from 'common/hooks/useMediaQuery';

/* jsdom implements matchMedia as a stub that never changes, so the listeners
   are driven by hand here — the point of the test is that the hook subscribes
   and unsubscribes, which a real browser would then honour. */
type Listener = (event: MediaQueryListEvent) => void;

const lists = new Map<string, { matches: boolean; listeners: Set<Listener> }>();

const setMatches = (query: string, matches: boolean): void => {
  const entry = lists.get(query);
  if (!entry) return;
  entry.matches = matches;
  act(() => {
    entry.listeners.forEach((l) => l({ matches } as MediaQueryListEvent));
  });
};

beforeEach(() => {
  lists.clear();
  window.matchMedia = ((query: string) => {
    const entry = lists.get(query) ?? { matches: false, listeners: new Set<Listener>() };
    lists.set(query, entry);
    return {
      get matches() {
        return entry.matches;
      },
      media: query,
      addEventListener: (_: string, l: Listener) => entry.listeners.add(l),
      removeEventListener: (_: string, l: Listener) => entry.listeners.delete(l),
    } as unknown as MediaQueryList;
  }) as typeof window.matchMedia;
});

function Probe({ query }: { readonly query: string }): JSX.Element {
  return <span data-testid="result">{String(useMediaQuery(query))}</span>;
}

const result = (): string => screen.getByTestId('result').textContent ?? '';

describe('useMediaQuery', () => {
  it('reports the query state on the first render, not one paint later', () => {
    lists.set('(max-width: 900px)', { matches: true, listeners: new Set() });
    render(<Probe query="(max-width: 900px)" />);

    expect(result()).toBe('true');
  });

  it('re-renders when the query changes', () => {
    render(<Probe query="(max-width: 900px)" />);
    expect(result()).toBe('false');

    setMatches('(max-width: 900px)', true);
    expect(result()).toBe('true');

    setMatches('(max-width: 900px)', false);
    expect(result()).toBe('false');
  });

  it('unsubscribes when it unmounts', () => {
    const { unmount } = render(<Probe query="(max-width: 900px)" />);
    expect(lists.get('(max-width: 900px)')?.listeners.size).toBe(1);

    unmount();

    expect(lists.get('(max-width: 900px)')?.listeners.size).toBe(0);
  });
});
