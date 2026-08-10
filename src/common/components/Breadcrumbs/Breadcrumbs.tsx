import { Fragment } from 'react';
import type { JSX } from 'react';

import { classNames } from 'common/utils/classNames';

import styles from './styles.module.css';

export type Crumb = {
  readonly label: string;
  /** The last crumb is where you already are, so it has no href. */
  readonly href?: string;
};

export type BreadcrumbsProps = {
  readonly items: readonly Crumb[];
  readonly label?: string;
  readonly className?: string;
};

/**
 * The trail back. The final crumb is marked `aria-current="page"` rather than
 * linked — a link to the page you are on is a link that does nothing.
 */
export function Breadcrumbs({
  items,
  label = 'Breadcrumb',
  className,
}: BreadcrumbsProps): JSX.Element {
  const last = items.length - 1;

  return (
    <nav className={classNames(styles.breadcrumbs, className)} aria-label={label}>
      {items.map((item, index) => (
        <Fragment key={`${item.label}-${index}`}>
          {index > 0 ? (
            <span className={styles.sep} aria-hidden="true">
              /
            </span>
          ) : null}
          {item.href !== undefined && index !== last ? (
            <a href={item.href}>{item.label}</a>
          ) : (
            <span className={styles.current} aria-current={index === last ? 'page' : undefined}>
              {item.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
