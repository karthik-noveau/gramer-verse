import { useEffect } from 'react';

import { useUiStore } from 'store/ui.store';

/* ============================================================
   useThemeAttribute — the reader's theme, on the element the
   CSS looks at.

   It belongs to the document rather than to any one layout. It
   used to live in `AppShell`, which was true right up until the
   front door was moved out of the shell — and then the one page
   with a theme toggle on it was the one page that could not
   change theme.
   ============================================================ */

export function useThemeAttribute(): void {
  const theme = useUiStore((state) => state.theme);

  /* The store already holds the reader's choice — it read it when it was
     created. This only puts it where the stylesheet can see it. */
  useEffect(() => {
    document.documentElement.dataset['theme'] = theme;
  }, [theme]);
}
