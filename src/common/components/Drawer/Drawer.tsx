import { useEffect, useId, useRef } from 'react';
import type { JSX, ReactNode } from 'react';

import { useFocusTrap } from 'common/hooks/useFocusTrap';

import styles from './styles.module.css';

export type DrawerProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly children: ReactNode;
};

/**
 * Supporting detail that should not take you off the page. Same rules as the
 * dialog — trapped, Escape closes, focus goes back — but it slides in from the
 * side and keeps the page visible behind it.
 */
export function Drawer({ open, onClose, title, children }: DrawerProps): JSX.Element | null {
  const id = useId();
  const drawerRef = useRef<HTMLElement>(null);
  useFocusTrap(drawerRef, open);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className={styles.scrim} onClick={onClose} data-testid="drawer-scrim" />
      <aside
        className={styles.drawer}
        data-open="true"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        ref={drawerRef}
      >
        <h2 className={styles.title} id={`${id}-title`}>
          {title}
        </h2>
        {children}
      </aside>
    </>
  );
}
