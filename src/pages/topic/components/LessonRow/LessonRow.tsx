import type { JSX } from 'react';
import { Link } from 'react-router';

import { paths } from 'common/constants/routes';
import type { Lesson, OutlineLesson } from 'common/scene/types';
import { classNames } from 'common/utils/classNames';

import styles from './styles.module.css';

/* ============================================================
   LessonRow — one line of a topic's outline.

   The notes list far more than this app can draw. A row whose
   lesson is authored is a link into it; a row whose lesson is
   not is still shown, with its example sentence, because the
   notes are the curriculum and hiding the parts not built yet
   would make the topic look shorter than it is.
   ============================================================ */

export type LessonRowProps = {
  readonly n: number;
  readonly outline: OutlineLesson;
  /** The authored lesson this row corresponds to, when there is one. */
  readonly lesson?: Lesson | undefined;
};

export function LessonRow({ n, outline, lesson }: LessonRowProps): JSX.Element {
  const body = (
    <>
      <span className={styles.n} aria-hidden="true">
        {n}
      </span>

      <span className={styles.text}>
        <span className={styles.title}>
          <span lang="en">{String(outline.title)}</span>
          {/* Glossed where the notes glossed it, and silent where they did
              not — thirty-two of these rows are English example sentences the
              source never translated. */}
          {outline.titleTa ? (
            <span className={styles.ta} lang="ta">
              {String(outline.titleTa)}
            </span>
          ) : null}
        </span>

        {outline.example ? (
          <span className={styles.example}>
            <span lang="en">{String(outline.example.en)}</span>
            <span className={styles.ta} lang="ta">
              {String(outline.example.ta)}
            </span>
          </span>
        ) : null}
      </span>

      <span className={classNames(styles.tag, lesson && styles.drawn)}>
        {lesson ? 'Drawn' : 'Not drawn yet'}
      </span>
    </>
  );

  if (!lesson) {
    return (
      <li className={styles.row}>
        <div className={styles.inner}>{body}</div>
      </li>
    );
  }

  return (
    <li className={styles.row}>
      <Link className={classNames(styles.inner, styles.link)} to={paths.lesson(String(lesson.id))}>
        {body}
      </Link>
    </li>
  );
}
