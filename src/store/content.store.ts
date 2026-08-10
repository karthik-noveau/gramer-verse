import { create } from 'zustand';

import { loadContent } from 'common/api/content.api';
import type { LexiconData } from 'common/api/props.api';
import type { Curriculum, Lesson, LessonId, Topic, TopicId } from 'common/scene/types';

/* ============================================================
   content.store.ts — the curriculum, loaded once.

   Content ships inside the bundle, so there is no refetch path
   and nothing goes stale. Load once, keep it, and select from
   it: everything derived is computed by a selector, because a
   stored copy of "the next lesson" is one content change away
   from pointing at the wrong one.
   ============================================================ */

export type ContentStatus = 'idle' | 'loading' | 'ready' | 'error';

export type ContentState = {
  /** Explicit, never inferred from a non-empty array: an empty topic list is a
   *  real answer, and "ready with nothing" must be distinguishable from "not
   *  loaded yet". */
  readonly status: ContentStatus;
  readonly topics: readonly Topic[];
  readonly lessons: readonly Lesson[];
  readonly lexicon: LexiconData | null;
  /** The source notes, whole: outlines, tables and corrections. */
  readonly curriculum: Curriculum | null;
  /** The error object, not a message: <ErrorState> renders the file and the
   *  rule out of it, and a string would have thrown that away. */
  readonly error: Error | null;
  readonly load: () => Promise<void>;
  readonly reset: () => void;
};

/* The in-flight promise lives outside the store, not in it: it is machinery,
   not state, and putting a promise in a store makes every subscriber
   re-render when it settles. */
let inFlight: Promise<void> | null = null;

export const useContentStore = create<ContentState>((set, get) => ({
  status: 'idle',
  topics: [],
  lessons: [],
  lexicon: null,
  curriculum: null,
  error: null,

  load: () => {
    if (get().status === 'ready') return Promise.resolve();
    if (inFlight) return inFlight;

    set({ status: 'loading', error: null });

    inFlight = loadContent()
      .then(({ topics, lessons, lexicon, curriculum }) => {
        set({ status: 'ready', topics, lessons, lexicon, curriculum, error: null });
      })
      .catch((cause: unknown) => {
        set({
          status: 'error',
          error: cause instanceof Error ? cause : new Error(String(cause)),
          topics: [],
          lessons: [],
          lexicon: null,
          curriculum: null,
        });
      })
      .finally(() => {
        inFlight = null;
      });

    return inFlight;
  },

  reset: () => {
    inFlight = null;
    set({ status: 'idle', topics: [], lessons: [], lexicon: null, curriculum: null, error: null });
  },
}));

/* ---- selectors ---------------------------------------------
   Pure functions over state. An unknown id is `undefined`, not
   a throw: a bad URL is a page state, and the topic and lesson
   pages render an empty state for it rather than a 404.
   ------------------------------------------------------------ */

export const getTopic = (state: ContentState, id: string | TopicId | undefined): Topic | undefined =>
  id === undefined ? undefined : state.topics.find((topic) => String(topic.id) === String(id));

export const getLesson = (
  state: ContentState,
  id: string | LessonId | undefined,
): Lesson | undefined =>
  id === undefined ? undefined : state.lessons.find((lesson) => String(lesson.id) === String(id));

/** A topic's lessons in the order the topic lists them. The topic's own
 *  `lessonIds` is the authority, not the lessons' `order` field: the order a
 *  topic teaches in is a property of the topic. */
export const getLessonsForTopic = (
  state: ContentState,
  topicId: string | TopicId | undefined,
): readonly Lesson[] => {
  const topic = getTopic(state, topicId);
  if (!topic) return [];

  return topic.lessonIds
    .map((id) => getLesson(state, id))
    .filter((lesson): lesson is Lesson => lesson !== undefined);
};

/**
 * The lesson after this one: the next in its topic, or the first of the next
 * topic that has any.
 *
 * `undefined` at the very end. There is nothing after the last lesson, and
 * the lesson page says so rather than looping the learner back to the start —
 * constraint 5 says nothing is tracked, so "start again" would be a lie about
 * having finished.
 */
export const getNextLesson = (
  state: ContentState,
  id: string | LessonId | undefined,
): Lesson | undefined => {
  const lesson = getLesson(state, id);
  if (!lesson) return undefined;

  const siblings = getLessonsForTopic(state, lesson.topicId);
  const index = siblings.findIndex((sibling) => String(sibling.id) === String(lesson.id));
  const next = siblings[index + 1];
  if (next) return next;

  /* End of the topic: roll into the next one that has lessons. Topics are
     ordered by `order`, not by their position in the array — the array is
     whatever the file happened to list. */
  const ordered = [...state.topics].sort((a, b) => a.order - b.order);
  const here = ordered.findIndex((topic) => String(topic.id) === String(lesson.topicId));
  if (here === -1) return undefined;

  for (const topic of ordered.slice(here + 1)) {
    const first = getLessonsForTopic(state, topic.id)[0];
    if (first) return first;
  }
  return undefined;
};

/** The lesson before this one, by the same rule read backwards. */
export const getPreviousLesson = (
  state: ContentState,
  id: string | LessonId | undefined,
): Lesson | undefined => {
  const lesson = getLesson(state, id);
  if (!lesson) return undefined;

  const siblings = getLessonsForTopic(state, lesson.topicId);
  const index = siblings.findIndex((sibling) => String(sibling.id) === String(lesson.id));
  const previous = siblings[index - 1];
  if (previous) return previous;

  const ordered = [...state.topics].sort((a, b) => a.order - b.order);
  const here = ordered.findIndex((topic) => String(topic.id) === String(lesson.topicId));
  if (here === -1) return undefined;

  for (const topic of ordered.slice(0, here).reverse()) {
    const lessons = getLessonsForTopic(state, topic.id);
    const last = lessons[lessons.length - 1];
    if (last) return last;
  }
  return undefined;
};
