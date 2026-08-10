import { useMemo, useState } from 'react';
import type { JSX } from 'react';
import { useParams } from 'react-router';

import { tablesOfTopic } from 'common/api/content.api';
import { Breadcrumbs } from 'common/components/Breadcrumbs/Breadcrumbs';
import { Button } from 'common/components/Button/Button';
import { Drawer } from 'common/components/Drawer/Drawer';
import { EmptyState } from 'common/components/EmptyState/EmptyState';
import { ErrorState } from 'common/components/ErrorState/ErrorState';
import { SourceTable } from 'common/components/SourceTable/SourceTable';
import { Spinner } from 'common/components/Spinner/Spinner';
import { Stage } from 'common/components/Stage/Stage';
import { paths } from 'common/constants/routes';
import { useContent } from 'common/hooks/useContent';
import type { Curriculum, Lesson, Topic } from 'common/scene/types';
import { KnobBar } from 'pages/lesson/components/KnobBar/KnobBar';
import { LessonNav } from 'pages/lesson/components/LessonNav/LessonNav';
import { PredictCard } from 'pages/lesson/components/PredictCard/PredictCard';
import { PredictResult } from 'pages/lesson/components/PredictResult/PredictResult';
import { SentenceLine } from 'pages/lesson/components/SentenceLine/SentenceLine';
import { WhyNote } from 'pages/lesson/components/WhyNote/WhyNote';
import { useLessonScene } from 'pages/lesson/hooks/useLessonScene';
import { usePredict } from 'pages/lesson/hooks/usePredict';
import { deriveScene } from 'store/lesson.store';
import { getNextLesson, useContentStore } from 'store/content.store';

import styles from './styles.module.css';

/* ============================================================
   /lessons/:lessonId — the product.

   Deliberately small: engines 16 to 21 built the picture, the
   sentence, the controls, the animation and the question, and
   this page puts them in order. Anything here that looked like
   logic would be logic in the wrong place — it belongs in a hook
   or a store, where it can be tested without a page around it.
   ============================================================ */

export default function LessonPage(): JSX.Element {
  const { lessonId } = useParams();
  const content = useContent();
  const next = useContentStore((state) => getNextLesson(state, lessonId));

  if (content.status === 'loading') return <Spinner label="Loading the lesson" />;

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

  const lesson = content.lessons.find((candidate) => String(candidate.id) === lessonId);

  /* An unknown id is the page's empty state, not a redirect: the address stays
     as it was typed, so the typo that caused it is still visible. */
  if (!lesson) {
    return (
      <>
        <Breadcrumbs items={[{ label: 'Topics', href: paths.topics() }, { label: 'Not found' }]} />
        <EmptyState
          title={`There is no lesson called “${lessonId ?? ''}”`}
          body="The address may have been mistyped, or the lesson may not be written yet."
          ta="இந்தப் பாடம் இல்லை."
          action={
            <Button variant="primary" to={paths.topics()}>
              All topics
            </Button>
          }
        />
      </>
    );
  }

  const topic = content.topics.find((candidate) => String(candidate.id) === String(lesson.topicId));

  return (
    <Workspace
      lesson={lesson}
      topic={topic}
      next={next}
      nextTopic={
        next
          ? content.topics.find((candidate) => String(candidate.id) === String(next.topicId))
          : undefined
      }
      curriculum={content.curriculum}
    />
  );
}

type WorkspaceProps = {
  readonly lesson: Lesson;
  readonly topic: Topic | undefined;
  readonly next: Lesson | undefined;
  readonly nextTopic: Topic | undefined;
  readonly curriculum: Curriculum;
};

function Workspace({ lesson, topic, next, nextTopic, curriculum }: WorkspaceProps): JSX.Element {
  const open = useLessonScene(lesson);
  const predict = usePredict(lesson);
  const [notesOpen, setNotesOpen] = useState(false);

  const tables = useMemo(
    () => (topic ? tablesOfTopic(curriculum, topic.id) : []),
    [curriculum, topic],
  );

  /* The lesson is opened by an effect, so the first render has nothing to
     draw. A spinner rather than a half-built workspace: one frame of a page
     with no picture in it reads as a picture that failed. */
  if (open.status !== 'open') return <Spinner label="Opening the lesson" />;

  /* The knob the question is about is hidden while it is unanswered — not
     disabled, because a disabled control still shows which option is set, and
     that is the answer. */
  const knobs = predict.hiddenKnob
    ? { ...lesson, knobs: lesson.knobs.filter((knob) => knob.key !== predict.hiddenKnob) }
    : lesson;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Topics', href: paths.topics() },
          ...(topic ? [{ label: String(topic.title.en), href: paths.topic(String(topic.id)) }] : []),
          { label: String(lesson.title.en) },
        ]}
      />

      <div className={styles.lesson}>
        <div className={styles.main}>
          <header className={styles.head}>
            <h1>{String(lesson.title.en)}</h1>
            <p className={styles.ta} lang="ta">
              {String(lesson.title.ta)}
            </p>
          </header>

          <p className={styles.idea}>
            <span lang="en">{String(lesson.idea.en)}</span>
            <span className={styles.ta} lang="ta">
              {String(lesson.idea.ta)}
            </span>
          </p>

          {predict.ask && lesson.predict ? (
            <PredictCard
              className={styles.predict}
              predict={lesson.predict}
              onChoose={predict.choose}
              answered={predict.answered}
              chosen={open.predict.chosen}
              correct={predict.correct}
            />
          ) : null}

          {predict.said && predict.truth && lesson.predict?.knob ? (
            <PredictResult
              className={styles.predict}
              said={predict.said}
              truth={predict.truth}
              saidScene={deriveScene(lesson, {
                ...open.knobs,
                [lesson.predict.knob]: predict.said.value,
              })}
              trueScene={deriveScene(lesson, {
                ...open.knobs,
                [lesson.predict.knob]: predict.truth.value,
              })}
              templates={lesson.sentence}
            />
          ) : null}

          <SentenceLine
            className={styles.sentence}
            scene={open.scene}
            templates={lesson.sentence}
            flash={open.lastKnob}
          />

          <div className={styles.stage}>
            <Stage
              spec={open.scene}
              fallback={
                <EmptyState
                  title="This one cannot be drawn"
                  body={open.problem ?? 'The scene has nothing to show.'}
                  icon="alert"
                />
              }
            />
          </div>

          <KnobBar
            className={styles.knobs}
            lesson={knobs}
            knobs={open.knobs}
            onChange={open.setKnob}
            locked={predict.locked}
          />

          <LessonNav topic={topic} next={next} nextTopic={nextTopic} />
        </div>

        <aside className={styles.rail}>
          <WhyNote why={lesson.why} />

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>In this topic</h2>
            <p className={styles.cardRow}>
              <Button size="sm" onClick={() => setNotesOpen(true)}>
                Open notes
              </Button>
              <Button size="sm" to={paths.visualizer()}>
                Try your own
              </Button>
            </p>
          </section>

          <section className={styles.source}>
            Source: Spoken English notes.
          </section>
        </aside>
      </div>

      <Drawer open={notesOpen} onClose={() => setNotesOpen(false)} title="Lesson notes">
        {tables.length > 0 ? (
          tables.map((table) => <SourceTable key={table.id} table={table} />)
        ) : (
          <p>No source table for this topic yet.</p>
        )}
      </Drawer>
    </>
  );
}
