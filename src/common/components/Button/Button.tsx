import type { AnchorHTMLAttributes, ButtonHTMLAttributes, JSX, ReactNode } from 'react';
import { Link } from 'react-router';

import { classNames } from 'common/utils/classNames';

import styles from './styles.module.css';

export type ButtonVariant = 'default' | 'primary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

type Shared = {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** A square button whose only content is an icon. It must carry a label. */
  readonly iconOnly?: boolean;
  readonly className?: string;
  readonly children?: ReactNode;
};

type AsButton = Shared &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    readonly href?: undefined;
  };

type AsLink = Shared &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & {
    readonly href: string;
  };

/* A route inside the app. `href` would work and would also reload the whole
   application to get one page — the router exists to avoid exactly that. Use
   `href` for anything outside the app, `to` for anything inside it. */
type AsRoute = Shared & {
  readonly to: string;
  readonly href?: undefined;
  readonly 'aria-label'?: string;
};

export type ButtonProps = AsButton | AsLink | AsRoute;

const VARIANTS: Readonly<Record<ButtonVariant, string | undefined>> = {
  default: undefined,
  primary: styles.primary,
  ghost: styles.ghost,
  danger: styles.danger,
};

const SIZES: Readonly<Record<ButtonSize, string | undefined>> = {
  sm: styles.sm,
  md: undefined,
  lg: styles.lg,
};

/**
 * One button, four variants, three sizes. It renders an `<a>` when given an
 * `href` — the gallery styles links as buttons in several places, and a `<div
 * onClick>` or a button that navigates are both worse than the element that
 * already means "go somewhere".
 */
export function Button({
  variant = 'default',
  size = 'md',
  iconOnly = false,
  className,
  children,
  ...rest
}: ButtonProps): JSX.Element {
  const cls = classNames(
    styles.btn,
    VARIANTS[variant],
    SIZES[size],
    iconOnly && styles.icon,
    className,
  );

  if ('to' in rest && rest.to !== undefined) {
    const { to, ...linkProps } = rest as AsRoute;
    return (
      <Link className={cls} to={to} {...linkProps}>
        {children}
      </Link>
    );
  }

  if (rest.href !== undefined) {
    const { href, ...anchorProps } = rest as AsLink;
    return (
      <a className={cls} href={href} {...anchorProps}>
        {children}
      </a>
    );
  }

  const { type = 'button', ...buttonProps } = rest as AsButton;
  return (
    <button className={cls} type={type} {...buttonProps}>
      {children}
    </button>
  );
}
