import type { JSX } from 'react';

import { Card } from 'common/components/Card/Card';
import { paths } from 'common/constants/routes';
import type { Topic } from 'common/scene/types';

import styles from './styles.module.css';

/* ============================================================
   TopicCard — one of the ten.

   Number, title, and how many authored lessons are in it.
   Nothing else: there is no progress in this product, so there
   is no bar to fill, no percentage and no "continue where you
   left off". A card that reported one would be inventing a
   metric to fill space.
   ============================================================ */

export type TopicCardProps = {
  readonly topic: Topic;
  /** Counted from the topic's own lesson list, on read. A stored count is one
   *  content change away from being wrong. */
  readonly lessons: number;
};

export function TopicCard({ topic, lessons }: TopicCardProps): JSX.Element {
  return (
    <Card to={paths.topic(String(topic.id))} className={styles.card}>
      <span className={styles.n} aria-hidden="true">
        {topic.order}
      </span>

      <h3 className={styles.title}>
        <span lang="en">{String(topic.title.en)}</span>
        <span className={styles.ta} lang="ta">
          {String(topic.title.ta)}
        </span>
      </h3>

      {/* A zero authored-lesson count says nothing about the tables and
          examples already available on the topic page, so it is omitted. */}
      {lessons > 0 ? (
        <p className={styles.count}>{lessons} {lessons === 1 ? 'lesson' : 'lessons'}</p>
      ) : null}
    </Card>
  );
}
