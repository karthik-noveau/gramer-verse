/* ============================================================
   content.types.ts — the shape of the JSON on disk, before
   anything has checked it.

   `scene/types.ts` describes content that has been validated:
   its ids are branded, its Tamil is known to be non-empty, and
   its scene spec is one of exactly five kinds. Nothing may mint
   those types except `validate.ts` (engine 07).

   These are the same shapes with every guarantee removed, which
   is what `JSON.parse` actually hands you. Keeping the two apart
   is what stops "it typechecks" from being mistaken for "it was
   checked".
   ============================================================ */

export type RawBilingual = {
  readonly en: string;
  readonly ta: string;
};

export type RawKnobOption = {
  readonly value: string;
  readonly label: RawBilingual;
};

export type RawKnob = {
  readonly key: string;
  readonly label: RawBilingual;
  readonly options: readonly RawKnobOption[];
};

export type RawPredict = {
  readonly question: RawBilingual;
  readonly options: readonly RawKnobOption[];
  readonly answer: string;
  readonly explain: RawBilingual;
  /** The knob the question is about, or null for one with no consequence in
   *  the picture. Absent in content authored before engine 21, which reads the
   *  same as null. */
  readonly knob?: string | null;
};

/** The scene spec as authored: a `kind` that is only a string until it has
 *  been matched against the five renderers, and fields this file deliberately
 *  does not enumerate — checking them is validate.ts's job, and duplicating
 *  the union here would give two places to keep in step. */
export type RawSceneSpec = {
  readonly kind: string;
  readonly [field: string]: unknown;
};

export type RawSentenceSlot = {
  readonly slot: string;
  readonly text?: string;
  readonly case?: string;
  readonly number?: string;
};

export type RawSentenceTemplates = {
  readonly en: readonly RawSentenceSlot[];
  readonly ta: readonly RawSentenceSlot[];
};

export type RawLesson = {
  readonly id: string;
  readonly topicId: string;
  readonly order: number;
  readonly title: RawBilingual;
  readonly idea: RawBilingual;
  readonly scene: RawSceneSpec;
  readonly knobs: readonly RawKnob[];
  readonly predict: RawPredict | null;
  readonly why: RawBilingual;
  readonly sentence: RawSentenceTemplates;
};

export type RawOutlineLesson = {
  readonly en: string;
  readonly ta: string;
  readonly ex?: string;
  readonly exTa?: string;
};

export type RawOutlineGroup = {
  readonly en: string;
  readonly ta: string;
  readonly lessons?: readonly RawOutlineLesson[];
};

export type RawTopicOutline = {
  readonly id: string;
  readonly groups?: readonly RawOutlineGroup[];
};

export type RawSourceTable = {
  readonly id: string;
  readonly topic: string;
  readonly en: string;
  readonly ta: string;
  readonly cols?: readonly string[];
  readonly rows?: readonly (readonly string[])[];
};

export type RawCorrection = {
  readonly where: string;
  readonly was: string;
  readonly now: string;
};

export type RawFormationSpec = {
  readonly en: string;
  readonly ta: string;
  /** The authoring shorthand: `The:det | ball:figure | is:be`. */
  readonly enAlign: string;
  readonly taAlign: string;
};

/** `formation.json`: the alignments, authored per row because nothing in the
 *  source says which Tamil word carries which job. */
export type RawFormation = {
  readonly rows?: Readonly<Record<string, RawFormationSpec>>;
  readonly words?: Readonly<Record<string, RawFormationSpec>>;
};

/** `curriculum.json`: generated from the source notes, never hand-edited. */
export type RawCurriculum = {
  readonly topics?: readonly RawTopicOutline[];
  readonly tables?: readonly RawSourceTable[];
  readonly corrections?: readonly RawCorrection[];
};

export type RawTopic = {
  readonly id: string;
  readonly order: number;
  readonly title: RawBilingual;
  readonly summary: RawBilingual;
  readonly lessonIds: readonly string[];
};

/** What a validation failure has to be able to say: which file, which item,
 *  and which rule. "Content failed to load" costs an hour of searching. */
export type ContentIssue = {
  readonly file: string;
  readonly path: string;
  readonly rule: string;
};
