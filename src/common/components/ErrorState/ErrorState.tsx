import type { JSX, ReactNode } from 'react';

import { Icon } from 'common/components/Icon/Icon';

import styles from './styles.module.css';

export type ErrorStateProps = {
  readonly title: string;
  readonly body?: ReactNode;
  readonly ta?: string;
  /** The file and the rule that failed, rendered verbatim. */
  readonly detail?: string;
  readonly action?: ReactNode;
};

/**
 * Never fails silently and never says only "something went wrong": `detail`
 * carries the file and the rule, because the person reading it is usually the
 * person who has to fix the content.
 */
export function ErrorState({ title, body, ta, detail, action }: ErrorStateProps): JSX.Element {
  return (
    <div className={styles.state} role="alert">
      <div className={styles.icon}>
        <Icon name="alert" size="lg" />
      </div>
      <h3 className={styles.title}>{title}</h3>
      {body ? <p className={styles.body}>{body}</p> : null}
      {ta ? (
        <p className={styles.body} lang="ta">
          {ta}
        </p>
      ) : null}
      {detail ? (
        <p>
          <code className={styles.detail}>{detail}</code>
        </p>
      ) : null}
      {action}
    </div>
  );
}
