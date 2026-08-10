import { act, renderHook } from '@testing-library/react';

import { HOLD_MS, usePredict } from 'pages/lesson/hooks/usePredict';
import type { Lesson, LessonId, NonEmptyString, PlaceSpec, PropId, TopicId } from 'common/scene/types';
import { selectScene, useLessonStore } from 'store/lesson.store';
import { useUiStore } from 'store/ui.store';

/* ============================================================
   usePredict.test.ts

   The one behaviour worth all of this: a wrong answer is drawn
   before it is corrected. Most of what is asserted here is what
   the *scene* is at each moment, because that is the teaching —
   the card only says the words.
   ============================================================ */

const bi = (en: string, ta: string): { en: NonEmptyString; ta: NonEmptyString } => ({
  en: en as NonEmptyString,
  ta: ta as NonEmptyString,
});

const id = (value: string): PropId => value as PropId;

const SCENE: PlaceSpec = {
  kind: 'place',
  figure: id('ball'),
  ground: id('box'),
  ground2: null,
  relation: 'in',
  determiner: 'the',
  count: 1,
  adjective: null,
};

const LESSON: Lesson = {
  id: 'prep-place-in' as LessonId,
  topicId: 'prepositions' as TopicId,
  order: 1,
  title: bi('in', 'உள்ளே'),
  idea: bi('Inside something.', 'ஒன்றின் உள்ளே.'),
  scene: SCENE,
  knobs: [
    {
      key: 'relation',
      label: bi('The word', 'சொல்'),
      options: [
        { value: 'in', label: bi('in', 'உள்ளே') },
        { value: 'on', label: bi('on', 'மேல்') },
      ],
    },
  ],
  predict: {
    question: bi('Where does the ball sit?', 'பந்து எங்கே இருக்கும்?'),
    options: [
      { value: 'in', label: bi('inside the box', 'பெட்டிக்கு உள்ளே') },
      { value: 'on', label: bi('on top of the box', 'பெட்டியின் மேல்') },
    ],
    answer: 'in',
    explain: bi('The sides are around it.', 'பக்கங்கள் சுற்றி உள்ளன.'),
    knob: 'relation',
  },
  why: bi('The box has sides.', 'பெட்டிக்குப் பக்கங்கள் உள்ளன.'),
  sentence: { en: [{ slot: 'figure' }], ta: [{ slot: 'figure', case: 'nominative' }] },
};

/** A question with no consequence in the picture: answered and explained, and
 *  nothing is drawn wrongly first. */
const CONCEPTUAL: Lesson = {
  ...LESSON,
  predict: { ...(LESSON.predict as NonNullable<Lesson['predict']>), knob: null },
};

const relationNow = (): string | undefined => {
  const scene = selectScene(useLessonStore.getState());
  return scene && scene.kind === 'place' ? scene.relation : undefined;
};

const open = (lesson: Lesson = LESSON): void => {
  act(() => {
    useLessonStore.getState().open(lesson);
  });
};

beforeEach(() => {
  jest.useFakeTimers();
  useLessonStore.getState().reset();
  useUiStore.setState({ skipPredict: false });
});

