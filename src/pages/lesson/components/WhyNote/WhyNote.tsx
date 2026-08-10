import type { JSX } from 'react';

import type { Bilingual } from 'common/scene/types';

import styles from './styles.module.css';

/* ============================================================
   WhyNote — why the picture looks like that.

   The one piece of prose in the lesson, and the reason the
   picture is a lesson rather than an illustration: a learner who
   has turned every knob and still does not know *why* `in` is a
   container has learnt a control, not a preposition.
   ============================================================ */

export type WhyNoteProps = {
  readonly why: Bilingual;
};

export function WhyNote({ why }: WhyNoteProps): JSX.Element {
  return (
    <section className={styles.why} aria-labelledby="why-heading">
      <h2 className={styles.title} id="why-heading">
        Why the picture looks like that
      </h2>
      <p className={styles.body} lang="en">
        {String(why.en)}
      </p>
      <p className={styles.ta} lang="ta">
        {String(why.ta)}
      </p>
    </section>
  );
}
