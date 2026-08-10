import type { JSX } from 'react';

import { Button } from 'common/components/Button/Button';
import { paths } from 'common/constants/routes';
import type { Lesson, Topic } from 'common/scene/types';

import styles from './styles.module.css';

/* ============================================================
   LessonNav — back to the topic, on to the next lesson.

   The next lesson may be in the next topic: the curriculum is
   one sequence, and stopping at a topic boundary would make a
   learner go back to the index to carry on. At the very end
   there is no next, and this says so rather than offering a
   button that goes nowhere — nothing is tracked here, so "you
   have finished" would be a claim about the learner rather than
   about the content.
   ============================================================ */

export type LessonNavProps = {
  readonly topic: Topic | undefined;
  readonly next: Lesson | undefined;
  /** The topic the next lesson belongs to, which is worth saying before a
   *  learner is moved into a different one. */
  readonly nextTopic?: Topic | undefined;
};

export function LessonNav({ topic, next, nextTopic }: LessonNavProps): JSX.Element {
  const crossing = next !== undefined && nextTopic !== undefined && nextTopic.id !== topic?.id;

  return (
    <nav className={styles.nav} aria-label="Lesson">
      {topic ? (
        <Button to={paths.topic(String(topic.id))}>
          ← All {String(topic.title.en).toLowerCase()}
        </Button>
      ) : (
        <Button to={paths.topics()}>← All topics</Button>
      )}

      <span className={styles.spacer} />

      {next ? (
        <span className={styles.next}>
          {crossing ? (
            <span className={styles.crossing}>Next topic: {String(nextTopic.title.en)}</span>
          ) : null}
          <Button variant="primary" to={paths.lesson(String(next.id))}>
            {String(next.title.en)} →
          </Button>
        </span>
      ) : (
        <span className={styles.end}>
          That is the last lesson written so far.
          <span className={styles.ta} lang="ta">
            {' '}
            இதுவரை எழுதப்பட்ட கடைசி பாடம்.
          </span>
        </span>
      )}
    </nav>
  );
}
