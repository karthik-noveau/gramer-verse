import { act, renderHook } from '@testing-library/react';

import { useThemeAttribute } from 'common/hooks/useThemeAttribute';
import { useUiStore } from 'store/ui.store';

/* The theme belongs to the document, not to a layout. This is the hook that
   puts it there, and it is mounted above the routes — including the front
   door, which is outside the app shell and carries a toggle of its own. */

beforeEach(() => {
  delete document.documentElement.dataset['theme'];
  useUiStore.setState({ theme: 'light' });
});

describe('useThemeAttribute', () => {
  it('stamps the theme the store is holding', () => {
    renderHook(() => useThemeAttribute());

    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it('restamps when the reader changes it', () => {
    renderHook(() => useThemeAttribute());

    act(() => {
      useUiStore.getState().toggleTheme();
    });

    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('adopts a choice the store was created with', () => {
    useUiStore.setState({ theme: 'dark' });
    renderHook(() => useThemeAttribute());

    expect(document.documentElement.dataset['theme']).toBe('dark');
  });
});
