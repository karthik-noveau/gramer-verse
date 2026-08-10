import { act, renderHook } from '@testing-library/react';

import { useLessonScene } from 'pages/lesson/hooks/useLessonScene';
import type { Lesson, LessonId, NonEmptyString, PlaceSpec, PropId, TopicId } from 'common/scene/types';
import { useLessonStore } from 'store/lesson.store';

/* ============================================================
   useLessonScene.test.tsx

   The hook opens a lesson, closes it on the way out, and hands
   back a scene worked out from the knobs. What is checked here
   is that it does all three at the right moment: a page that
   drew the previous lesson's scene under this lesson's title
   would pass every store test in the file next door.
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
      key: 'count',
      label: bi('How many', 'எத்தனை'),
      options: [
        { value: '1', label: bi('one', 'ஒன்று') },
        { value: '2', label: bi('two', 'இரண்டு') },
      ],
    },
  ],
  predict: null,
  why: bi('The box has sides.', 'பெட்டிக்குப் பக்கங்கள் உள்ளன.'),
  sentence: { en: [{ slot: 'figure' }], ta: [{ slot: 'figure', case: 'nominative' }] },
};

const OTHER: Lesson = {
  ...LESSON,
  id: 'prep-place-on' as LessonId,
  scene: { ...SCENE, figure: id('book'), ground: id('table'), relation: 'on' },
};

beforeEach(() => {
  useLessonStore.getState().reset();
});

describe('useLessonScene', () => {
  it('is closed until it is given a lesson', () => {
    const { result } = renderHook(() => useLessonScene(undefined));

    expect(result.current.status).toBe('closed');
  });

  it('opens the lesson and derives its scene', () => {
    const { result } = renderHook(() => useLessonScene(LESSON));

    expect(result.current.status).toBe('open');
    if (result.current.status !== 'open') return;
    expect(result.current.scene).toEqual(SCENE);
    expect(result.current.problem).toBeNull();
    expect(result.current.knobs).toEqual({ count: '1' });
  });

  it('turns a knob and redraws from it', () => {
    const { result } = renderHook(() => useLessonScene(LESSON));

    act(() => {
      if (result.current.status === 'open') result.current.setKnob('count', '2');
    });

    if (result.current.status !== 'open') throw new Error('the lesson closed itself');
    expect(result.current.scene).toMatchObject({ count: 2 });
    expect(result.current.lastKnob).toBe('count');
  });

  it('hands back the same scene object until something changes it', () => {
    /* Stage is memoised on this object's identity. A new one per render is a
       picture rebuilt for a knob nobody turned. */
    const { result, rerender } = renderHook(() => useLessonScene(LESSON));
    const first = result.current.status === 'open' ? result.current.scene : null;

    rerender();

    expect(result.current.status === 'open' ? result.current.scene : null).toBe(first);
  });

  it('swaps to the next lesson without carrying the last one’s knobs', () => {
    const { result, rerender } = renderHook(({ lesson }) => useLessonScene(lesson), {
      initialProps: { lesson: LESSON },
    });

    act(() => {
      if (result.current.status === 'open') result.current.setKnob('count', '2');
    });
    rerender({ lesson: OTHER });

    if (result.current.status !== 'open') throw new Error('the lesson closed itself');
    expect(result.current.lesson.id).toBe(OTHER.id);
    expect(result.current.knobs).toEqual({ count: '1' });
    expect(result.current.scene).toMatchObject({ figure: id('book'), relation: 'on' });
  });

  it('closes the lesson when the page goes away', () => {
    const { unmount } = renderHook(() => useLessonScene(LESSON));

    unmount();

    expect(useLessonStore.getState().lesson).toBeNull();
  });

  it('says why a scene will not draw rather than reporting it as fine', () => {
    /* A knob cannot get a lesson into this state — the store refuses those —
       but a lesson can be authored into one. */
    const impossible: Lesson = { ...LESSON, scene: { ...SCENE, ground: id('tree') } };
    const { result } = renderHook(() => useLessonScene(impossible));

    if (result.current.status !== 'open') throw new Error('the lesson closed itself');
    expect(result.current.problem).toMatch(/inside/);
  });
});
