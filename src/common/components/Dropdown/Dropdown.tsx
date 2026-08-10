import { useEffect, useId, useRef, useState } from 'react';
import type { JSX, ReactNode } from 'react';

import { Button } from 'common/components/Button/Button';
import type { ButtonSize, ButtonVariant } from 'common/components/Button/Button';
import { classNames } from 'common/utils/classNames';

import styles from './styles.module.css';

export type DropdownProps = {
  /** The trigger's label. The button itself belongs to the dropdown, so the
   *  `aria-expanded` and `aria-haspopup` wiring cannot be forgotten. */
  readonly label: ReactNode;
  readonly children: ReactNode;
  /** The trigger is a real Button, so a dropdown in a toolbar matches the
   *  buttons beside it instead of being a bare unstyled one. */
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly className?: string;
};

/**
 * A menu hung off a button. Closes on Escape and on a click outside.
 *
 * The outside-click listener is attached on the *next* frame after opening.
 * Attached synchronously it catches the very click that opened the menu as it
 * finishes bubbling, and the menu shuts again immediately — the classic
 * "dropdown that never opens".
 */
export function Dropdown({
  label,
  children,
  variant = 'default',
  size = 'md',
  className,
}: DropdownProps): JSX.Element {
  const id = useId();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  /* The trigger is found through the wrapper rather than held in a ref: it is a
     Button, and threading a ref through it only to focus one element is more
     machinery than the one query it replaces. */

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: Event): void => {
      const target = event.target;
      if (target instanceof Node && wrapRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      wrapRef.current?.querySelector('button')?.focus();
    };

    const frame = window.setTimeout(() => {
      document.addEventListener('pointerdown', onPointerDown);
      document.addEventListener('click', onPointerDown);
    }, 0);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      window.clearTimeout(frame);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('click', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className={classNames(styles.wrap, className)} ref={wrapRef}>
      <Button
        variant={variant}
        size={size}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${id}-menu`}
        onClick={() => setOpen((current) => !current)}
      >
        {label}
      </Button>
      <div className={styles.menu} id={`${id}-menu`} role="menu" hidden={!open}>
        {children}
      </div>
    </div>
  );
}
