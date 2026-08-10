import type {
  ContentIssue,
  RawBilingual,
  RawCurriculum,
  RawFormation,
  RawFormationSpec,
  RawLesson,
  RawTopic,
} from 'common/api/content.types';
import type {
  Bilingual,
  Curriculum,
  FormationSpec,
  FormationTable,
  FormationToken,
  Lesson,
  LessonId,
  NonEmptyString,
  SceneSpec,
  Topic,
  TopicId,
} from 'common/scene/types';

/* ============================================================
   validate.ts — the only module allowed to turn authored JSON
   into the types the rest of the app is written against.

   Architecture §5.1, six rules. Every failure names the file,
   the path inside it and the rule, because <ErrorState> renders
   exactly that and "content failed to load" costs an hour of
   searching.

   JSON imported through Vite is already parsed, which makes the
   type assertion at the import boundary a lie until it has been
   checked here.
   ============================================================ */

export class ContentError extends Error {
  readonly issues: readonly ContentIssue[];

  constructor(issues: readonly ContentIssue[]) {
    const first = issues[0];
    super(
      first
        ? `${first.file} → ${first.path} → ${first.rule}${
            issues.length > 1 ? ` (and ${issues.length - 1} more)` : ''
          }`
        : 'Content failed validation',
    );
    this.name = 'ContentError';
    this.issues = issues;
  }
}

/* A collector rather than a throw-on-first-error: an author fixing content
   wants the whole list, not one line per run. */
class Issues {
  private readonly found: ContentIssue[] = [];

  constructor(private readonly file: string) {}

  add(path: string, rule: string): void {
    this.found.push({ file: this.file, path, rule });
  }

  get list(): readonly ContentIssue[] {
    return this.found;
  }

  throwIfAny(): void {
    if (this.found.length > 0) throw new ContentError(this.found);
  }
}

/* ---- rule 1: no missing or empty Tamil --------------------- */
/* Whitespace only is empty. A Tamil field holding a space is the same content
   error as one holding nothing, and harder to see. */
const hasText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const asNonEmpty = (value: string): NonEmptyString => value as NonEmptyString;

function bilingual(raw: RawBilingual | undefined, path: string, issues: Issues): Bilingual {
  if (!raw || typeof raw !== 'object') {
    issues.add(path, 'must be a bilingual pair with en and ta');
    return { en: asNonEmpty(''), ta: asNonEmpty('') };
  }
  if (!hasText(raw.en)) issues.add(`${path}.en`, 'English text is missing or empty');
  if (!hasText(raw.ta)) issues.add(`${path}.ta`, 'Tamil text is missing or empty');

  return { en: asNonEmpty(raw.en ?? ''), ta: asNonEmpty(raw.ta ?? '') };
}

/* ---- the five scene kinds ---------------------------------- */
const SCENE_KINDS = ['place', 'path', 'timeline', 'actor', 'relation'] as const;

const isSceneKind = (value: unknown): value is SceneSpec['kind'] =>
  typeof value === 'string' && (SCENE_KINDS as readonly string[]).includes(value);

/* Which fields of a scene name a prop. Rule 2 checks each of them against the
   lexicon; a scene that draws a prop nobody drew is a blank picture. */
const PROP_FIELDS: Readonly<Record<SceneSpec['kind'], readonly string[]>> = {
  place: ['figure', 'ground', 'ground2'],
  path: ['mover'],
  timeline: [],
  actor: ['actor', 'patient'],
  relation: ['left', 'right'],
};

const VERB_FIELDS: Readonly<Record<SceneSpec['kind'], readonly string[]>> = {
  place: [],
  path: [],
  timeline: [],
  actor: ['verb'],
  relation: [],
};

/** What validation needs to know about a verb, and no more. The words are
 *  checked by `validateVerbs`; these two facts are checked against the scenes
 *  that use them. */
export type VerbRule = {
  readonly id: string;
  readonly drawable: boolean;
  readonly transitive: boolean;
};

export type Lexicon = {
  readonly propIds: ReadonlySet<string>;
  readonly verbIds: ReadonlySet<string>;
  readonly verbs: readonly VerbRule[];
};

