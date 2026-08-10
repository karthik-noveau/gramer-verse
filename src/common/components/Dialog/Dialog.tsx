import { useEffect, useId, useRef } from 'react';
import type { JSX, MouseEvent, ReactNode } from 'react';

import { useFocusTrap } from 'common/hooks/useFocusTrap';

import styles from './styles.module.css';

export type DialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly children: ReactNode;
  /** The buttons along the bottom. */
  readonly actions?: ReactNode;
};

/**
 * A modal question. It traps focus while open, closes on Escape or a click on
 * the scrim, and hands focus back to whatever opened it.
 */
export function Dialog({ open, onClose, title, children, actions }: DialogProps): JSX.Element | null {
  const id = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

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

  /* Only a click that both starts and ends on the scrim closes it — a drag that
     began inside the dialog and released outside is a selection, not a dismiss. */
  const onScrimClick = (event: MouseEvent<HTMLDivElement>): void => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div className={styles.scrim} onClick={onScrimClick} data-testid="dialog-scrim">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        ref={dialogRef}
      >
        <h2 className={styles.title} id={`${id}-title`}>
          {title}
        </h2>
        {children}
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </div>
  );
}
