/* ============================================================
   types.ts — the contract the whole scene engine is written
   against. No behaviour lives here, and nothing in this file
   imports anything: it is the one module every other one may
   depend on.

   Architecture §3.1, §3.2, §4.2 and §5.
   ============================================================ */

/* ---- ids ---------------------------------------------------
   Branded, so a LessonId cannot be handed to something expecting
   a TopicId. They are all strings underneath; the brand exists
   only at compile time and costs nothing at runtime.
   ------------------------------------------------------------ */
declare const brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [brand]: B };

export type TopicId = Brand<string, 'TopicId'>;
export type LessonId = Brand<string, 'LessonId'>;
export type PropId = Brand<string, 'PropId'>;
export type VerbId = Brand<string, 'VerbId'>;

/**
 * A string that is known to have content.
 *
 * Constraint 3 says a missing Tamil string is a content error, not a layout
 * case. Making `ta` merely `string` means the emptiness is discovered by the
 * reader; making it this means it is discovered by `common/api/validate.ts`,
 * which is the only place allowed to mint one.
 */
export type NonEmptyString = Brand<string, 'NonEmptyString'>;

/* ---- words -------------------------------------------------
   English builds "the ball is in the box" by putting words in a
   row. Tamil builds பந்து பெட்டியில் உள்ளது by changing the end
   of the noun — there is no separate word for "in". So every
   prop carries its declined forms and every preposition declares
   which case it governs.
   ------------------------------------------------------------ */
export type PropWord = {
  readonly en: { readonly singular: string; readonly plural: string };
  readonly ta: {
    readonly nominative: string; // பெட்டி           the box
    readonly accusative: string; // பெட்டியை         the box (object)
    readonly dative: string; //     பெட்டிக்கு        to the box
    readonly locative: string; //   பெட்டியில்        in / at the box
    readonly ablative: string; //   பெட்டியிலிருந்து   from the box
  };
};

export type TamilCase = keyof PropWord['ta'];

export type Bilingual = { readonly en: NonEmptyString; readonly ta: NonEmptyString };

/* ---- the node tree -----------------------------------------
   What a renderer returns: plain, serialisable, and not JSX. It
   is what lets renderers be tested by asserting on structure
   rather than on markup, and what lets engine 20 diff two trees.
   ------------------------------------------------------------ */
export type SceneTag = 'g' | 'rect' | 'circle' | 'ellipse' | 'path' | 'line' | 'text';

export type SceneNode = {
  /** Stable across renders — it is what the animation diff matches on, so it
   *  is derived from the node's role ("figure-0", "ground"), never from an
   *  array index that reorders when a knob moves. */
  readonly id: string;
  readonly tag: SceneTag;
  readonly attrs: Readonly<Record<string, string | number>>;
  readonly text?: string;
  readonly children?: readonly SceneNode[];
};

/* ---- props -------------------------------------------------
   Every prop draws itself into a local box and declares its own
   anchors. This is what makes 40+ scenes come out of ~15
   drawable things.
   ------------------------------------------------------------ */
export type AnchorName = 'mouth' | 'hand' | 'foot' | 'eye';

export type Prop = {
  readonly id: PropId;
  readonly box: { readonly w: number; readonly h: number };
  /** Where things sit ON it, relative to the prop box. Null if nothing can.
   *  Null rather than optional: "nothing can sit on this" is a fact about the
   *  prop, and a missing field would be indistinguishable from an unfinished
   *  one. */
  readonly surfaceY: number | null;
  /** Vertical change per horizontal pixel from the surface's midpoint. */
  readonly surfaceSlope?: number;
  /** Where things go IN it: [x, y, w, h]. Null if it is not a container. */
  readonly inside: readonly [number, number, number, number] | null;
  /** Whether anything fits beneath it. A table stands on legs, so it has
   *  clearance; a box sits flat, so "under the box" has nowhere to go. */
  readonly clearance: boolean;
  /** For actors: mouth, hand, foot, eye. Empty for objects. */
  readonly anchors: Readonly<Partial<Record<AnchorName, readonly [number, number]>>>;
  readonly draw: (fill?: string) => readonly SceneNode[];
  /** A container whose contents sit between its back and front walls. */
  readonly cutaway?: {
    readonly back: () => readonly SceneNode[];
    readonly front: () => readonly SceneNode[];
    /** An opaque open container shows the contents peeking above this rim. */
    readonly rimY?: number;
    /** Rear edge at the midpoint, where objects behind the container peek out. */
    readonly backY?: number;
  };
  readonly word: PropWord;
};

