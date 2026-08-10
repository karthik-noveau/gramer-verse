import { useEffect, useMemo } from 'react';

import { sceneProblem } from 'common/scene/renderers/registry';
import type { Lesson, SceneSpec } from 'common/scene/types';
import type { KnobValues, PredictState } from 'store/lesson.store';
import { deriveScene, useLessonStore } from 'store/lesson.store';

/* ============================================================
   useLessonScene — the open lesson, as the page needs it.

   The store holds the lesson and the knob values; the scene is
   worked out here, on read. Nothing is stored twice, and the
   page never has to decide which of two copies is current.
   ============================================================ */

export type LessonScene =
  | { readonly status: 'closed' }
  | {
      readonly status: 'open';
      readonly lesson: Lesson;
      readonly scene: SceneSpec;
      /** Why the scene will not draw, or null. A knob cannot get it into this
       *  state — `setKnob` refuses those — but a lesson can be authored into
       *  one, and the page says so rather than showing an empty stage. */
      readonly problem: string | null;
      readonly knobs: KnobValues;
      readonly lastKnob: string | null;
      readonly predict: PredictState;
      readonly setKnob: (key: string, value: string) => void;
      readonly answer: (value: string) => void;
    };

/**
 * Opens the lesson given, and closes it on the way out.
 *
 * `undefined` while the content is still loading, which is the same as closed:
 * there is nothing to show either way, and a page told about two kinds of
 * nothing has a state that means nothing to the reader.
 */
export function useLessonScene(lesson: Lesson | undefined): LessonScene {
  const open = useLessonStore((state) => state.open);
  const close = useLessonStore((state) => state.close);
  const current = useLessonStore((state) => state.lesson);
  const knobs = useLessonStore((state) => state.knobs);
  const lastKnob = useLessonStore((state) => state.lastKnob);
  const predict = useLessonStore((state) => state.predict);
  const setKnob = useLessonStore((state) => state.setKnob);
  const answer = useLessonStore((state) => state.answer);

  useEffect(() => {
    if (!lesson) return undefined;

    open(lesson);
    /* Closed on the way out, so walking to the next lesson never arrives
       carrying the last one's knob settings. */
    return () => close();
  }, [lesson, open, close]);

  /* Memoised on the two things it is made of. `Stage` is memoised on the spec's
     identity, so a scene rebuilt on every render would defeat it — and the
     picture would be redrawn for a knob nobody turned. */
  const scene = useMemo(
    () => (current ? deriveScene(current, knobs) : null),
    [current, knobs],
  );
  const problem = useMemo(() => (scene ? sceneProblem(scene) : null), [scene]);

  /* The effect that opens the lesson runs after this render, so the store is
     one render behind the prop. Reporting `closed` until they agree keeps the
     page from drawing the previous lesson's scene under this lesson's title. */
  if (!lesson || !current || !scene || String(current.id) !== String(lesson.id)) {
    return { status: 'closed' };
  }

  return {
    status: 'open',
    lesson: current,
    scene,
    problem,
    knobs,
    lastKnob,
    predict,
    setKnob,
    answer,
  };
}
