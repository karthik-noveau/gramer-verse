import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { AppShell, NARROW } from 'common/components/AppShell/AppShell';
import type { SidebarTopic } from 'common/components/AppShell/Sidebar';
import { useUiStore } from 'store/ui.store';

const TOPICS: readonly SidebarTopic[] = [
  { id: 'tenses', n: 1, en: 'Tenses' },
  { id: 'verbs', n: 2, en: 'Verbs' },
  { id: 'prepositions', n: 5, en: 'Prepositions' },
];

/* jsdom's matchMedia never changes, so the width is driven by hand. */
type Listener = (event: MediaQueryListEvent) => void;
const media = new Map<string, { matches: boolean; listeners: Set<Listener> }>();

const setWidth = (narrow: boolean): void => {
  const entry = media.get(NARROW);
  if (!entry) return;
  entry.matches = narrow;
  act(() => {
    entry.listeners.forEach((l) => l({ matches: narrow } as MediaQueryListEvent));
  });
};

beforeEach(() => {
  media.clear();
  window.matchMedia = ((query: string) => {
    const entry = media.get(query) ?? { matches: false, listeners: new Set<Listener>() };
    media.set(query, entry);
    return {
      get matches() {
        return entry.matches;
      },
      media: query,
      addEventListener: (_: string, l: Listener) => entry.listeners.add(l),
      removeEventListener: (_: string, l: Listener) => entry.listeners.delete(l),
    } as unknown as MediaQueryList;
  }) as typeof window.matchMedia;

  useUiStore.setState({ sidebarCollapsed: false, drawerOpen: false, theme: 'light' });
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

const renderShell = (path = '/topics'): ReturnType<typeof render> =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppShell topics={TOPICS} activeTopicId="prepositions">
        <h1>Topics</h1>
      </AppShell>
    </MemoryRouter>,
  );

describe('AppShell', () => {
  it('renders the header, sidebar, main and footer', () => {
    renderShell();

    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByRole('complementary', { name: 'Topics' })).toBeTruthy();
    expect(screen.getByRole('main')).toBeTruthy();
    expect(screen.getByRole('contentinfo')).toBeTruthy();
  });

  it('puts the skip link first and points it at main', () => {
    const { container } = renderShell();
    const skip = screen.getByRole('link', { name: 'Skip to content' });

    expect(container.querySelector('a')).toBe(skip);
    expect(skip.getAttribute('href')).toBe('#main');
    expect(screen.getByRole('main').id).toBe('main');
  });

  it('lists every topic and marks the active one', () => {
    renderShell();
    const sidebar = screen.getByRole('complementary', { name: 'Topics' });

    expect(sidebar.querySelectorAll('a')).toHaveLength(TOPICS.length + 1);
    expect(screen.getByRole('link', { name: 'Prepositions' }).getAttribute('aria-current')).toBe('page');
  });

  it('marks the current page in the primary nav', () => {
    renderShell();
    const nav = screen.getByRole('navigation', { name: 'Primary' });

    expect(nav.querySelector('[aria-current="page"]')?.textContent).toBe('Topics');
  });

  it('collapses the sidebar without losing the link names', () => {
    renderShell();
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));

    expect(useUiStore.getState().sidebarCollapsed).toBe(true);
    /* Still findable by name: the label is visually hidden, not removed. */
    expect(screen.getByRole('link', { name: 'Tenses' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeTruthy();
  });

  it('shows the collapse button on desktop and the hamburger on mobile', () => {
    renderShell();
    expect(screen.queryByRole('button', { name: 'Open navigation' })).toBeNull();

    setWidth(true);

    expect(screen.getByRole('button', { name: 'Open navigation' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Collapse sidebar' })).toBeNull();
  });

  it('opens the drawer, and closes it on Escape', () => {
    renderShell();
    setWidth(true);
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));

    expect(useUiStore.getState().drawerOpen).toBe(true);
    expect(screen.getByTestId('drawer-scrim')).toBeTruthy();

    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    expect(useUiStore.getState().drawerOpen).toBe(false);
  });

  it('closes the drawer on the scrim', () => {
    renderShell();
    setWidth(true);
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
    fireEvent.click(screen.getByTestId('drawer-scrim'));

    expect(screen.queryByTestId('drawer-scrim')).toBeNull();
  });

  it('leaves no scrim behind when the viewport grows past 900px', () => {
    renderShell();
    setWidth(true);
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
    expect(screen.getByTestId('drawer-scrim')).toBeTruthy();

    setWidth(false);

    expect(screen.queryByTestId('drawer-scrim')).toBeNull();
    expect(useUiStore.getState().drawerOpen).toBe(false);
  });

  /* Putting the choice on the document belongs to `useThemeAttribute`, above
     the routes: the front door is outside this shell and has a toggle of its
     own, and while the stamping lived here that one page could not change
     theme. The shell's own job is the button. */
  it('toggles the theme and remembers it', () => {
    renderShell();

    fireEvent.click(screen.getByRole('button', { name: 'Switch to the dark theme' }));

    expect(useUiStore.getState().theme).toBe('dark');
    expect(window.localStorage.getItem('gv.theme')).toBe('"dark"');

    fireEvent.click(screen.getByRole('button', { name: 'Switch to the light theme' }));

    expect(useUiStore.getState().theme).toBe('light');
  });

  it('offers the opposite of the theme in force, so the first click always moves', () => {
    /* The store reads the reader's choice when it is created; creation is
       covered in ui.store.test.ts. */
    useUiStore.setState({ theme: 'dark' });
    renderShell();

    expect(screen.getByRole('button', { name: 'Switch to the light theme' })).toBeTruthy();
  });

  it('offers the same places in the mobile bar', () => {
    renderShell();
    const nav = screen.getByRole('navigation', { name: 'Mobile' });

    expect([...nav.querySelectorAll('a')].map((a) => a.textContent)).toEqual([
      'Home',
      'Topics',
      'Reference',
    ]);
  });

  it('renders only the Tools group until the content store supplies topics', () => {
    render(
      <MemoryRouter>
        <AppShell>
          <h1>Home</h1>
        </AppShell>
      </MemoryRouter>,
    );

    const sidebar = screen.getByRole('complementary', { name: 'Topics' });

    expect(screen.queryByRole('link', { name: 'Tenses' })).toBeNull();
    expect(within(sidebar).getByRole('link', { name: 'Reference' })).toBeTruthy();
  });
});