/* ---- the five scenes ---------------------------------------
   A taxonomy of pictures, not of grammar. Adding an arm without
   adding a renderer is a compile error in registry.ts, which is
   the intended pressure.
   ------------------------------------------------------------ */

/** in, on, at, under, above, below, behind, in front of, between, near,
 *  beside, here, there. */
export type PlaceRelation =
  | 'in' | 'on' | 'at' | 'under' | 'above' | 'below'
  | 'behind' | 'in front of' | 'between' | 'near' | 'beside'
  | 'here' | 'there';

export type Determiner = 'a' | 'the';

/** One, two or three copies. More than three is a crowd, not a number. */
export type FigureCount = 1 | 2 | 3;

export type PlaceSpec = {
  readonly kind: 'place';
  readonly figure: PropId;
  /** `here` and `there` have no ground — they point at where the speaker is,
   *  and drawing a second thing to be near would be inventing one. */
  readonly ground: PropId | null;
  /** `between` needs two grounds. Null everywhere else. */
  readonly ground2: PropId | null;
  readonly relation: PlaceRelation;
  readonly determiner: Determiner;
  readonly count: FigureCount;
  /** Colour changes the fill, size changes the scale. Null for neither. */
  readonly adjective: string | null;
};

/** The eight the curriculum teaches, in its own order: to, into, towards,
 *  along, across, over, past, from.
 *
 *  Written in engine 06 as ten guessed from the topic name — `out of`,
 *  `through`, `around` and `onto` are in no lesson, and `over` and `past`,
 *  which are two, were missing. `LandmarkKind` below has a `city` in it for no
 *  other reason than *the plane flew over the city*, which is how the omission
 *  was found. */
export type PathRelation =
  | 'to' | 'into' | 'towards' | 'along'
  | 'across' | 'over' | 'past' | 'from';

export type LandmarkKind = 'building' | 'container' | 'road' | 'river' | 'city';

export type ArrowShape = 'straight' | 'arc' | 'curve-into' | 'solid-then-dashed';

export type PathSpec = {
  readonly kind: 'path';
  readonly mover: PropId;
  readonly landmark: LandmarkKind;
  readonly relation: PathRelation;
  /** `to` arrives, `towards` does not. The difference is the whole lesson, so
   *  it is a field rather than something inferred from the relation. */
  readonly arrives: boolean;
  readonly arrow: ArrowShape;
};

export type TenseId =
  | 'present-simple' | 'present-continuous' | 'present-perfect' | 'present-perfect-continuous'
  | 'past-simple' | 'past-continuous' | 'past-perfect' | 'past-perfect-continuous'
  | 'future-simple' | 'future-continuous' | 'future-perfect' | 'future-perfect-continuous';

export type TimeMarkKind = 'point' | 'band' | 'boundary' | 'container';

export type TimelineMark = {
  readonly id: string;
  readonly kind: TimeMarkKind;
  /** Where on the axis, as a fraction: 0 is the far past, 1 the far future,
   *  and 0.5 is now. A fraction rather than pixels, because the axis is laid
   *  out by the renderer and the content must not know its width. */
  readonly at: number;
  /** Bands and containers span; points and flags do not. */
  readonly to: number | null;
  readonly label: Bilingual | null;
};

/** The nine the curriculum teaches. Written in engine 06 with a `for` in it
 *  and no `until`: `for` is in the last group of prepositions, not the time
 *  one — *the gift is for you* — and it is already a `Connective` below. */
export type TimeRelation =
  | 'in' | 'on' | 'at' | 'before' | 'after'
  | 'by' | 'since' | 'during' | 'until';

export type TimelineSpec = {
  readonly kind: 'timeline';
  readonly tense: TenseId;
  readonly marks: readonly TimelineMark[];
  /** The time preposition being taught, when one is. */
  readonly relation: TimeRelation | null;
};

