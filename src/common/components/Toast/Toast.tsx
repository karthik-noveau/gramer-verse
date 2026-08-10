import type { JSX, ReactNode } from 'react';

import { classNames } from 'common/utils/classNames';
import { Icon } from 'common/components/Icon/Icon';

import styles from './styles.module.css';

export type ToastTone = 'default' | 'warn' | 'danger';

export type ToastProps = {
  readonly title: string;
  readonly body?: ReactNode;
  readonly tone?: ToastTone;
  readonly onDismiss?: () => void;
  readonly className?: string;
};

const TONES: Readonly<Record<ToastTone, string | undefined>> = {
  default: undefined,
  warn: styles.warn,
  danger: styles.danger,
};

/**
 * The only thing in the app that speaks unprompted, and it is always a response
 * to something the reader just did.
 *
 * `aria-live="polite"`, never a dialog: a toast that takes focus interrupts
 * whatever was being typed, and there is nothing in it that has to be answered.
 */
export function Toast({
  title,
  body,
  tone = 'default',
  onDismiss,
  className,
}: ToastProps): JSX.Element {
  return (
    <div className={classNames(styles.toast, TONES[tone], className)} role="status" aria-live="polite">
      <div>
        <div className={styles.title}>{title}</div>
        {body ? <div className={styles.body}>{body}</div> : null}
      </div>
      <span className={styles.spacer} />
      {onDismiss ? (
        <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss">
          <Icon name="close" size="sm" />
        </button>
      ) : null}
    </div>
  );
}

export type ToastRegionProps = {
  readonly children: ReactNode;
};

/** Where toasts stack. Its own live region so a second toast is announced too. */
export function ToastRegion({ children }: ToastRegionProps): JSX.Element {
  return (
    <div className={styles.region} aria-live="polite" aria-relevant="additions">
      {children}
    </div>
  );
}
