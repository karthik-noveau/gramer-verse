import { useEffect } from 'react';
import type { RefObject } from 'react';

/* Focusables in DOM order. `disabled` and negative tabindex are excluded, and
   so is anything inside a closed <details> or a hidden subtree — an element the
   user cannot see must not be a stop on the Tab route. */
const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/* Visibility is judged from the attributes and the computed style rather than
   from layout: `offsetParent` and `getClientRects()` are both always empty
   under jsdom, which would make the trap look correct in a test and skip every
   stop in a browser. */
const isVisible = (el: HTMLElement): boolean => {
  if (el.closest('[hidden]') !== null || el.getAttribute('aria-hidden') === 'true') return false;
  const style = window.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden';
};

const focusablesIn = (root: HTMLElement): readonly HTMLElement[] =>
  [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(isVisible);

/**
 * Keeps Tab inside `ref` while `active`, moves focus in when it opens, and puts
 * focus back where it came from when it closes.
 *
 * Restoration is the part that fails quietly: the element that opened the
 * overlay is often gone by the time it closes — a row that re-rendered, a menu
 * that unmounted — and focus then falls to <body>, which strands a keyboard
 * user at the top of the document with no announcement. When the opener is no
 * longer in the document, focus goes to the page heading instead.
 */
export const useFocusTrap = (ref: RefObject<HTMLElement | null>, active: boolean): void => {
  useEffect(() => {
    if (!active) return;

    const root = ref.current;
    if (!root) return;

    /* <body> means nothing had focus, which is not somewhere to send it back
       to — that is the same dead end as an opener that has unmounted. */
    const focused = document.activeElement;
    const opener = focused instanceof HTMLElement && focused !== document.body ? focused : null;

    const first = focusablesIn(root)[0];
    if (first) {
      first.focus();
    } else {
      /* Nothing focusable inside: the container takes focus itself so the
         screen reader lands on the overlay rather than behind it. */
      root.setAttribute('tabindex', '-1');
      root.focus();
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') return;

      const stops = focusablesIn(root);
      const firstStop = stops[0];
      const lastStop = stops[stops.length - 1];
      if (!firstStop || !lastStop) {
        event.preventDefault();
        return;
      }

      const current = document.activeElement;
      if (event.shiftKey && (current === firstStop || !root.contains(current))) {
        event.preventDefault();
        lastStop.focus();
      } else if (!event.shiftKey && current === lastStop) {
        event.preventDefault();
        firstStop.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);

      if (opener && document.contains(opener)) {
        opener.focus();
        return;
      }
      const heading = document.querySelector<HTMLElement>('h1');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus();
      }
    };
  }, [ref, active]);
};