function scene(
  raw: RawLesson['scene'] | undefined,
  path: string,
  lexicon: Lexicon,
  issues: Issues,
): SceneSpec {
  if (!raw || typeof raw !== 'object' || !isSceneKind(raw.kind)) {
    issues.add(`${path}.kind`, `scene kind must be one of ${SCENE_KINDS.join(', ')}`);
    return { kind: 'place' } as unknown as SceneSpec;
  }

  /* ---- rule 2: every PropId and VerbId is in the lexicon ---- */
  for (const field of PROP_FIELDS[raw.kind]) {
    const value = raw[field];
    if (value === null || value === undefined) continue;
    if (typeof value !== 'string' || !lexicon.propIds.has(value)) {
      issues.add(`${path}.${field}`, `"${String(value)}" is not a prop in the lexicon`);
    }
  }
  for (const field of VERB_FIELDS[raw.kind]) {
    const value = raw[field];
    if (value === null || value === undefined) continue;
    if (typeof value !== 'string' || !lexicon.verbIds.has(value)) {
      issues.add(`${path}.${field}`, `"${String(value)}" is not a verb in the lexicon`);
      continue;
    }
    verbAgainstScene(value, raw, path, lexicon, issues);
  }

  return raw as unknown as SceneSpec;
}

/**
 * Rule 2, continued: a verb the scene can actually be drawn with.
 *
 * Both of these are content errors rather than drawing problems, so they are
 * caught here where the author is named a file and a path — the renderer's own
 * refusal is a blank stage at run time, which is a worse way to find out.
 */
function verbAgainstScene(
  verbId: string,
  raw: RawLesson['scene'],
  path: string,
  lexicon: Lexicon,
  issues: Issues,
): void {
  const verb = lexicon.verbs.find((entry) => entry.id === verbId);
  if (!verb) return;

  if (!verb.drawable) {
    issues.add(`${path}.verb`, `"${verbId}" has no drawable action, so no scene can be built on it`);
  }
  if (!verb.transitive && raw.patient !== null && raw.patient !== undefined) {
    issues.add(`${path}.patient`, `"${verbId}" takes no patient`);
  }
}

/* ---- topics ------------------------------------------------ */
export function validateTopics(rawTopics: readonly RawTopic[], file = 'topics.json'): readonly Topic[] {
  const issues = new Issues(file);
  const seen = new Set<string>();

  const topics = rawTopics.map((raw, index) => {
    const path = `topics[${index}]`;
    if (!hasText(raw.id)) issues.add(`${path}.id`, 'id is missing or empty');
    /* ---- rule 6, for topics: no duplicate ids ---- */
    if (seen.has(raw.id)) issues.add(`${path}.id`, `duplicate topic id "${raw.id}"`);
    seen.add(raw.id);

    return {
      id: raw.id as TopicId,
      order: raw.order,
      title: bilingual(raw.title, `${path}.title`, issues),
      summary: bilingual(raw.summary, `${path}.summary`, issues),
      lessonIds: (raw.lessonIds ?? []).map((id) => id as LessonId),
    };
  });

  issues.throwIfAny();
  return topics;
}

