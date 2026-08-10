import { cloneElement } from 'react';
import type { JSX } from 'react';

import { drawIcon } from 'common/art/families';
import { lookup } from 'common/art/forWord';

/* ============================================================
   Art — the picture of one word, or nothing.

   Nothing is the important half. A word the app cannot draw
   renders no element at all, so a caller can ask `hasArt` before
   deciding whether a column is worth having.
   ============================================================ */

export type ArtProps = {
  /** The cell as the source wrote it. Matched whole. */
  readonly word: string | null | undefined;
  readonly size?: number;
  readonly className?: string;
};

/** The drawing for a word, or null. Exported so a table can ask whether any of
 *  its rows would fill a picture column before adding one. */
export const artFor = (word: string | null | undefined): readonly JSX.Element[] | null => {
  const hit = lookup(word);
  if (!hit) return null;

  return drawIcon(hit.family, hit.value) ?? drawIcon(hit.family, hit.raw);
};

export const hasArt = (word: string | null | undefined): boolean => artFor(word) !== null;

export function Art({ word, size = 40, className }: ArtProps): JSX.Element | null {
  const parts = artFor(word);
  if (!parts) return null;

  const label = lookup(word)?.raw ?? String(word ?? '');

  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className={className}
    >
      {parts.map((part, index) => cloneElement(part, { key: index }))}
    </svg>
  );
}
