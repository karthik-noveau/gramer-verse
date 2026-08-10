import { useMemo } from 'react';
import type { JSX } from 'react';

import { Breadcrumbs } from 'common/components/Breadcrumbs/Breadcrumbs';
import { Button } from 'common/components/Button/Button';
import { Card, CardNote } from 'common/components/Card/Card';
import { EmptyState } from 'common/components/EmptyState/EmptyState';
import { ErrorState } from 'common/components/ErrorState/ErrorState';
import { paths } from 'common/constants/routes';
import { useContent } from 'common/hooks/useContent';
import { ContentError } from 'common/api/validate';
import type { Topic } from 'common/scene/types';
import { TopicCard } from 'pages/topics/components/TopicCard/TopicCard';

import styles from './styles.module.css';

/* ============================================================
   /topics — the way in.

   There used to be a /dashboard as well, rendering the same grid
   from the same content under a different heading. With no
   progress in this product it had nothing to report that this
   page does not already say, so it redirects here and this is
   the only index there is.

   Nothing on this page is locked, dimmed or ordered by
   readiness. Every topic is a door.
   ============================================================ */

type Counted = { readonly topic: Topic; readonly lessons: number };

export default function TopicsPage(): JSX.Element {
  const content = useContent();

  /* Counted on read, from the topic's own list. Both the cards and the
     subtitle read the same numbers, so the two can never disagree — the
     prototype's old dashboard said "Ten topics" in English over "ஒன்பது" —
     nine — in Tamil, because the number was typed twice and only one copy was
     updated when conjunctions were split out. */
  const counted = useMemo<readonly Counted[]>(() => {
    if (content.status !== 'ready') return [];
    return [...content.topics]
      .sort((a, b) => a.order - b.order)
      .map((topic) => ({ topic, lessons: topic.lessonIds.length }));
  }, [content]);

  const lessons = counted.reduce((total, entry) => total + entry.lessons, 0);

  return (
    <>
      <Breadcrumbs items={[{ label: 'Topics' }]} />

      <div className={styles.head}>
        <h1>Start anywhere</h1>
        <p className={styles.sub}>
          {content.status === 'ready'
            ? `${counted.length} topics, ${lessons} lessons. Nothing is locked.`
            : 'Every topic, in teaching order.'}
          <span className={styles.ta} lang="ta">
            {' '}
            எங்கிருந்தும் தொடங்கலாம்.
          </span>
        </p>
      </div>

      {content.status === 'loading' ? <Skeletons /> : null}

      {content.status === 'error' ? (
        <ErrorState
          title="The curriculum could not be loaded"
          body="Nothing here can be shown until the content it is built from is valid."
          ta="உள்ளடக்கத்தை ஏற்ற முடியவில்லை."
          detail={detailOf(content.error)}

          action={
            <Button variant="primary" to={paths.landing()}>
              Back to the start
            </Button>
          }
        />
      ) : null}

      {content.status === 'ready' && counted.length === 0 ? (
        <EmptyState
          title="No topics yet"
          body="The curriculum is empty. Nothing is broken — there is simply nothing in it."
          ta="இன்னும் தலைப்புகள் இல்லை."
          action={
            <Button variant="primary" to={paths.landing()}>
              Back to the start
            </Button>
          }
        />
      ) : null}

      {counted.length > 0 ? (
        <ul className={styles.grid}>
          {counted.map(({ topic, lessons: count }) => (
            <li key={String(topic.id)}>
              <TopicCard topic={topic} lessons={count} />
            </li>
          ))}
        </ul>
      ) : null}

      {/* The two things that are not a topic. They were the old dashboard's
          only other content, and they belong wherever the topics are. */}
      <h2 className={styles.or}>Or</h2>
      <ul className={styles.pair}>
        <li>
          <Card to={paths.visualizer()}>
            <h3 className={styles.otherTitle}>Prepositions visualizer</h3>
            <CardNote>
              Pick a preposition and watch the picture. The place relations are a live scene
              you can change.
              <span className={styles.ta} lang="ta">
                இடைச்சொல்லைப் படமாகப் பாருங்கள்.
              </span>
            </CardNote>
          </Card>
        </li>
        <li>
          <Card to={paths.reference()}>
            <h3 className={styles.otherTitle}>Reference</h3>
            <CardNote>
              Every source table, browsable, with the corrections to the notes listed at the
              foot.
              <span className={styles.ta} lang="ta">
                அனைத்து அட்டவணைகளும்.
              </span>
            </CardNote>
          </Card>
        </li>
      </ul>
    </>
  );
}

/** The file and the rule, out of the error the content API threw. A reader who
 *  sees this is usually the person who has to fix the content. */
function detailOf(error: Error): string {
  if (!(error instanceof ContentError)) return error.message;
  const first = error.issues[0];
  return first ? `${first.file} → ${first.path} → ${first.rule}` : error.message;
}

/** The shape of the answer, while it is on its way. Cards rather than a
 *  spinner: the page it becomes is a grid of cards, and a layout that jumps
 *  when the content lands is a page that looked ready and was not. */
function Skeletons(): JSX.Element {
  return (
    <ul className={styles.grid} aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <li key={index}>
          <div className={styles.skeleton} />
        </li>
      ))}
    </ul>
  );
}
