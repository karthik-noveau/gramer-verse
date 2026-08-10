import { readEffectiveTheme, useUiStore } from 'store/ui.store';

const reset = (): void => {
  useUiStore.setState({ sidebarCollapsed: false, drawerOpen: false, theme: 'light' });
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
};

describe('ui.store', () => {
  beforeEach(reset);

  it('starts expanded, closed and light', () => {
    const state = useUiStore.getState();

    expect(state.sidebarCollapsed).toBe(false);
    expect(state.drawerOpen).toBe(false);
    expect(state.theme).toBe('light');
  });

  it('changes only through actions', () => {
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);

    useUiStore.getState().toggleDrawer();
    expect(useUiStore.getState().drawerOpen).toBe(true);

    useUiStore.getState().setDrawerOpen(false);
    expect(useUiStore.getState().drawerOpen).toBe(false);
  });

  it('persists the theme so it survives a reload', () => {
    useUiStore.getState().setTheme('dark');

    expect(useUiStore.getState().theme).toBe('dark');
    /* Stored as JSON by storage.api, so a value it did not write is
       recognised as one it cannot trust. */
    expect(window.localStorage.getItem('gv.theme')).toBe('"dark"');
  });

  it('toggles the theme both ways', () => {
    useUiStore.getState().toggleTheme();
    expect(useUiStore.getState().theme).toBe('dark');

    useUiStore.getState().toggleTheme();
    expect(useUiStore.getState().theme).toBe('light');
  });

  it('stores nothing derived — only the display preferences exist', () => {
    const keys = Object.entries(useUiStore.getState())
      .filter(([, value]) => typeof value !== 'function')
      .map(([key]) => key)
      .sort();

    /* Four flags, all of them things the reader chose: what is open, what is
       collapsed, which theme, and whether to be asked before being told.
       Nothing about lessons or progress belongs in here. */
    expect(keys).toEqual(['drawerOpen', 'sidebarCollapsed', 'skipPredict', 'theme']);
  });

  /* The store reads the theme when it is created, so proving that needs a
     fresh module registry rather than a fresh render. This is the reload the
     browser does, reproduced. */
  describe('on creation', () => {
    const freshStore = (): typeof useUiStore => {
      let store: typeof useUiStore | undefined;
      jest.isolateModules(() => {
        store = (jest.requireActual('store/ui.store') as { useUiStore: typeof useUiStore }).useUiStore;
      });
      if (!store) throw new Error('store failed to load');
      return store;
    };

    it('starts from the stored theme, so a reload keeps the reader’s choice', () => {
      window.localStorage.setItem('gv.theme', JSON.stringify('dark'));

      expect(freshStore().getState().theme).toBe('dark');
    });

    it('does not overwrite a stored dark with the default', () => {
      window.localStorage.setItem('gv.theme', JSON.stringify('dark'));
      freshStore();

      expect(window.localStorage.getItem('gv.theme')).toBe('"dark"');
    });

    it('starts light when nothing was stored', () => {
      expect(freshStore().getState().theme).toBe('light');
    });
  });

  describe('readEffectiveTheme', () => {
    it('is light when nothing has been chosen', () => {
      expect(readEffectiveTheme()).toBe('light');
    });

    it('reads the stored choice', () => {
      window.localStorage.setItem('gv.theme', JSON.stringify('dark'));

      expect(readEffectiveTheme()).toBe('dark');
    });

    it('prefers what is already on the page over what was stored', () => {
      window.localStorage.setItem('gv.theme', JSON.stringify('light'));
      document.documentElement.dataset['theme'] = 'dark';

      expect(readEffectiveTheme()).toBe('dark');
    });

    it('ignores a stored value that is not a theme', () => {
      window.localStorage.setItem('gv.theme', JSON.stringify('sepia'));

      expect(readEffectiveTheme()).toBe('light');
    });
  });
});
