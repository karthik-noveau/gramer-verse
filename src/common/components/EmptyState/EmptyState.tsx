import type { JSX, ReactNode } from 'react';

import { Icon } from 'common/components/Icon/Icon';
import type { IconName } from 'common/components/Icon/Icon';

import styles from './styles.module.css';

export type EmptyStateProps = {
  readonly title: string;
  readonly body?: ReactNode;
  /** The Tamil for the message. Written for the reader who has no English. */
  readonly ta?: string;
  readonly icon?: IconName;
  /** Somewhere to go from here — an empty screen with no exit is a dead end. */
  readonly action?: ReactNode;
};

export function EmptyState({
  title,
  body,
  ta,
  icon = 'book',
  action,
}: EmptyStateProps): JSX.Element {
  return (
    <div className={styles.state}>
      <div className={styles.icon}>
        <Icon name={icon} size="lg" />
      </div>
      <h3 className={styles.title}>{title}</h3>
      {body ? <p className={styles.body}>{body}</p> : null}
      {ta ? (
        <p className={styles.body} lang="ta">
          {ta}
        </p>
      ) : null}
      {action}
    </div>
  );
}
