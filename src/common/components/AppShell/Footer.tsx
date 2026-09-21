import type { JSX } from 'react';
import { Link } from 'react-router';

import { BrandMark } from 'common/components/BrandMark/BrandMark';
import { paths } from 'common/constants/routes';

import styles from './styles.module.css';

/* One line about what this is, and the one place worth linking. There is no
   account, no settings and no status page to link to. */
export function Footer(): JSX.Element {
  return (
    <footer className={styles.footer}>
      <span className={styles.footerBrand}>
        <BrandMark size={18} />
        Grammer-Verse — English grammar for Tamil speakers, drawn.
      </span>
      <span className={styles.spacer} />
      <Link to={paths.topics()}>Topics</Link>
      <Link to={paths.practice()}>Practice</Link>
    </footer>
  );
}
