import type { ButtonHTMLAttributes, JSX, ReactNode } from 'react';

import { classNames } from 'common/utils/classNames';

import styles from './styles.module.css';

export type ChipProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className' | 'children' | 'aria-pressed'
> & {
  readonly label: string;
  /** The Tamil for the same word, riding inside the chip rather than under it. */
  readonly ta?: string;
  readonly pressed?: boolean;
  /** An icon before the label — the picture of the word, where there is one. */
  readonly leading?: ReactNode;
  readonly className?: string;
};

/**
 * A knob option. `aria-pressed` rather than a radio, because pressing one is a
 * change to the picture rather than an answer to a question, and because the
 * pressed state has to be readable by a screen reader as well as visible.
 */
export function Chip({
  label,
  ta,
  pressed = false,
  leading,
  className,
  ...rest
}: ChipProps): JSX.Element {
  return (
    <button
      type="button"
      className={classNames(styles.chip, className)}
      aria-pressed={pressed}
      {...rest}
    >
      {leading ? <span className={styles.leading}>{leading}</span> : null}
      <span lang="en">{label}</span>
      {ta ? (
        <span className={styles.ta} lang="ta">
          {ta}
        </span>
      ) : null}
    </button>
  );
}
