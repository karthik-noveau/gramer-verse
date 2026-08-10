import type { JSX } from 'react';

import { classNames } from 'common/utils/classNames';

import styles from './styles.module.css';

/* A ball inside a box: the preposition "in", which is the idea every other
   lesson is built on. The gap in the top edge is the ball's own width, so it
   reads as the way in rather than as a missing line — and it is what keeps the
   silhouette from reading as a camera.

   Inline rather than an <img>, because it follows the theme: the frame is
   --ink and the ball --accent, and a linked file cannot read the page's custom
   properties. assets/logos/brand-mark.svg is the record and the favicon. */
const FRAME =
  'M11 4 H7.5 A3.5 3.5 0 0 0 4 7.5 V24.5 A3.5 3.5 0 0 0 7.5 28 H24.5 ' +
  'A3.5 3.5 0 0 0 28 24.5 V7.5 A3.5 3.5 0 0 0 24.5 4 H21';

export type BrandMarkProps = {
  readonly size?: number;
  readonly className?: string;
};

export function BrandMark({ size = 26, className }: BrandMarkProps): JSX.Element {
  return (
    <svg
      className={classNames(styles.mark, className)}
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <path d={FRAME} fill="none" strokeWidth="3" strokeLinecap="round" className={styles.frame} />
      <circle cx="16" cy="19" r="6" className={styles.ball} />
    </svg>
  );
}

export type BrandLockupProps = {
  readonly size?: number;
  readonly className?: string;
};

/**
 * The mark, the name, and the name as a Tamil reader would say it.
 *
 * The prototype drew the Tamil as outlines because it shipped no Tamil
 * webfont and a wordmark that can render as tofu is not a wordmark. Engine 02
 * ships the font, so it is live text again — which means it can be selected,
 * searched, read aloud and re-sized.
 */
export function BrandLockup({ size = 26, className }: BrandLockupProps): JSX.Element {
  return (
    <span className={classNames(styles.lockup, className)}>
      <BrandMark size={size} />
      <span className={styles.stack}>
        <span className={styles.word}>
          Grammer-<em>Verse</em>
        </span>
        <span className={styles.ta} lang="ta">
          கிராமர்-வெர்ஸ்
        </span>
      </span>
    </span>
  );
}