export type ActorCue = 'chomp' | 'gaze' | 'arc' | 'impact';
export type Voice = 'active' | 'passive';
export type Mood = 'statement' | 'question' | 'imperative';

export type ActorSpec = {
  readonly kind: 'actor';
  readonly actor: PropId;
  readonly verb: VerbId;
  readonly patient: PropId | null;
  readonly cue: ActorCue;
  /** Voice rings a different participant; it does not change the picture. */
  readonly voice: Voice;
  readonly mood: Mood;
  readonly negated: boolean;
};

/** The schematics the abstract relations are drawn as.
 *
 *  Written in engine 06 with six of them, from engine 15's scope line. That
 *  engine's own steps then ask for two more pictures that are neither: `about`
 *  puts the topic in a bubble above the item, and `as` puts a role badge on
 *  it. Folding either into `similarity` would make `as` and `like` declare the
 *  same glyph, and telling those two apart is the stated job of the renderer. */
export type RelationGlyph =
  | 'brace' | 'contrast' | 'branch' | 'cause'
  | 'similarity' | 'rate' | 'bubble' | 'role';

export type Connective =
  | 'and' | 'but' | 'or' | 'because' | 'so'
  | 'about' | 'for' | 'with' | 'as' | 'like' | 'per';

export type RelationSpec = {
  readonly kind: 'relation';
  readonly left: PropId;
  readonly right: PropId;
  readonly connective: Connective;
  readonly glyph: RelationGlyph;
};

export type SceneSpec = PlaceSpec | PathSpec | TimelineSpec | ActorSpec | RelationSpec;

export type SceneKind = SceneSpec['kind'];

/* ---- sentences ---------------------------------------------
   The two languages are built independently from the same scene
   state, because their word order differs and Tamil declines
   where English adds a word.

       en  [det][adj][figure][be][rel][the][ground]
       ta  [figure.nominative][ground.locative][be]
   ------------------------------------------------------------ */
export type SentenceSlot =
  /** A fixed word: "is", "the", a full stop. */
  | { readonly slot: 'text'; readonly text: string }
  /** A noun from the scene, in the case and number the template asks for.
   *  `case` is ignored in the English line, where nouns do not decline. */
  | {
      readonly slot: 'figure' | 'ground' | 'ground2' | 'actor' | 'patient';
      readonly case?: TamilCase;
      readonly number?: 'singular' | 'plural';
    }
  /** Filled from the spec: the determiner, the adjective, the relation word,
   *  the verb, the copula. */
  | { readonly slot: 'det' | 'adj' | 'relation' | 'verb' | 'be' };

export type SentenceTemplates = {
  readonly en: readonly SentenceSlot[];
  readonly ta: readonly SentenceSlot[];
};

/* ---- content -----------------------------------------------
   Architecture §5. What a lesson is, and what a learner may
   change about it.
   ------------------------------------------------------------ */
export type KnobOption = { readonly value: string; readonly label: Bilingual };

export type Knob = {
  readonly key: string;
  readonly label: Bilingual;
  readonly options: readonly KnobOption[];
};

export type Predict = {
  readonly question: Bilingual;
  readonly options: readonly KnobOption[];
  /** Must be one of its own options — validated on load. */
  readonly answer: string;
  readonly explain: Bilingual;
  /**
   * The knob the question is about, when it is about one.
   *
   * Written in engine 06 without it, which left the predict step unable to do
   * the one thing it exists for: draw what the learner said before drawing
   * what is true. That needs to know which knob a wrong answer moves, and it
   * has to be declared — inferring it from whichever knob happens to share the
   * option values would make a lesson's meaning depend on a coincidence.
   *
   * Null for a question with no consequence in the picture. Those are answered
   * and explained; there is nothing to draw wrongly first.
   */
  readonly knob: string | null;
};

export type Lesson = {
  readonly id: LessonId;
  readonly topicId: TopicId;
  readonly order: number;
  readonly title: Bilingual;
  /** The one-line spine of the lesson. */
  readonly idea: Bilingual;
  /** The opening state. Knobs move it from here. */
  readonly scene: SceneSpec;
  readonly knobs: readonly Knob[];
  /** The predict-then-reveal step, where the lesson has one. */
  readonly predict: Predict | null;
  /** Why the picture looks like that. */
  readonly why: Bilingual;
  readonly sentence: SentenceTemplates;
};