/* ---- lessons ----------------------------------------------- */
export function validateLessons(
  rawLessons: readonly RawLesson[],
  context: { readonly topics: readonly Topic[]; readonly lexicon: Lexicon; readonly file: string },
): readonly Lesson[] {
  const issues = new Issues(context.file);
  const topicIds = new Set(context.topics.map((t) => String(t.id)));
  const seen = new Set<string>();

  const lessons = rawLessons.map((raw, index) => {
    const path = `lessons[${index}]`;

    if (!hasText(raw.id)) issues.add(`${path}.id`, 'id is missing or empty');

    /* ---- rule 6: no duplicate lesson ids ---- */
    if (seen.has(raw.id)) issues.add(`${path}.id`, `duplicate lesson id "${raw.id}"`);
    seen.add(raw.id);

    /* ---- rule 5: the lesson's topic exists ---- */
    if (!topicIds.has(raw.topicId)) {
      issues.add(`${path}.topicId`, `"${raw.topicId}" is not a topic in topics.json`);
    }

    const knobs = (raw.knobs ?? []).map((knob, k) => ({
      key: knob.key,
      label: bilingual(knob.label, `${path}.knobs[${k}].label`, issues),
      options: (knob.options ?? []).map((option, o) => ({
        value: option.value,
        label: bilingual(option.label, `${path}.knobs[${k}].options[${o}].label`, issues),
      })),
    }));

    /* ---- rule 3: a knob option the scene cannot accept ---- */
    for (const knob of knobs) {
      if (knob.options.length === 0) {
        issues.add(`${path}.knobs.${knob.key}`, 'a knob with no options cannot be moved');
      }
      const values = new Set<string>();
      for (const option of knob.options) {
        if (values.has(option.value)) {
          issues.add(
            `${path}.knobs.${knob.key}`,
            `duplicate option value "${option.value}" — one of them can never be chosen`,
          );
        }
        values.add(option.value);
      }
      if (!acceptsKnob(raw.scene, knob.key, values)) {
        issues.add(
          `${path}.knobs.${knob.key}`,
          `the ${String(raw.scene?.kind)} scene cannot accept "${knob.key}"`,
        );
      }
    }

    /* ---- rule 4: predict.answer is one of its own options ---- */
    let predict: Lesson['predict'] = null;
    if (raw.predict) {
      const options = (raw.predict.options ?? []).map((option, o) => ({
        value: option.value,
        label: bilingual(option.label, `${path}.predict.options[${o}].label`, issues),
      }));
      if (!options.some((option) => option.value === raw.predict?.answer)) {
        issues.add(
          `${path}.predict.answer`,
          `"${String(raw.predict.answer)}" is not one of the options offered`,
        );
      }
      /* The knob the question is about, when it is about one. The predict step
         draws what the learner said before drawing what is true, so a question
         with a consequence in the picture has to say which knob a wrong answer
         moves — and its options have to be values that knob accepts, or the
         wrong answer cannot be drawn at all. */
      const about = raw.predict.knob;
      if (about !== null && about !== undefined) {
        const knob = knobs.find((candidate) => candidate.key === about);
        if (!knob) {
          issues.add(`${path}.predict.knob`, `"${String(about)}" is not a knob of this lesson`);
        } else {
          const offered = new Set(knob.options.map((option) => option.value));
          for (const option of options) {
            if (!offered.has(option.value)) {
              issues.add(
                `${path}.predict.options`,
                `"${option.value}" is not a value the "${String(about)}" knob accepts`,
              );
            }
          }
        }
      }

      predict = {
        question: bilingual(raw.predict.question, `${path}.predict.question`, issues),
        options,
        answer: raw.predict.answer,
        explain: bilingual(raw.predict.explain, `${path}.predict.explain`, issues),
        knob: typeof about === 'string' ? about : null,
      };
    }

    return {
      id: raw.id as LessonId,
      topicId: raw.topicId as TopicId,
      order: raw.order,
      title: bilingual(raw.title, `${path}.title`, issues),
      idea: bilingual(raw.idea, `${path}.idea`, issues),
      scene: scene(raw.scene, `${path}.scene`, context.lexicon, issues),
      knobs,
      predict,
      why: bilingual(raw.why, `${path}.why`, issues),
      sentence: {
        en: raw.sentence?.en ?? [],
        ta: raw.sentence?.ta ?? [],
      },
    } as Lesson;
  });

  if (lessons.length === 0) {
    issues.add('lessons', 'a lesson file with no lessons in it is a mistake, not an empty topic');
  }

  issues.throwIfAny();
  return lessons;
}

/* Which knobs each scene kind can be moved by. A knob the renderer will never
   read is a control that does nothing when pressed — the one thing a picture
   that teaches must not do. */
const KNOBS_BY_KIND: Readonly<Record<SceneSpec['kind'], readonly string[]>> = {
  place: ['relation', 'figure', 'ground', 'ground2', 'determiner', 'count', 'adjective'],
  path: ['relation', 'mover', 'landmark', 'arrives', 'arrow'],
  timeline: ['tense', 'relation'],
  actor: ['actor', 'verb', 'patient', 'voice', 'mood', 'negated', 'cue'],
  relation: ['connective', 'left', 'right', 'glyph'],
};

function acceptsKnob(
  raw: RawLesson['scene'] | undefined,
  key: string,
  _values: ReadonlySet<string>,
): boolean {
  if (!raw || !isSceneKind(raw.kind)) return false;
  return KNOBS_BY_KIND[raw.kind].includes(key);
}

/* ---- the source notes -------------------------------------
   `curriculum.json` is generated from the notes rather than
   typed, so the rules here are about the shape of the thing that
   came out of the generator — a table with more cells in a row
   than it has columns is a table that lost a heading somewhere.
   ------------------------------------------------------------ */

/**
 * The authoring shorthand: `The:det | ball:figure | is:be | in:rel`.
 *
 * A word, a colon, its job. No colon means the word has no counterpart on the
 * other side, which is itself worth drawing — Tamil has no article. Two roles
 * is a fusion: one Tamil word doing the work of two English ones.
 */
export function parseAlignment(line: string): readonly FormationToken[] {
  return line
    .split('|')
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
    .map((chunk) => {
      const [text = '', ...roles] = chunk.split(':').map((part) => part.trim());
      return { text, roles: roles.filter((role) => role.length > 0) };
    });
}

