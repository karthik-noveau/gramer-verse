import { useEffect, useState } from 'react';

/* jsdom ships no matchMedia, and neither does a static render. Treating that as
   "the query does not match" gives the wide layout, which is the one that
   degrades gracefully — a phone always has matchMedia. */
const matchQuery = (query: string): MediaQueryList | null =>
  typeof window.matchMedia === 'function' ? window.matchMedia(query) : null;

/**
 * Subscribes to a media query and re-renders when it changes.
 *
 * The initial value is read during the first render rather than in an effect:
 * reading it in an effect means the first paint is always the "false" branch,
 * which on a phone is a flash of the desktop layout before the mobile one
 * replaces it.
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(() => matchQuery(query)?.matches ?? false);

  useEffect(() => {
    const list = matchQuery(query);
    if (!list) return;
    const onChange = (event: MediaQueryListEvent): void => setMatches(event.matches);

    /* The query may have changed between render and effect. */
    setMatches(list.matches);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
};
