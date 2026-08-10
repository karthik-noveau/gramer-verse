import type { RawCurriculum, RawFormation, RawLesson, RawTopic } from 'common/api/content.types';
import { loadLexicon } from 'common/api/props.api';
import type { LexiconData } from 'common/api/props.api';
import {
  validateCurriculum,
  validateFormation,
  validateLessons,
  validateTopics,
} from 'common/api/validate';
import type {
  Curriculum,
  FormationSpec,
  Lesson,
  LessonId,
  SourceTable,
  Topic,
  TopicId,
  TopicOutline,
} from 'common/scene/types';

/* ============================================================
   content.api.ts — the only module that reads the curriculum.

   Nothing else may import from src/content/. Everything here
   validates before it returns and throws a named ContentError
   on failure: partial content is worse than none, because a
   half-built lesson looks finished.

   No caching lives here — engine 08 owns that. These functions
   are honest about doing the work every time they are called.
   ============================================================ */

/** The lesson files, each named as it sits on disk — a validation error has to
 *  name the file the author has to open, not the topic it happens to belong
 *  to. A topic with no file here has no authored lessons yet; its page renders
 *  an empty state, which is not an error. */
const LESSON_FILES: readonly {
  readonly file: string;
  readonly load: () => Promise<{ default: unknown }>;
}[] = [
  {
    file: 'lessons/prepositions-place.json',
    load: () => import('content/lessons/prepositions-place.json'),
  },
];

export async function loadTopics(): Promise<readonly Topic[]> {
  const module = await import('content/topics.json');
  return validateTopics(module.default as readonly RawTopic[]);
}

/**
 * Every authored lesson, validated against the topics that exist and the
 * lexicon that can draw them. A lesson naming a prop nobody drew, or a topic
 * nobody wrote, fails here rather than rendering an empty picture.
 */
export async function loadLessons(): Promise<readonly Lesson[]> {
  const [topics, lexicon] = await Promise.all([loadTopics(), loadLexicon()]);
  return loadLessonsWith(topics, lexicon);
}

export async function loadLessonsWith(
  topics: readonly Topic[],
  lexicon: LexiconData,
): Promise<readonly Lesson[]> {
  const files = await Promise.all(
    LESSON_FILES.map(async ({ file, load }) => ({
      file,
      raw: (await load()).default as readonly RawLesson[],
    })),
  );

  const lessons = files.flatMap(({ file, raw }) =>
    validateLessons(raw, { topics, lexicon, file }),
  );

  /* Duplicate ids are checked per file by validateLessons; two files claiming
     the same lesson would slip past that, and the second would silently win. */
  const seen = new Set<string>();
  for (const lesson of lessons) {
    if (seen.has(String(lesson.id))) {
      throw new Error(`Duplicate lesson id "${String(lesson.id)}" across lesson files`);
    }
    seen.add(String(lesson.id));
  }

  return lessons;
}

/**
 * The source notes: every topic's outline, every table, and every correction.
 *
 * Generated from the notes rather than authored, and read whole — a topic page
 * shows its table above its lessons because reading a topic at once is faster
 * than stepping through it one word at a time.
 */
export async function loadCurriculum(): Promise<Curriculum> {
  const [curriculum, formation] = await Promise.all([
    import('content/curriculum.json'),
    import('content/formation.json'),
  ]);

  return {
    ...validateCurriculum(curriculum.default as RawCurriculum),
    formation: validateFormation(formation.default as RawFormation),
  };
}

/** Everything, so a caller cannot end up with one part validated against a
 *  different version of another. */
export async function loadContent(): Promise<{
  readonly topics: readonly Topic[];
  readonly lessons: readonly Lesson[];
  readonly lexicon: LexiconData;
  readonly curriculum: Curriculum;
}> {
  const [topics, lexicon, curriculum] = await Promise.all([
    loadTopics(),
    loadLexicon(),
    loadCurriculum(),
  ]);
  const lessons = await loadLessonsWith(topics, lexicon);
  return { topics, lessons, lexicon, curriculum };
}

export const tablesOfTopic = (
  curriculum: Curriculum,
  topicId: TopicId | string,
): readonly SourceTable[] =>
  curriculum.tables.filter((table) => String(table.topicId) === String(topicId));

/**
 * The alignment for one row of one table, if there is one.
 *
 * `rowIndex` counts only the rows that are rows. The source divides a long
 * table with group headings — "PRESENT TENSE" — and a heading is not a
 * sentence, so the alignments were keyed without them. Handing this the raw
 * array index instead drew a different row's sentence under every row of the
 * two tables that have headings.
 *
 * By table and row first, then by any word in the row that has one: the
 * pronouns table is ragged — some rows drop the leading cell — so the pronoun
 * is found by looking rather than by counting columns.
 */
export const formationFor = (
  curriculum: Curriculum,
  tableId: string,
  rowIndex: number,
  cells: readonly string[] = [],
): FormationSpec | undefined => {
  const direct = curriculum.formation.rows[`${tableId}#${rowIndex}`];
  if (direct) return direct;

  for (const cell of cells) {
    const first = (cell.split('\n')[0] ?? '').trim().toLowerCase();
    const found = curriculum.formation.words[first];
    if (found) return found;
  }
  return undefined;
};

export const outlineOfTopic = (
  curriculum: Curriculum,
  topicId: TopicId | string,
): TopicOutline | undefined =>
  curriculum.outlines.find((outline) => String(outline.topicId) === String(topicId));

/**
 * A topic's description, led by the question the topic answers.
 *
 * The summaries are answers with no subject — "When it happens." — which reads
 * as a fragment sitting under a heading, and on the topics page it sits under
 * ten of them. Naming the topic inside its own description gives each one a
 * subject, so a card says what it is rather than only what it is about.
 *
 * Written once, here, because the topic page and the topic card both show it
 * and two copies of a sentence is one copy that will be reworded.
 *
 * The question is this app's words, not the notes'. The source glosses the
 * topic names and gives these one-line summaries; it never asks a question, so
 * `என்றால் என்ன` is authored here the way every other line of this app's Tamil
 * is — which is allowed, and is not the same as inventing a gloss for a row of
 * somebody else's table.
 */
export const describeTopic = (topic: Topic): { readonly en: string; readonly ta: string } => {
  const title = String(topic.title.en);

  /* "What is Tenses?" is the mistake this app exists to correct, and nine of
     the ten titles are plural — Tenses, Verbs, Articles, Adverbs. The verb has
     to agree with the name.

     By the final `s`, which decides all ten correctly: only "Sentence
     formation" is singular. A future singular title ending in `s` would need
     this to be a fact about the topic rather than a guess about its spelling,
     and the test over all ten is what would catch it. */
  const plural = /s$/i.test(title);

  return {
    en: `What ${plural ? 'are' : 'is'} ${title}? ${String(topic.summary.en)}`,
    /* Tamil asks it the same way either way: `என்றால் என்ன` takes no number. */
    ta: `${String(topic.title.ta)} என்றால் என்ன? ${String(topic.summary.ta)}`,
  };
};

export const findTopic = (topics: readonly Topic[], id: string): Topic | undefined =>
  topics.find((topic) => String(topic.id) === id);

export const findLesson = (lessons: readonly Lesson[], id: string): Lesson | undefined =>
  lessons.find((lesson) => String(lesson.id) === id);

export const lessonsOfTopic = (lessons: readonly Lesson[], topicId: TopicId | string): readonly Lesson[] =>
  lessons
    .filter((lesson) => String(lesson.topicId) === String(topicId))
    .slice()
    .sort((a, b) => a.order - b.order);

export type { LessonId, TopicId };
