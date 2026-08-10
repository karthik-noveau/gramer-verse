import type { JSX } from 'react';

import { classNames } from 'common/utils/classNames';

import styles from './styles.module.css';

/* The set listed in ui-prototypes/assets/icons/README.md. `bell`, `user`,
   `settings` and `chart` were dropped as the product narrowed — no account, no
   notifications, no progress — and are deliberately absent rather than unused. */
export const ICON_NAMES = [
  'menu', 'close', 'chevronLeft', 'chevronRight', 'check', 'alert',
  'search', 'book', 'pencil', 'moon', 'sun', 'grid',
] as const;

export type IconName = (typeof ICON_NAMES)[number];
export type IconSize = 'sm' | 'md' | 'lg';

export type IconProps = {
  readonly name: IconName;
  readonly size?: IconSize;
  /** Give this only when the icon is the whole meaning — an icon-only button
   *  labels itself, and repeating the label here says it twice. */
  readonly label?: string;
  readonly className?: string;
};

export function Icon({ name, size = 'md', label, className }: IconProps): JSX.Element {
  return (
    <span
      className={classNames(styles.icon, styles[size], styles[name], className)}
      data-icon={name}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
