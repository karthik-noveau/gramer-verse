import type { JSX } from 'react';
import { NavLink } from 'react-router';

import { Icon } from 'common/components/Icon/Icon';
import type { IconName } from 'common/components/Icon/Icon';
import { paths } from 'common/constants/routes';

import styles from './styles.module.css';

type Item = { readonly to: string; readonly label: string; readonly icon: IconName; readonly end?: boolean };

const ITEMS: readonly Item[] = [
  /* `end` on the landing link, or "/" matches every path and Home is always
     the current page. */
  { to: paths.landing(), label: 'Home', icon: 'grid', end: true },
  { to: paths.topics(), label: 'Topics', icon: 'book' },
  { to: paths.reference(), label: 'Reference', icon: 'search' },
];

/** The bottom bar below 900px. The same three places the header nav offers. */
export function MobileNav(): JSX.Element {
  return (
    <nav className={styles.mobileNav} aria-label="Mobile">
      {ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end ?? false}>
          <Icon name={item.icon} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