/** The eight jobs, before any repeat digit. */
const ROLES: ReadonlySet<string> = new Set([
  'det', 'figure', 'rel', 'ground', 'be', 'qual', 'ask', 'join',
]);

export const baseRole = (role: string): string => role.replace(/\d+$/, '');

export function validateFormation(
  raw: RawFormation,
  file = 'formation.json',
): FormationTable {
  const issues = new Issues(file);

  const entry = (key: string, spec: RawFormationSpec, path: string): FormationSpec => {
    for (const field of ['en', 'ta', 'enAlign', 'taAlign'] as const) {
      if (!hasText(spec[field])) issues.add(`${path}.${field}`, `"${key}" is missing its ${field}`);
    }

    const enTokens = parseAlignment(spec.enAlign ?? '');
    const taTokens = parseAlignment(spec.taAlign ?? '');

    for (const [side, tokens] of [['enAlign', enTokens], ['taAlign', taTokens]] as const) {
      for (const token of tokens) {
        for (const role of token.roles) {
          if (!ROLES.has(baseRole(role))) {
            issues.add(`${path}.${side}`, `"${role}" is not one of the eight jobs a word can have`);
          }
        }
      }
    }

    /* Every role on one side has to land on the other, or the diagram draws a
       line to nothing. A word with no role at all is fine — that is the
       article Tamil does not have — but a role that is only ever named once
       is an alignment with a typo in it. */
    const rolesOf = (tokens: readonly FormationToken[]): ReadonlySet<string> =>
      new Set(tokens.flatMap((token) => token.roles));
    const english = rolesOf(enTokens);
    const tamil = rolesOf(taTokens);
    for (const role of english) {
      if (!tamil.has(role)) issues.add(`${path}.enAlign`, `"${role}" has nothing to join in Tamil`);
    }
    for (const role of tamil) {
      if (!english.has(role)) {
        issues.add(`${path}.taAlign`, `"${role}" has nothing to join in English`);
      }
    }

    return { en: spec.en ?? '', ta: spec.ta ?? '', enTokens, taTokens };
  };

  const rows: Record<string, FormationSpec> = {};
  for (const [key, spec] of Object.entries(raw.rows ?? {})) {
    if (!/^[a-z-]+#\d+$/.test(key)) {
      issues.add(`rows.${key}`, 'a key is a table id and a row number');
    }
    rows[key] = entry(key, spec, `rows.${key}`);
  }

  const words: Record<string, FormationSpec> = {};
  for (const [key, spec] of Object.entries(raw.words ?? {})) {
    words[key] = entry(key, spec, `words.${key}`);
  }

  issues.throwIfAny();
  return { rows, words };
}

export function validateCurriculum(
  raw: RawCurriculum,
  file = 'curriculum.json',
): Curriculum {
  const issues = new Issues(file);
  const seen = new Set<string>();

  const tables = (raw.tables ?? []).map((table, index) => {
    const path = `tables[${index}]`;
    if (!hasText(table.id)) issues.add(`${path}.id`, 'id is missing or empty');
    if (seen.has(table.id)) issues.add(`${path}.id`, `duplicate table id "${table.id}"`);
    seen.add(table.id);

    const columns = table.cols ?? [];
    if (columns.length === 0) issues.add(`${path}.cols`, 'a table with no columns has no shape');

    /* Short rows are the source's own: the common-prepositions table leaves
       the last cell off a row that has nothing to say in it. A row with *more*
       cells than columns is a table that lost a heading, and there is no
       honest way to render it. */
    (table.rows ?? []).forEach((row, r) => {
      if (row.length > columns.length) {
        issues.add(
          `${path}.rows[${r}]`,
          `${row.length} cells in a table with ${columns.length} columns`,
        );
      }
    });

    return {
      id: table.id,
      topicId: table.topic as TopicId,
      title: bilingual({ en: table.en, ta: table.ta }, `${path}.title`, issues),
      columns,
      rows: (table.rows ?? []).map((row) => [...row]),
    };
  });

  const outlines = (raw.topics ?? []).map((topic, index) => {
    const path = `topics[${index}]`;
    if (!hasText(topic.id)) issues.add(`${path}.id`, 'id is missing or empty');

    return {
      topicId: topic.id as TopicId,
      groups: (topic.groups ?? []).map((group, g) => ({
        title: bilingual({ en: group.en, ta: group.ta }, `${path}.groups[${g}]`, issues),
        lessons: (group.lessons ?? []).map((lesson, l) => {
          if (!hasText(lesson.en)) {
            issues.add(`${path}.groups[${g}].lessons[${l}].en`, 'a line with no English');
          }
          return {
            title: asNonEmpty(lesson.en ?? ''),
            /* Glossed where the notes glossed it. Thirty-two rows are English
               example sentences the notes never translated, and a blank there
               is the source's, not a hole to fill. */
            titleTa: hasText(lesson.ta) ? asNonEmpty(lesson.ta) : null,
            /* An absent example is a fact about the notes too. */
            example:
              hasText(lesson.ex) && hasText(lesson.exTa)
                ? { en: asNonEmpty(lesson.ex), ta: asNonEmpty(lesson.exTa) }
                : null,
          };
        }),
      })),
    };
  });

  const corrections = (raw.corrections ?? []).map((correction, index) => {
    const path = `corrections[${index}]`;
    for (const field of ['where', 'was', 'now'] as const) {
      if (!hasText(correction[field])) issues.add(`${path}.${field}`, `${field} is missing`);
    }
    return { where: correction.where, was: correction.was, now: correction.now };
  });

  issues.throwIfAny();
  return { outlines, tables, corrections, formation: { rows: {}, words: {} } };
}

