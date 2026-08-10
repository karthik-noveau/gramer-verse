import type { JSX } from 'react';

import { Button } from 'common/components/Button/Button';
import type { Predict } from 'common/scene/types';
import { classNames } from 'common/utils/classNames';

import styles from './styles.module.css';

/* ============================================================
   PredictCard — the question, before the controls open.

   Asked in both languages, answered by pressing one option, and
   nothing is scored. There are no points in this product: the
   question exists to make the learner commit, so that the
   picture that follows is an answer to something they said.
   ============================================================ */

export type PredictCardProps = {
  readonly predict: Predict;
  readonly onChoose: (value: string) => void;
  /** Set once answered: the card stays, showing what was asked and why. */
  readonly answered?: boolean;
  readonly chosen?: string | null;
  readonly correct?: boolean;
  readonly className?: string | undefined;
};

export function PredictCard({
  predict,
  onChoose,
  answered = false,
  chosen = null,
  correct = false,
  className,
}: PredictCardProps): JSX.Element {
  return (
    <section
      className={classNames(styles.card, answered && styles.answered, className)}
      aria-labelledby="predict-question"
    >
      <h2 className={styles.question} id="predict-question">
        <span lang="en">{String(predict.question.en)}</span>
        <span className={styles.ta} lang="ta">
          {String(predict.question.ta)}
        </span>
      </h2>

      <ul className={styles.options}>
        {predict.options.map((option) => {
          const picked = answered && option.value === chosen;
          const answer = answered && option.value === predict.answer;

          return (
            <li key={option.value}>
              <Button
                variant={picked ? 'primary' : 'default'}
                className={classNames(
                  styles.option,
                  picked && styles.picked,
                  answer && styles.answer,
                )}
                disabled={answered}
                onClick={() => onChoose(option.value)}
              >
                <span lang="en">{String(option.label.en)}</span>
                <span className={styles.ta} lang="ta">
                  {String(option.label.ta)}
                </span>
              </Button>
            </li>
          );
        })}
      </ul>

      {/* Announced when it arrives, because a learner who answered with the
          keyboard is not necessarily looking at this part of the page. */}
      <div aria-live="polite">
        {answered ? (
          <p className={styles.explain}>
            <strong className={styles.verdict} lang="en">
              {correct ? 'Yes — that is where it goes.' : 'Not quite. Look at the picture.'}
            </strong>
            <span lang="en">{String(predict.explain.en)}</span>
            <span className={styles.ta} lang="ta">
              {String(predict.explain.ta)}
            </span>
          </p>
        ) : null}
      </div>
    </section>
  );
}