afterEach(() => {
  act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

describe('usePredict', () => {
  it('asks, and locks the knobs until it is answered', () => {
    open();
    const { result } = renderHook(() => usePredict(LESSON));

    expect(result.current.ask).toBe(true);
    expect(result.current.locked).toBe(true);
    expect(result.current.answered).toBe(false);
  });

  it('hides the knob the question is about, rather than disabling it', () => {
    /* A disabled control still shows which option is set, and that is the
       answer. */
    open();
    const { result } = renderHook(() => usePredict(LESSON));

    expect(result.current.hiddenKnob).toBe('relation');
  });

  it('asks nothing for a lesson with no question', () => {
    open({ ...LESSON, predict: null });
    const { result } = renderHook(() => usePredict({ ...LESSON, predict: null }));

    expect(result.current.ask).toBe(false);
    expect(result.current.locked).toBe(false);
    expect(result.current.hiddenKnob).toBeNull();
  });

  it('asks nothing when the learner has turned the step off', () => {
    useUiStore.setState({ skipPredict: true });
    open();
    const { result } = renderHook(() => usePredict(LESSON));

    expect(result.current.ask).toBe(false);
    expect(result.current.locked).toBe(false);
  });

  describe('a right answer', () => {
    it('unlocks, and leaves the picture where it was', () => {
      open();
      const { result } = renderHook(() => usePredict(LESSON));

      act(() => {
        result.current.choose('in');
      });

      expect(result.current.answered).toBe(true);
      expect(result.current.correct).toBe(true);
      expect(result.current.locked).toBe(false);
      expect(result.current.holding).toBe(false);
      expect(relationNow()).toBe('in');
    });

    it('has nothing to set side by side', () => {
      open();
      const { result } = renderHook(() => usePredict(LESSON));

      act(() => {
        result.current.choose('in');
      });

      expect(result.current.said).toBeNull();
      expect(result.current.truth).toBeNull();
    });
  });

  describe('a wrong answer', () => {
    it('draws what was said, and holds it', () => {
      open();
      const { result } = renderHook(() => usePredict(LESSON));

      act(() => {
        result.current.choose('on');
      });

      expect(relationNow()).toBe('on');
      expect(result.current.holding).toBe(true);
    });

    it('moves to what is true once the hold is over', () => {
      open();
      const { result } = renderHook(() => usePredict(LESSON));

      act(() => {
        result.current.choose('on');
      });
      act(() => {
        jest.advanceTimersByTime(HOLD_MS + 10);
      });

      expect(relationNow()).toBe('in');
      expect(result.current.holding).toBe(false);
    });

    it('ignores another answer during the hold', () => {
      /* Answering mid-sequence would leave the scene and the sentence
         describing different moments. */
      open();
      const { result } = renderHook(() => usePredict(LESSON));

      act(() => {
        result.current.choose('on');
      });
      act(() => {
        result.current.choose('in');
      });

      expect(relationNow()).toBe('on');
      expect(result.current.correct).toBe(false);
    });

    it('unlocks the knobs — the learner explores either way', () => {
      open();
      const { result } = renderHook(() => usePredict(LESSON));

      act(() => {
        result.current.choose('on');
      });

      expect(result.current.locked).toBe(false);
      expect(result.current.hiddenKnob).toBeNull();
    });

    it('hands back both options to be set side by side', () => {
      open();
      const { result } = renderHook(() => usePredict(LESSON));

      act(() => {
        result.current.choose('on');
      });

      expect(String(result.current.said?.label.en)).toBe('on top of the box');
      expect(String(result.current.truth?.label.en)).toBe('inside the box');
    });

    it('draws nothing wrongly for a question with no knob behind it', () => {
      open(CONCEPTUAL);
      const { result } = renderHook(() => usePredict(CONCEPTUAL));

      act(() => {
        result.current.choose('on');
      });

      expect(relationNow()).toBe('in');
      expect(result.current.holding).toBe(false);
      expect(result.current.answered).toBe(true);
    });
  });

  describe('reduced motion', () => {
    beforeEach(() => {
      window.matchMedia = ((query: string) => ({
        matches: query.includes('reduce'),
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      })) as unknown as typeof window.matchMedia;
    });

    afterEach(() => {
      // @ts-expect-error putting jsdom back the way it was found
      delete window.matchMedia;
    });

    it('runs no sequence: the picture is the true one and the comparison is static', () => {
      open();
      const { result } = renderHook(() => usePredict(LESSON));

      act(() => {
        result.current.choose('on');
      });

      expect(result.current.holding).toBe(false);
      expect(relationNow()).toBe('in');
      /* The comparison is still there — it is the whole correction now. */
      expect(result.current.said).not.toBeNull();
      expect(result.current.truth).not.toBeNull();
    });
  });

  it('cancels the hold when the learner walks away mid-sequence', () => {
    open();
    const { result, unmount } = renderHook(() => usePredict(LESSON));

    act(() => {
      result.current.choose('on');
    });
    unmount();
    act(() => {
      useLessonStore.getState().close();
      jest.advanceTimersByTime(HOLD_MS + 10);
    });

    /* The timer fired into a closed store would have reopened nothing and
       written a knob onto no lesson. */
    expect(useLessonStore.getState().lesson).toBeNull();
    expect(useLessonStore.getState().knobs).toEqual({});
  });
});
