import { useCallback, useEffect, useRef, useState } from 'react';

import { useReducedMotion } from 'common/hooks/useReducedMotion';
import type { KnobOption, Lesson } from 'common/scene/types';
import { useLessonStore } from 'store/lesson.store';
import { useUiStore } from 'store/ui.store';

/* ============================================================
   usePredict — ask before telling, and draw the mistake first.

   A learner who has committed to an answer has something at
   stake in the picture that follows. So the question comes
   before the controls are usable, and a wrong answer is *drawn*
   — the ball goes on top of the box, where the learner said it
   would be, and stays there long enough to be read — before the
   picture moves to what is true.

   The mistake is the lesson. Correcting it without showing it
   teaches nothing about why it was wrong.
   ============================================================ */

/**
 * How long the wrong picture is held.
 *
 * A pedagogical number, not a visual one: long enough to look at the picture,
 * read the sentence under it and recognise it as the thing you said, and short
 * enough that it does not read as the app having finished. Under it, the
 * correction is a flicker nobody connects to their own answer.
 */
export const HOLD_MS = 1800;

export type PredictStep = {
  /** Whether to ask at all. False for a lesson with no question, and for a
   *  learner who has turned the step off. */
  readonly ask: boolean;
  readonly answered: boolean;
  readonly correct: boolean;
  /** True while the learner's own answer is on the stage. */
  readonly holding: boolean;
  /** The knobs stay locked until the question has been answered. */
  readonly locked: boolean;
  /** The knob the question is about, while it is unanswered: hidden from the
   *  bar rather than disabled, because a disabled control still shows which
   *  option is currently set, and that is the answer. */
  readonly hiddenKnob: string | null;
  /** What was said, and what is true — for the comparison after a wrong
   *  answer. Null until there is something to compare. */
  readonly said: KnobOption | null;
  readonly truth: KnobOption | null;
  readonly choose: (value: string) => void;
};

const NOT_ASKED: Omit<PredictStep, 'choose'> = {
  ask: false,
  answered: false,
  correct: false,
  holding: false,
  locked: false,
  hiddenKnob: null,
  said: null,
  truth: null,
};

export function usePredict(lesson: Lesson | null): PredictStep {
  const predict = lesson?.predict ?? null;
  const skip = useUiStore((state) => state.skipPredict);
  const reduced = useReducedMotion();

  const state = useLessonStore((store) => store.predict);
  const answer = useLessonStore((store) => store.answer);
  const setKnob = useLessonStore((store) => store.setKnob);

  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Cancelled on the way out. A learner who walks off mid-sequence must not
     have the store written to from under the next page. */
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  /* A new lesson is a new question. */
  useEffect(() => {
    setHolding(false);
  }, [lesson]);

  const choose = useCallback(
    (value: string) => {
      if (!predict || state.answered || holding) return;

      answer(value);

      const knob = predict.knob;
      const wrong = value !== predict.answer;
      if (!knob || !wrong) return;

      /* Draw what they said. Then, after the hold, move to what is true — the
         scene animates between the two, which is the whole point of engine 20
         being underneath this. */
      setKnob(knob, value);

      if (reduced) {
        /* No sequence at all: both states are shown side by side instead, and
           the stage goes straight to the true one. */
        setKnob(knob, predict.answer);
        return;
      }

      setHolding(true);
      timer.current = setTimeout(() => {
        setKnob(knob, predict.answer);
        setHolding(false);
        timer.current = null;
      }, HOLD_MS);
    },
    [predict, state.answered, holding, answer, setKnob, reduced],
  );

  if (!predict || skip) return { ...NOT_ASKED, choose };

  const optionFor = (value: string | null): KnobOption | null =>
    predict.options.find((option) => option.value === value) ?? null;

  /* Only worth comparing when they differ. A correct answer has nothing to set
     beside itself. */
  const wrong = state.answered && !state.correct;

  return {
    ask: true,
    answered: state.answered,
    correct: state.correct,
    holding,
    locked: !state.answered,
    hiddenKnob: state.answered ? null : predict.knob,
    said: wrong ? optionFor(state.chosen) : null,
    truth: wrong ? optionFor(predict.answer) : null,
    choose,
  };
}
