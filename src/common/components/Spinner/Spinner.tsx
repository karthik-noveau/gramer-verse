import type { JSX } from 'react';

import { classNames } from 'common/utils/classNames';

import styles from './styles.module.css';

export type SpinnerProps = {
  /** What is being waited for. Read out; never shown. */
  readonly label?: string;
  readonly className?: string;
  /** Centre the spinner in the available page area. */
  readonly centered?: boolean;
};

/**
 * `role="status"` rather than a bare div: a spinner nobody can see is a page
 * that has silently stopped for a screen-reader user.
 */
export function Spinner({ label = 'Loading', className, centered = false }: SpinnerProps): JSX.Element {
  return (
    <span role="status" className={classNames(centered && styles.centered)}>
      <span className={classNames(styles.spinner, className)} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
