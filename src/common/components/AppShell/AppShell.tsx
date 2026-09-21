import { useEffect } from 'react';
import type { JSX, ReactNode } from 'react';

import { useMediaQuery } from 'common/hooks/useMediaQuery';
import { useUiStore } from 'store/ui.store';

import { Footer } from './Footer';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';
import type { SidebarTopic } from './Sidebar';
import styles from './styles.module.css';

/** Below this the sidebar becomes a drawer and the bottom bar appears. */
export const NARROW = '(max-width: 900px)';

export type AppShellProps = {
  readonly children: ReactNode;
  /** The topic list the sidebar renders. It arrives from the content store in
   *  engine 08 — the shell never reads content itself. */
  readonly topics?: readonly SidebarTopic[];
  readonly activeTopicId?: string | undefined;
};

export function AppShell({ children, topics = [], activeTopicId }: AppShellProps): JSX.Element {
  const narrow = useMediaQuery(NARROW);

  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const drawerOpen = useUiStore((s) => s.drawerOpen);
  /* Read for the header's toggle, which shows the icon of the theme it would
     move to. Putting it on the document is `useThemeAttribute`'s job, above
     the routes — the front door is outside this shell and has a toggle too. */
  const theme = useUiStore((s) => s.theme);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const toggleDrawer = useUiStore((s) => s.toggleDrawer);
  const setDrawerOpen = useUiStore((s) => s.setDrawerOpen);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  /* Growing past 900px turns the drawer back into a column. Left open, its
     scrim would stay mounted over a desktop layout and swallow every click. */
  useEffect(() => {
    if (!narrow) setDrawerOpen(false);
  }, [narrow, setDrawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen, setDrawerOpen]);

  const showDrawerScrim = narrow && drawerOpen;

  return (
    <div
      className={styles.shell}
      data-sidebar={sidebarCollapsed ? 'collapsed' : 'expanded'}
      data-drawer={drawerOpen ? 'open' : 'closed'}
    >
      {/* The first focusable thing on the page, and the reason a keyboard user
          does not tab through ten topics to reach the lesson. */}
      <a className={styles.skipLink} href="#main">
        Skip to content
      </a>

      <Header
        topics={topics}
        narrow={narrow}
        drawerOpen={drawerOpen}
        onToggleDrawer={toggleDrawer}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={toggleSidebar}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <Sidebar
        topics={topics}
        activeTopicId={activeTopicId}
        collapsed={sidebarCollapsed && !narrow}
      />

      <main className={styles.main} id="main" tabIndex={-1}>
        {children}
      </main>

      <Footer />
      <MobileNav />

      {showDrawerScrim ? (
        <div
          className={styles.scrim}
          data-testid="drawer-scrim"
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}
    </div>
  );
}
