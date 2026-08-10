import type { JSX } from 'react';

import { classNames } from 'common/utils/classNames';

import styles from './styles.module.css';

export type SpinnerProps = {
  /** What is being waited for. Read out; never shown. */
  readonly label?: string;
  readonly className?: string;
};

/**
 * `role="status"` rather than a bare div: a spinner nobody can see is a page
 * that has silently stopped for a screen-reader user.
 */
export function Spinner({ label = 'Loading', className }: SpinnerProps): JSX.Element {
  return (
    <span role="status">
      <span className={classNames(styles.spinner, className)} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
