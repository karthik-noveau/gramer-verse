import type { JSX } from 'react';
import { useLocation } from 'react-router';

import { Button } from 'common/components/Button/Button';
import { paths } from 'common/constants/routes';

import styles from './styles.module.css';

/**
 * The address that did not match, shown rather than redirected away from.
 *
 * A 404 that bounces you to the home page destroys the evidence: the reader
 * cannot see what was asked for, cannot copy it into a message, and cannot
 * tell a typo from a broken link. The URL stays as typed.
 */
export default function NotFoundPage(): JSX.Element {
  const { pathname, search, hash } = useLocation();
  const attempted = `${pathname}${search}${hash}`;

  return (
    <div className={styles.state} role="alert">
      <div className={styles.icon} aria-hidden="true">
        ?
      </div>
      <h1 className={styles.title}>This page is not here</h1>
      <p className={styles.body}>
        The address did not match any topic or lesson. It has been left in the address bar rather
        than redirected, so you can see what was asked for.
      </p>
      <p className={styles.body} lang="ta">
        இந்தப் பக்கம் கிடைக்கவில்லை.
      </p>
      <p>
        <code className={styles.path}>{attempted}</code>
      </p>
      <div className={styles.actions}>
        <Button variant="primary" to={paths.topics()}>
          All topics
        </Button>
        <Button to={paths.landing()}>Home</Button>
        <Button to={paths.visualizer()}>Visualizer</Button>
      </div>
    </div>
  );
}
