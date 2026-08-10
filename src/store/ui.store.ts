import { create } from 'zustand';

import { isOneOf, read, write } from 'common/api/storage.api';
import { STORAGE_KEYS } from 'common/constants/storage-keys';

export type Theme = 'light' | 'dark';

const isTheme = isOneOf<Theme>('light', 'dark');
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

/* Reading and writing go through common/api/storage.api, which is the only
   module allowed to touch Browser Storage: it swallows a blocked or full store
   so a theme preference can never cost the reader the page. */

/**
 * The *effective* theme, not merely the stored one. If the root element is
 * already stamped — by a previous visit, or by anything that ran before the
 * app mounted — that is what the reader is looking at, and the first click of
 * the toggle has to move away from it. Reading only the stored value is how a
 * toggle appears to do nothing the first time it is pressed.
 */
export const readEffectiveTheme = (): Theme => {
  const stamped = document.documentElement.dataset['theme'];
  if (stamped === 'light' || stamped === 'dark') return stamped;
  return read<Theme>(STORAGE_KEYS.theme, 'light', isTheme);
};

export type UiState = {
  readonly sidebarCollapsed: boolean;
  readonly drawerOpen: boolean;
  readonly theme: Theme;
  /** Whether to go straight to the unlocked lesson. A learner who already
   *  knows the material should not be asked to guess before being allowed to
   *  play with the picture — and one who wants the question back can have it. */
  readonly skipPredict: boolean;
  readonly toggleSidebar: () => void;
  readonly setDrawerOpen: (open: boolean) => void;
  readonly toggleDrawer: () => void;
  readonly setTheme: (theme: Theme) => void;
  readonly toggleTheme: () => void;
  readonly setSkipPredict: (skip: boolean) => void;
};

/**
 * UI state only — what is open, what is collapsed, which theme. Nothing about
 * lessons, content or progress lives here.
 *
 * Nothing derived is stored: "is the drawer visible" is `drawerOpen` and the
 * viewport query together, computed where it is needed, because a stored copy
 * would be one resize away from lying.
 */
export const useUiStore = create<UiState>((set, get) => ({
  sidebarCollapsed: false,
  drawerOpen: false,

  /* Read once, when the store is created — before anything has rendered and so
     before anything has stamped the root element.

     Adopting it in an effect instead was wrong in a way that only showed up in
     the browser: the effect that stamps `data-theme` runs with the *first*
     render's value, so it wrote "light" onto the root, and the adopting effect
     then read that attribute back as the effective theme and saved it. A
     reload silently reset the reader's choice and overwrote it. */
  theme: readEffectiveTheme(),
  skipPredict: read<boolean>(STORAGE_KEYS.skipPredict, false, isBoolean),

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setDrawerOpen: (open) => set({ drawerOpen: open }),
  toggleDrawer: () => set((state) => ({ drawerOpen: !state.drawerOpen })),

  setTheme: (theme) => {
    write(STORAGE_KEYS.theme, theme);
    set({ theme });
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),

  setSkipPredict: (skip) => {
    write(STORAGE_KEYS.skipPredict, skip);
    set({ skipPredict: skip });
  },
}));
