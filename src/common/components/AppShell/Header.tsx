import type { JSX } from 'react';
import { Link, NavLink } from 'react-router';

import { BrandLockup } from 'common/components/BrandMark/BrandMark';
import { Button } from 'common/components/Button/Button';
import { Icon } from 'common/components/Icon/Icon';
import { paths } from 'common/constants/routes';
import type { Theme } from 'store/ui.store';

import styles from './styles.module.css';

export type HeaderProps = {
  /** Below 900px the sidebar is a drawer, so the hamburger replaces the
   *  collapse button. Only one of the two is ever shown. */
  readonly narrow: boolean;
  readonly drawerOpen: boolean;
  readonly onToggleDrawer: () => void;
  readonly sidebarCollapsed: boolean;
  readonly onToggleSidebar: () => void;
  readonly theme: Theme;
  readonly onToggleTheme: () => void;
};

/* No notification bell and no account menu: there is nothing to notify about —
   content ships with the app, not to it — and there is no account. The theme
   toggle is a plain button, so the header has no menus of its own. */
export function Header({
  narrow,
  drawerOpen,
  onToggleDrawer,
  sidebarCollapsed,
  onToggleSidebar,
  theme,
  onToggleTheme,
}: HeaderProps): JSX.Element {
  return (
    <header className={styles.header}>
      {narrow ? (
        <Button
          variant="ghost"
          iconOnly
          aria-label={drawerOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={drawerOpen}
          onClick={onToggleDrawer}
        >
          <Icon name="menu" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          iconOnly
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-pressed={sidebarCollapsed}
          onClick={onToggleSidebar}
        >
          <Icon name={sidebarCollapsed ? 'chevronRight' : 'chevronLeft'} />
        </Button>
      )}

      <Link className={styles.brandHome} to={paths.landing()} aria-label="Grammer-Verse, home">
        <BrandLockup />
      </Link>

      <span className={styles.spacer} />

      <nav className={styles.topNav} aria-label="Primary">
        <NavLink to={paths.topics()}>Topics</NavLink>
      </nav>

      <Button
        variant="ghost"
        iconOnly
        aria-label={theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'}
        onClick={onToggleTheme}
      >
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
      </Button>
    </header>
  );
}