export type Topic = {
  readonly id: TopicId;
  readonly order: number;
  readonly title: Bilingual;
  readonly summary: Bilingual;
  readonly lessonIds: readonly LessonId[];
};

/* ---- the source notes -------------------------------------
   The curriculum as the notes wrote it: every topic's outline
   and every table, carried whole so a learner can read a topic
   at once instead of stepping through it one lesson at a time.

   Separate from `Lesson`, which is a lesson this app can
   actually draw. Most of the outline is not authored yet, and
   saying so plainly is better than a page that looks empty.
   ------------------------------------------------------------ */

/** One table from the notes, with its columns and its rows. A cell may carry
 *  two lines — the English and its Tamil — which is how the source wrote
 *  them; splitting them is the renderer's job, not the loader's. */
export type SourceTable = {
  readonly id: string;
  readonly topicId: TopicId;
  readonly title: Bilingual;
  readonly columns: readonly string[];
  readonly rows: readonly (readonly string[])[];
};

/**
 * A line of a topic's outline.
 *
 * English and Tamil. The original notes left some titles untranslated; the
 * curriculum audit supplied and reviewed those labels, and validation now
 * rejects a missing Tamil title. The nullable shape remains useful when this
 * type represents an incomplete draft returned by validation tooling.
 *
 * `example` is null on the same terms.
 */
export type OutlineLesson = {
  readonly title: NonEmptyString;
  readonly titleTa: NonEmptyString | null;
  readonly example: Bilingual | null;
};

export type OutlineGroup = {
  readonly title: Bilingual;
  readonly lessons: readonly OutlineLesson[];
};

/** A topic's own shape: prepositions has four groups, most topics have one. */
export type TopicOutline = {
  readonly topicId: TopicId;
  readonly groups: readonly OutlineGroup[];
};

/** Where the app teaches something the notes got wrong. Rendered at the foot
 *  of the reference page, and never silently applied. */
export type Correction = {
  readonly where: string;
  readonly was: string;
  readonly now: string;
};

/* ---- the word-order diagram --------------------------------
   English and Tamil say the same thing in a different order and
   sometimes with a different number of words. Which Tamil word
   carries `in` cannot be derived — nothing in the source says so
   — and guessing would draw confident wrong lines, so the
   alignment is authored per row.
   ------------------------------------------------------------ */

/** The eight jobs a word can have. The first five are the scene's own and are
 *  taught by the picture; the last three exist only in this diagram, for the
 *  tables it reaches beyond the scene. A trailing digit makes a second word of
 *  the same job — two places in one sentence — without inventing a colour that
 *  would mean nothing, and every consumer strips it before looking one up. */
export type FormationRole =
  | 'det' | 'figure' | 'rel' | 'ground' | 'be'
  | 'qual' | 'ask' | 'join';

export type FormationToken = {
  readonly text: string;
  /** Empty for a word with no counterpart on the other side, which is itself
   *  worth drawing: Tamil has no article. Two roles is a fusion — the Tamil
   *  word doing the work of two English ones. */
  readonly roles: readonly string[];
};

/** One sentence pair, aligned. The strings are the row's own, after the
 *  corrections in `content/README.md`: a diagram of an uncorrected sentence
 *  would be a diagram of the mistake. */
export type FormationSpec = {
  readonly en: string;
  readonly ta: string;
  readonly enTokens: readonly FormationToken[];
  readonly taTokens: readonly FormationToken[];
};

export type FormationTable = {
  /** Keyed `tableId#rowIndex`, counting only the rows that are rows — the
   *  source's group headings are not sentences and are not numbered. */
  readonly rows: Readonly<Record<string, FormationSpec>>;
  /** By the word in the row instead, for the pronouns table: it is ragged and
   *  some rows drop their leading cell, so the pronoun is found by looking
   *  rather than by counting columns. */
  readonly words: Readonly<Record<string, FormationSpec>>;
};

export type Curriculum = {
  readonly outlines: readonly TopicOutline[];
  readonly tables: readonly SourceTable[];
  readonly corrections: readonly Correction[];
  readonly formation: FormationTable;
};