/** Every prop must decline. A missing case is a sentence that cannot be built
 *  the moment a knob asks for it. */
export const TAMIL_CASES = ['nominative', 'accusative', 'dative', 'locative', 'ablative'] as const;

export function validateProps(
  rawProps: readonly unknown[],
  file = 'lexicon/props.json',
): ReadonlySet<string> {
  const issues = new Issues(file);
  const ids = new Set<string>();

  rawProps.forEach((entry, index) => {
    const path = `props[${index}]`;
    const prop = entry as { id?: unknown; word?: { en?: unknown; ta?: Record<string, unknown> } };

    if (!hasText(prop.id)) {
      issues.add(`${path}.id`, 'id is missing or empty');
      return;
    }
    if (ids.has(prop.id)) issues.add(`${path}.id`, `duplicate prop id "${prop.id}"`);
    ids.add(prop.id);

    const ta = prop.word?.ta;
    for (const grammaticalCase of TAMIL_CASES) {
      if (!ta || !hasText(ta[grammaticalCase])) {
        issues.add(`${path}.word.ta.${grammaticalCase}`, `"${prop.id}" is missing its ${grammaticalCase}`);
      }
    }
  });

  issues.throwIfAny();
  return ids;
}

/** The four places a patient can go, and the four cues that put it there.
 *  Which prop carries which anchor is the scene library's business; that a
 *  verb names one that exists at all is this one's. */
const ANCHORS = ['mouth', 'hand', 'foot', 'eye'] as const;
const CUES = ['chomp', 'gaze', 'arc', 'impact'] as const;

export function validateVerbs(
  rawVerbs: readonly unknown[],
  file = 'lexicon/verbs.json',
): ReadonlySet<string> {
  const issues = new Issues(file);
  const ids = new Set<string>();

  rawVerbs.forEach((entry, index) => {
    const path = `verbs[${index}]`;
    const verb = entry as {
      id?: unknown;
      ta?: unknown;
      drawable?: unknown;
      anchor?: unknown;
      cue?: unknown;
    };

    if (!hasText(verb.id)) {
      issues.add(`${path}.id`, 'id is missing or empty');
      return;
    }
    if (ids.has(verb.id)) issues.add(`${path}.id`, `duplicate verb id "${verb.id}"`);
    ids.add(verb.id);

    if (!hasText(verb.ta)) issues.add(`${path}.ta`, `"${verb.id}" is missing its Tamil`);

    /* A drawable verb has to say where the patient goes and what the action
       looks like; an undrawable one has neither, because there is no drawing
       for them to be facts about. Either half-filled entry is a verb that
       typechecks and cannot be rendered. */
    if (verb.drawable === true) {
      if (!(ANCHORS as readonly unknown[]).includes(verb.anchor)) {
        issues.add(`${path}.anchor`, `"${verb.id}" is drawable and must name one of ${ANCHORS.join(', ')}`);
      }
      if (!(CUES as readonly unknown[]).includes(verb.cue)) {
        issues.add(`${path}.cue`, `"${verb.id}" is drawable and must name one of ${CUES.join(', ')}`);
      }
    } else if (verb.drawable === false) {
      if (verb.anchor !== null || verb.cue !== null) {
        issues.add(`${path}.drawable`, `"${verb.id}" cannot be drawn, so it has no anchor and no cue`);
      }
    } else {
      issues.add(`${path}.drawable`, `"${verb.id}" must say whether it can be drawn`);
    }
  });

  issues.throwIfAny();
  return ids;
}

