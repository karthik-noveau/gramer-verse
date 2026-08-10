import { useMemo } from 'react';
import type { JSX } from 'react';
import { useParams } from 'react-router';

import { describeTopic, formationFor, outlineOfTopic, tablesOfTopic } from 'common/api/content.api';
import { Breadcrumbs } from 'common/components/Breadcrumbs/Breadcrumbs';
import { Button } from 'common/components/Button/Button';
import { EmptyState } from 'common/components/EmptyState/EmptyState';
import { ErrorState } from 'common/components/ErrorState/ErrorState';
import { SourceTable } from 'common/components/SourceTable/SourceTable';
import { Spinner } from 'common/components/Spinner/Spinner';
import { Tabs } from 'common/components/Tabs/Tabs';
import { paths } from 'common/constants/routes';
import { useContent } from 'common/hooks/useContent';
import type { Curriculum, Lesson, OutlineGroup, Topic } from 'common/scene/types';
import { LessonRow } from 'pages/topic/components/LessonRow/LessonRow';

import styles from './styles.module.css';

/* ============================================================
   /topics/:topicId — one topic, whole.

   The source table first and the outline under it, because
   reading a topic at once is faster than stepping through it one
   word at a time. The rows the app can draw are links; the rest
   are still listed, because the notes are the curriculum and a
   page that hid what is not built yet would make the topic look
   shorter than it is.
   ============================================================ */

export default function TopicPage(): JSX.Element {
  const { topicId } = useParams();
  const content = useContent();

  if (content.status === 'loading') return <Spinner label="Loading the topic" />;

  if (content.status === 'error') {
    return (
      <ErrorState
        title="The curriculum could not be loaded"
        body="Nothing here can be shown until the content it is built from is valid."
        ta="உள்ளடக்கத்தை ஏற்ற முடியவில்லை."
        detail={content.error.message}
        action={
          <Button variant="primary" to={paths.topics()}>
            All topics
          </Button>
        }
      />
    );
  }

  const topic = content.topics.find((candidate) => String(candidate.id) === topicId);

  /* An unknown id renders the empty state and leaves the address alone. A
     redirect would hide the typo that caused it. */
  if (!topic) {
    return (
      <>
        <Breadcrumbs items={[{ label: 'Topics', href: paths.topics() }, { label: 'Not found' }]} />
        <EmptyState
          title={`There is no topic called “${topicId ?? ''}”`}
          body="The address may have been mistyped, or the topic may have been renamed."
          ta="இந்தத் தலைப்பு இல்லை."
          action={
            <Button variant="primary" to={paths.topics()}>
              All topics
            </Button>
          }
        />
      </>
    );
  }

  return <Topic topic={topic} lessons={content.lessons} curriculum={content.curriculum} />;
}

type TopicProps = {
  readonly topic: Topic;
  readonly lessons: readonly Lesson[];
  readonly curriculum: Curriculum;
};

