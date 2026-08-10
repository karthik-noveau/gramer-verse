import * as contentApi from 'common/api/content.api';
import type { LexiconData } from 'common/api/props.api';
import type { Lesson, LessonId, Topic, TopicId } from 'common/scene/types';
import {
  getLesson,
  getLessonsForTopic,
  getNextLesson,
  getPreviousLesson,
  getTopic,
  useContentStore,
} from 'store/content.store';

/* ---- fixtures ----------------------------------------------
   Three topics: one with two lessons, one with none, one with
   one — so the rollover past an empty topic is a real case
   rather than a hypothetical.
   ------------------------------------------------------------ */
const topic = (id: string, order: number, lessonIds: readonly string[]): Topic =>
  ({
    id: id as TopicId,
    order,
    title: { en: id, ta: id },
    summary: { en: id, ta: id },
    lessonIds: lessonIds as readonly LessonId[],
  }) as Topic;

const lesson = (id: string, topicId: string, order: number): Lesson =>
  ({ id: id as LessonId, topicId: topicId as TopicId, order }) as Lesson;

const TOPICS: readonly Topic[] = [
  /* Deliberately out of order in the array: `order` is the authority. */
  topic('adverbs', 3, ['adv-quickly']),
  topic('prepositions', 1, ['prep-in', 'prep-on']),
  topic('tenses', 2, []),
];

const LESSONS: readonly Lesson[] = [
  lesson('prep-in', 'prepositions', 1),
  lesson('prep-on', 'prepositions', 2),
  lesson('adv-quickly', 'adverbs', 1),
];

const LEXICON = { props: [], verbs: [], propIds: new Set(), verbIds: new Set() } as LexiconData;
const CURRICULUM = { outlines: [], tables: [], corrections: [], formation: { rows: {}, words: {} } };

const ready = (): void => {
  useContentStore.setState({
    status: 'ready',
    topics: TOPICS,
    lessons: LESSONS,
    lexicon: LEXICON,
    curriculum: CURRICULUM,
    error: null,
  });
};

const state = (): ReturnType<typeof useContentStore.getState> => useContentStore.getState();

beforeEach(() => {
  useContentStore.getState().reset();
  jest.restoreAllMocks();
});

describe('content.store', () => {
  describe('loading', () => {
    it('starts idle, with nothing in it', () => {
      expect(state().status).toBe('idle');
      expect(state().topics).toEqual([]);
      expect(state().error).toBeNull();
    });

    it('goes idle → loading → ready', async () => {
      const seen: string[] = [];
      const unsubscribe = useContentStore.subscribe((s) => seen.push(s.status));

      await state().load();
      unsubscribe();

      expect(seen[0]).toBe('loading');
      expect(state().status).toBe('ready');
      expect(state().topics.length).toBeGreaterThan(0);
    });

    it('loads exactly once no matter how many pages mount at the same time', async () => {
      const spy = jest.spyOn(contentApi, 'loadContent');

      await Promise.all([state().load(), state().load(), state().load()]);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(state().status).toBe('ready');
    });

    it('does not load again once it is ready', async () => {
      await state().load();
      const spy = jest.spyOn(contentApi, 'loadContent');

      await state().load();

      expect(spy).not.toHaveBeenCalled();
    });

    it('goes idle → loading → error, keeping the error object intact', async () => {
      const failure = Object.assign(new Error('lessons/x.json → lessons[0].why.ta → missing'), {
        issues: [{ file: 'lessons/x.json', path: 'lessons[0].why.ta', rule: 'missing' }],
      });
      jest.spyOn(contentApi, 'loadContent').mockRejectedValueOnce(failure);

      await state().load();

      expect(state().status).toBe('error');
      expect(state().error).toBe(failure);
      expect(state().topics).toEqual([]);
    });

    it('can be retried after a failure', async () => {
      jest.spyOn(contentApi, 'loadContent').mockRejectedValueOnce(new Error('once'));
      await state().load();
      expect(state().status).toBe('error');

      await state().load();

      expect(state().status).toBe('ready');
    });

    it('wraps a thrown non-error so the store always holds an Error', async () => {
      jest.spyOn(contentApi, 'loadContent').mockRejectedValueOnce('a string, somehow');

      await state().load();

      expect(state().error).toBeInstanceOf(Error);
      expect(state().error?.message).toContain('a string, somehow');
    });
  });

  describe('selectors', () => {
    beforeEach(ready);

    it('finds a topic and a lesson by id', () => {
      expect(getTopic(state(), 'prepositions')?.order).toBe(1);
      expect(getLesson(state(), 'prep-on')?.order).toBe(2);
    });

    it('returns undefined for an id nobody wrote, rather than throwing', () => {
      expect(getTopic(state(), 'punctuation')).toBeUndefined();
      expect(getLesson(state(), 'prep-astride')).toBeUndefined();
      expect(getLessonsForTopic(state(), 'punctuation')).toEqual([]);
      expect(getNextLesson(state(), 'prep-astride')).toBeUndefined();
      expect(getTopic(state(), undefined)).toBeUndefined();
    });

    it('returns a topic’s lessons in the order the topic lists them', () => {
      expect(getLessonsForTopic(state(), 'prepositions').map((l) => String(l.id))).toEqual([
        'prep-in',
        'prep-on',
      ]);
    });

    it('returns nothing for a topic with no lessons yet', () => {
      expect(getLessonsForTopic(state(), 'tenses')).toEqual([]);
    });
  });

  describe('getNextLesson', () => {
    beforeEach(ready);

    it('moves to the next lesson in the same topic', () => {
      expect(String(getNextLesson(state(), 'prep-in')?.id)).toBe('prep-on');
    });

    it('rolls into the next topic that has lessons, skipping the empty one', () => {
      expect(String(getNextLesson(state(), 'prep-on')?.id)).toBe('adv-quickly');
    });

    it('is undefined at the very end, so the page can say so instead of looping', () => {
      expect(getNextLesson(state(), 'adv-quickly')).toBeUndefined();
    });

    it('reads topic order from `order`, not from the array', () => {
      /* `adverbs` is first in the array and third by order; if the array won,
         the rollover above would have gone the wrong way. */
      expect(state().topics[0]?.order).toBe(3);
    });
  });

  describe('getPreviousLesson', () => {
    beforeEach(ready);

    it('moves back within the topic', () => {
      expect(String(getPreviousLesson(state(), 'prep-on')?.id)).toBe('prep-in');
    });

    it('rolls back into the last lesson of the previous topic that has any', () => {
      expect(String(getPreviousLesson(state(), 'adv-quickly')?.id)).toBe('prep-on');
    });

    it('is undefined at the very beginning', () => {
      expect(getPreviousLesson(state(), 'prep-in')).toBeUndefined();
    });
  });

  describe('what is not stored', () => {
    it('holds only loaded content — nothing derived', () => {
      ready();
      const keys = Object.entries(state())
        .filter(([, value]) => typeof value !== 'function')
        .map(([key]) => key)
        .sort();

      expect(keys).toEqual([
        'curriculum',
        'error',
        'lessons',
        'lexicon',
        'status',
        'topics',
      ]);
    });
  });
});
