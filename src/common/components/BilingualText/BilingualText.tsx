import type { ElementType, JSX } from 'react';

import { classNames } from 'common/utils/classNames';

import styles from './styles.module.css';

export type BilingualTextProps = {
  readonly en: string;
  readonly ta: string;
  /** The element to render. A sentence in a table cell is not a heading. */
  readonly as?: ElementType;
  /** Side by side instead of stacked, for a cell or a breadcrumb. */
  readonly inline?: boolean;
  readonly className?: string;
};

/**
 * The most-used component in the app: an English string and its Tamil, both
 * carrying the `lang` attribute that picks the right font stack and tells a
 * screen reader which voice to use.
 *
 * A missing Tamil string is a content error, not a layout case. In development
 * it throws, because that is the only way it gets fixed; in production it
 * renders the English with a visible marker rather than silently looking
 * complete — an English-only string that looks finished is exactly how a
 * bilingual product quietly becomes a monolingual one.
 */
export function BilingualText({
  en,
  ta,
  as: Tag = 'span',
  inline = false,
  className,
}: BilingualTextProps): JSX.Element {
  const missing = ta.trim().length === 0;

  if (missing && process.env.NODE_ENV !== 'production') {
    throw new Error(`BilingualText: Tamil is missing for "${en}". Every string ships in both languages.`);
  }

  return (
    <Tag className={classNames(styles.bi, inline && styles.inline, className)}>
      <span className={styles.en} lang="en">
        {en}
      </span>
      {missing ? (
        <span className={styles.missing} data-missing-ta="true">
          [தமிழ் இல்லை]
        </span>
      ) : (
        <span className={styles.ta} lang="ta">
          {ta}
        </span>
      )}
    </Tag>
  );
}
