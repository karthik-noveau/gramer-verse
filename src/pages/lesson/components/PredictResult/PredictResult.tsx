import type { JSX } from 'react';

import { buildSentence, sentenceText } from 'common/scene/sentence';
import type { KnobOption, SceneSpec, SentenceTemplates } from 'common/scene/types';
import { classNames } from 'common/utils/classNames';

import styles from './styles.module.css';

/* ============================================================
   PredictResult — what you said, and what is true here.

   Side by side, both spelled out as full sentences in both
   languages. A learner who chose "on top of the box" should be
   able to read the sentence they described and the sentence that
   is true and see, in one line, exactly which word differs.

   Under reduced motion this is the whole of the correction: the
   stage does not run the sequence, so the comparison has to be
   readable standing still.
   ============================================================ */

export type PredictResultProps = {
  readonly said: KnobOption;
  readonly truth: KnobOption;
  /** The two scenes, so each column can say its own sentence. */
  readonly saidScene: SceneSpec;
  readonly trueScene: SceneSpec;
  readonly templates: SentenceTemplates;
  readonly className?: string | undefined;
};

export function PredictResult({
  said,
  truth,
  saidScene,
  trueScene,
  templates,
  className,
}: PredictResultProps): JSX.Element {
  return (
    <div className={classNames(styles.result, className)}>
      <Column
        title="What you said"
        titleTa="நீங்கள் சொன்னது"
        option={said}
        scene={saidScene}
        templates={templates}
        tone="said"
      />
      <Column
        title="What is true here"
        titleTa="இங்கே உண்மை"
        option={truth}
        scene={trueScene}
        templates={templates}
        tone="truth"
      />
    </div>
  );
}

type ColumnProps = {
  readonly title: string;
  readonly titleTa: string;
  readonly option: KnobOption;
  readonly scene: SceneSpec;
  readonly templates: SentenceTemplates;
  readonly tone: 'said' | 'truth';
};

function Column({ title, titleTa, option, scene, templates, tone }: ColumnProps): JSX.Element {
  const sentence = buildSentence(scene, templates);

  return (
    <section className={classNames(styles.column, styles[tone])}>
      <h3 className={styles.title}>
        <span lang="en">{title}</span>
        <span className={styles.ta} lang="ta">
          {titleTa}
        </span>
      </h3>
      <p className={styles.choice}>
        <span lang="en">{String(option.label.en)}</span>
        <span className={styles.ta} lang="ta">
          {String(option.label.ta)}
        </span>
      </p>
      <p className={styles.line} lang="en">
        {sentenceText(sentence.en)}
      </p>
      <p className={classNames(styles.line, styles.ta)} lang="ta">
        {sentenceText(sentence.ta)}
      </p>
    </section>
  );
}
