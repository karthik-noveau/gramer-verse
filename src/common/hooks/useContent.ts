import { useEffect } from 'react';

import type { LexiconData } from 'common/api/props.api';
import type { Curriculum, Lesson, Topic } from 'common/scene/types';
import { useContentStore } from 'store/content.store';

/* ============================================================
   useContent — load on mount, and hand back a shape that cannot
   be read wrongly.

   The four states are a discriminated union rather than four
   optional fields, so `topics` does not exist until the status
   is 'ready'. A page cannot forget the loading case, because
   there is nothing to read until it is past it.
   ============================================================ */

export type ContentResult =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly error: Error }
  | {
      readonly status: 'ready';
      readonly topics: readonly Topic[];
      readonly lessons: readonly Lesson[];
      readonly lexicon: LexiconData;
      readonly curriculum: Curriculum;
      /** Ready and carrying nothing is a real answer, and the pages that can
       *  meet it render an empty state rather than a spinner forever. */
      readonly isEmpty: boolean;
    };

export function useContent(): ContentResult {
  const status = useContentStore((s) => s.status);
  const topics = useContentStore((s) => s.topics);
  const lessons = useContentStore((s) => s.lessons);
  const lexicon = useContentStore((s) => s.lexicon);
  const curriculum = useContentStore((s) => s.curriculum);
  const error = useContentStore((s) => s.error);
  const load = useContentStore((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  if (status === 'error') {
    return { status: 'error', error: error ?? new Error('Content failed to load') };
  }

  /* `idle` is reported as loading: the effect that starts the load has not run
     yet, and a page told "idle" would have a fifth state to handle that means
     exactly the same thing to the reader. */
  if (status !== 'ready' || !lexicon || !curriculum) {
    return { status: 'loading' };
  }

  return {
    status: 'ready',
    topics,
    lessons,
    lexicon,
    curriculum,
    isEmpty: topics.length === 0,
  };
}
