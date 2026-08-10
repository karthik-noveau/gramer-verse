import type { JSX, ReactNode } from 'react';

import { classNames } from 'common/utils/classNames';

import styles from './styles.module.css';

export type BadgeTone = 'neutral' | 'accent' | 'warn' | 'danger' | 'info';

export type BadgeProps = {
  readonly tone?: BadgeTone;
  readonly children: ReactNode;
  readonly className?: string;
};

const TONES: Readonly<Record<BadgeTone, string | undefined>> = {
  neutral: undefined,
  accent: styles.accent,
  warn: styles.warn,
  danger: styles.danger,
  info: styles.info,
};

/** A static label: drawable, not yet drawable, could not draw, source note. */
export function Badge({ tone = 'neutral', children, className }: BadgeProps): JSX.Element {
  return <span className={classNames(styles.badge, TONES[tone], className)}>{children}</span>;
}
