import type { JSX, ReactNode } from 'react';
import { Link } from 'react-router';

import { classNames } from 'common/utils/classNames';

import styles from './styles.module.css';

export type CardVariant = 'default' | 'flat' | 'muted';

export type CardProps = {
  readonly variant?: CardVariant;
  /** Given an href the card becomes a link — topic and lesson cards are links,
   *  and a clickable div is not reachable by keyboard. */
  readonly href?: string;
  /** A route inside the app. `href` would work and would also reload the whole
   *  application to get one page, which is the thing the router exists to
   *  avoid. Use `href` for anything outside the app, `to` for anything in it. */
  readonly to?: string;
  readonly children: ReactNode;
  readonly className?: string | undefined;
};

const VARIANTS: Readonly<Record<CardVariant, string | undefined>> = {
  default: undefined,
  flat: styles.flat,
  muted: styles.muted,
};

export function Card({ variant = 'default', href, to, children, className }: CardProps): JSX.Element {
  const cls = classNames(
    styles.card,
    VARIANTS[variant],
    (href ?? to) !== undefined && styles.interactive,
    className,
  );

  if (to !== undefined) {
    return (
      <Link className={cls} to={to}>
        {children}
      </Link>
    );
  }
  if (href !== undefined) {
    return (
      <a className={cls} href={href}>
        {children}
      </a>
    );
  }
  return <div className={cls}>{children}</div>;
}

export type CardNoteProps = {
  readonly children: ReactNode;
};

/** The one line under a card's title. */
export function CardNote({ children }: CardNoteProps): JSX.Element {
  return <p className={styles.note}>{children}</p>;
}
