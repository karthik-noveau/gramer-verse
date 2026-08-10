import type { JSX } from 'react';

import { Button } from 'common/components/Button/Button';
import { Icon } from 'common/components/Icon/Icon';
import { classNames } from 'common/utils/classNames';

import styles from './styles.module.css';

/* ============================================================
   CannotDraw — what could not be drawn, and what to type
   instead.

   A state of this product, not an error in it. The learner has
   done nothing wrong by typing a sentence about a rocket; the
   library simply has no rocket in it. So this is warm rather
   than red, it names the words one at a time, and it never
   leaves without offering something that does work.
   ============================================================ */

export type CannotDrawProps = {
  /** Words nobody drew, each named. */
  readonly unknown: readonly string[];
  /** What the sentence left out — a different problem, said separately. */
  readonly gaps: readonly string[];
  /** An action, where one was named. */
  readonly verb?: { readonly word: string; readonly drawable: boolean } | null;
  /** A sentence this app can draw. Always offered. */
  readonly suggestion: string;
  /** Types the suggestion into the box and draws it. */
  readonly onTry?: ((sentence: string) => void) | undefined;
  readonly className?: string | undefined;
};

export function CannotDraw({
  unknown,
  gaps,
  verb = null,
  suggestion,
  onTry,
  className,
}: CannotDrawProps): JSX.Element {
  return (
    <section className={classNames(styles.card, className)} aria-labelledby="cannot-draw">
      <h3 className={styles.title} id="cannot-draw">
        <Icon name="alert" />
        This one cannot be drawn
        <span className={styles.ta} lang="ta">
          இதை வரைய முடியாது
        </span>
      </h3>

      {unknown.length > 0 ? (
        <p className={styles.line}>
          Not in the drawing library:{' '}
          {unknown.map((word, index) => (
            <span key={word}>
              {index > 0 ? ', ' : ''}
              <b className={styles.word}>{word}</b>
            </span>
          ))}
          .
        </p>
      ) : null}

      {/* Said apart from the unknown words. "Rocket, and nowhere to put it"
          reported as one list is two different problems wearing one label. */}
      {gaps.length > 0 ? (
        <p className={classNames(styles.line, styles.gap)}>
          The sentence also leaves {gaps.join(' and ')}.
        </p>
      ) : null}

      {verb ? (
        <p className={styles.line}>
          <b className={styles.word}>{verb.word}</b>{' '}
          {verb.drawable
            ? 'is an action. This page draws where things are; what somebody does with them is a lesson.'
            : 'is an action with no picture — it happens inside somebody, and nothing here can show that honestly.'}
        </p>
      ) : null}

      <p className={styles.tryIt}>
        <span className={styles.label}>Nearest drawable</span>
        <code className={styles.suggestion}>{suggestion}</code>
        {onTry ? (
          <Button size="sm" variant="primary" onClick={() => onTry(suggestion)}>
            Try it
          </Button>
        ) : null}
      </p>
    </section>
  );
}
