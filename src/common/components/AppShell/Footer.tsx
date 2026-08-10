import type { JSX } from 'react';
import { Link } from 'react-router';

import { paths } from 'common/constants/routes';

import styles from './styles.module.css';

/* One line about what this is, and the one place worth linking. There is no
   account, no settings and no status page to link to. */
export function Footer(): JSX.Element {
  return (
    <footer className={styles.footer}>
      <span>Grammer-Verse — English grammar for Tamil speakers, drawn.</span>
      <span className={styles.spacer} />
      <Link to={paths.topics()}>Topics</Link>
    </footer>
  );
}
