import type { JSX } from 'react';

import { Card } from 'common/components/Card/Card';
import { paths } from 'common/constants/routes';
import type { Topic } from 'common/scene/types';

import styles from './styles.module.css';

/* ============================================================
   TopicCard — one of the ten.

   Number and title only. Lesson counts belong inside a topic;
   showing one here made the only topic with authored lessons
   look more important than the reference-first topics. There
   is no progress in this product, so there
   is no bar to fill, no percentage and no "continue where you
   left off". A card that reported one would be inventing a
   metric to fill space.
   ============================================================ */

export type TopicCardProps = {
  readonly topic: Topic;
};

export function TopicCard({ topic }: TopicCardProps): JSX.Element {
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

    </Card>
  );
}