function Topic({ topic, lessons, curriculum }: TopicProps): JSX.Element {
  const tables = useMemo(() => tablesOfTopic(curriculum, topic.id), [curriculum, topic]);
  const outline = useMemo(() => outlineOfTopic(curriculum, topic.id), [curriculum, topic]);
  const groups = outline?.groups ?? [];

  const mine = useMemo(
    () => lessons.filter((lesson) => String(lesson.topicId) === String(topic.id)),
    [lessons, topic],
  );
  const first = [...mine].sort((a, b) => a.order - b.order)[0];

  return (
    <>
      <Breadcrumbs
        items={[{ label: 'Topics', href: paths.topics() }, { label: String(topic.title.en) }]}
      />

      <div className={styles.head}>
        <div>
          <h1>{String(topic.title.en)}</h1>
          <p className={styles.ta} lang="ta">
            {String(topic.title.ta)}
          </p>
          {/* Led by the question the topic answers, so the line has a subject
              of its own rather than reading as a fragment under the heading. */}
          <p className={styles.sub}>
            <span lang="en">{describeTopic(topic).en}</span>
            <span className={styles.ta} lang="ta">
              {describeTopic(topic).ta}
            </span>
          </p>
        </div>

        {/* There is no progress record, so there is no "resume" — this is the
            first lesson of the topic, every time.

            The visualizer is offered on prepositions alone: the scene engine
            draws a figure against a ground, which is what a preposition of
            place is, and no other topic has anything for it to stage. */}
        <p className={styles.cta}>
          {String(topic.id) === 'prepositions' ? (
            <Button variant="primary" to={paths.visualizer()}>
              Try in visualizer
            </Button>
          ) : null}
          {first ? (
            <Button
              variant={String(topic.id) === 'prepositions' ? 'default' : 'primary'}
              to={paths.lesson(String(first.id))}
            >
              Start with “{String(first.title.en)}”
            </Button>
          ) : null}
        </p>
      </div>

      <section className={styles.tables}>
        {tables.length > 0 ? (
          tables.map((table) => (
            <SourceTable
              key={table.id}
              table={table}
              /* Where the notes gave a sentence in both languages, the row can
                 be opened into a diagram of how the two are ordered. */
              formationOf={(row, index) => formationFor(curriculum, table.id, index, row)}
            />
          ))
        ) : (
          <p className={styles.none}>No source table for this topic yet.</p>
        )}
      </section>

      <h2 className={styles.listHead}>What is in it</h2>
      <Outline groups={groups} lessons={mine} />
    </>
  );
}

/**
 * The topic's own shape.
 *
 * Prepositions has four groups and most topics have one. A single group is not
 * a choice, so it renders as a plain list rather than as one tab nobody can
 * move away from.
 */
function Outline({
  groups,
  lessons,
}: {
  readonly groups: readonly OutlineGroup[];
  readonly lessons: readonly Lesson[];
}): JSX.Element {
  if (groups.length === 0) {
    return (
      <p className={styles.none}>
        The notes have no outline for this topic.
        <span className={styles.ta} lang="ta">
          {' '}
          இந்தத் தலைப்புக்கு வரிசை இல்லை.
        </span>
      </p>
    );
  }

  if (groups.length === 1) {
    const only = groups[0];
    return <Rows group={only as OutlineGroup} lessons={lessons} />;
  }

  return (
    <Tabs
      label="Groups"
      items={groups.map((group, index) => ({
        id: String(index),
        label: String(group.title.en),
        panel: <Rows group={group} lessons={lessons} />,
      }))}
    />
  );
}

function Rows({
  group,
  lessons,
}: {
  readonly group: OutlineGroup;
  readonly lessons: readonly Lesson[];
}): JSX.Element {
  return (
    <ul className={styles.rows}>
      {group.lessons.map((outline, index) => (
        <LessonRow
          key={`${String(outline.title)}-${index}`}
          n={index + 1}
          outline={outline}
          lesson={authoredFor(lessons, group, String(outline.title))}
        />
      ))}
    </ul>
  );
}

/**
 * The authored lesson a line of the outline corresponds to, if any.
 *
 * Matched on the title, within the topic. `in` appears in both the Place group
 * and the Time group of prepositions and only one of them is drawn, so where a
 * title is ambiguous the lesson's own id has to name the group — which is a
 * convention rather than a field, and the reason this returns nothing at all
 * rather than guessing when it cannot tell.
 */
export function authoredFor(
  lessons: readonly Lesson[],
  group: OutlineGroup,
  title: string,
): Lesson | undefined {
  const named = lessons.filter(
    (lesson) => String(lesson.title.en).toLowerCase() === title.toLowerCase(),
  );
  if (named.length === 0) return undefined;
  if (named.length === 1) return named[0];

  const slug = String(group.title.en).toLowerCase().replace(/\s+/g, '-');
  return named.find((lesson) => String(lesson.id).includes(slug));
}
