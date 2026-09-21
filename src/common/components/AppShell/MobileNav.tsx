import type { JSX } from 'react';
import { NavLink } from 'react-router';

import { BrandMark } from 'common/components/BrandMark/BrandMark';
import { Icon } from 'common/components/Icon/Icon';
import type { IconName } from 'common/components/Icon/Icon';
import { paths } from 'common/constants/routes';

import styles from './styles.module.css';

type Item = { readonly to: string; readonly label: string; readonly icon?: IconName; readonly brand?: boolean; readonly end?: boolean };

const ITEMS: readonly Item[] = [
  /* `end` on the landing link, or "/" matches every path and Home is always
     the current page. */
  { to: paths.landing(), label: 'Home', brand: true, end: true },
  { to: paths.topics(), label: 'Topics', icon: 'book', end: true },
  { to: paths.visualizer(), label: 'Visualizer', icon: 'sun' },
  { to: paths.practice(), label: 'Practice', icon: 'pencil' },
];

/** The bottom bar below 900px. The same places the header nav offers. */
export function MobileNav(): JSX.Element {
  return (
    <nav className={styles.mobileNav} aria-label="Mobile">
      {ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end ?? false}>
          {item.brand ? <BrandMark size={20} /> : <Icon name={item.icon ?? 'book'} />}
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
