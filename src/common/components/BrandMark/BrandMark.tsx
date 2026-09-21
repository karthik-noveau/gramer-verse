import { useId } from 'react';
import type { JSX } from 'react';

import { classNames } from 'common/utils/classNames';

import styles from './styles.module.css';

/* A compact learning laptop: the rounded tile is the screen, while one quiet
   baseline suggests the keyboard deck without adding icon-scale clutter. */

export type BrandMarkProps = {
  readonly size?: number;
  readonly className?: string;
};

export function BrandMark({ size = 26, className }: BrandMarkProps): JSX.Element {
  const gradientKey = useId().replaceAll(':', '');
  const screenGradient = `gv-screen-${gradientKey}`;
  const goldGradient = `gv-gold-${gradientKey}`;
  const screenClip = `gv-clip-${gradientKey}`;

  return (
    <svg
      className={classNames(styles.mark, className)}
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={screenGradient} x1="3" y1="3" x2="29" y2="29" gradientUnits="userSpaceOnUse">
          <stop className={styles.screenGlow} />
          <stop offset="1" className={styles.screenDeep} />
        </linearGradient>
        <linearGradient id={goldGradient} x1="4" y1="3" x2="28" y2="29" gradientUnits="userSpaceOnUse">
          <stop className={styles.goldGlow} />
          <stop offset="1" className={styles.goldDeep} />
        </linearGradient>
        <clipPath id={screenClip}>
          <rect x="2" y="2" width="28" height="28" rx="7" />
        </clipPath>
      </defs>
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="7"
        className={styles.screen}
        data-screen="true"
        style={{ fill: `url(#${screenGradient})` }}
      />
      <path d="M-14 2h7L9 30H2Z" className={styles.sheen} style={{ clipPath: `url(#${screenClip})` }} />
      <path d="M21.8 11.2a7 7 0 1 0 .1 9.3v-4.4h-5.3" className={styles.grammer} data-monogram="true" />
      <circle cx="21.9" cy="20.5" r="1.15" className={styles.punctuation} data-accent="true" style={{ fill: `url(#${goldGradient})` }} />
      <path
        d="M9 25h14"
        className={styles.base}
        data-base="true"
        style={{ stroke: `url(#${goldGradient})` }}
      />
    </svg>
  );
}

export type BrandLockupProps = {
  readonly size?: number;
  readonly className?: string;
};

/** The mark and product name. Translations belong to content, not the logo. */
export function BrandLockup({ size = 26, className }: BrandLockupProps): JSX.Element {
  return (
    <span className={classNames(styles.lockup, className)}>
      <BrandMark size={size} />
      <span className={styles.word}>
        Grammer-<em>Verse</em>
      </span>
    </span>
  );
}
