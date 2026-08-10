import { create } from 'zustand';

import { PATH_ARROWS } from 'common/scene/renderers/path.renderer';
import { glyphFor } from 'common/scene/renderers/relation.renderer';
import { sceneProblem } from 'common/scene/renderers/registry';
import { verbFor } from 'common/scene/renderers/actor.renderer';
import type {
  ActorSpec,
  FigureCount,
  Lesson,
  PathSpec,
  PlaceSpec,
  PropId,
  RelationSpec,
  SceneSpec,
  TimelineSpec,
} from 'common/scene/types';

/* ============================================================
   lesson.store.ts — the lesson that is open, and what its knobs
   are set to.

   The scene is *not* in here. It is derived on read from the
   lesson and the knob values, because a stored copy of the scene
   is a second answer to "what is on the stage" — and the moment
   two answers exist, one of them is the stale one the learner is
   looking at.
   ============================================================ */

/** Knob values are strings because a knob option's value is a string: it is
 *  what the control puts on the wire, and turning it back into a number or a
 *  flag is the scene's business, not the store's. */
export type KnobValues = Readonly<Record<string, string>>;

export type PredictState = {
  readonly answered: boolean;
  readonly chosen: string | null;
  readonly correct: boolean;
};

const UNANSWERED: PredictState = { answered: false, chosen: null, correct: false };

export type LessonState = {
  readonly lesson: Lesson | null;
  readonly knobs: KnobValues;
  readonly predict: PredictState;
  /** Which knob moved last, so engine 19 knows which word to flash. Null on
   *  open: nothing has been turned yet, and flashing a word on arrival would
   *  say something changed when nothing did. */
  readonly lastKnob: string | null;

  readonly open: (lesson: Lesson) => void;
  readonly close: () => void;
  readonly setKnob: (key: string, value: string) => void;
  readonly answer: (value: string) => void;
  readonly reset: () => void;
};

export const useLessonStore = create<LessonState>((set, get) => ({
  lesson: null,
  knobs: {},
  predict: UNANSWERED,
  lastKnob: null,

  /* Opening the same lesson twice starts it again rather than resuming. A
     lesson is not a document: coming back to one and finding somebody else's
     knob settings on it is the picture disagreeing with the sentence you were
     last told. */
  open: (lesson) => {
    set({ lesson, knobs: seedKnobs(lesson), predict: UNANSWERED, lastKnob: null });
  },

  close: () => {
    set({ lesson: null, knobs: {}, predict: UNANSWERED, lastKnob: null });
  },

  /**
   * Turn a knob, if the value is one this knob offers and the scene it makes
   * can be drawn.
   *
   * Both halves matter. The first stops a stale control pushing a value the
   * lesson never declared; the second stops one the renderer would refuse —
   * asking for `between` when there is only one ground draws nothing, and a
   * blank stage is not what a learner should get for turning a dial.
   */
  setKnob: (key, value) => {
    const { lesson, knobs } = get();
    if (!lesson) return;

    const knob = lesson.knobs.find((candidate) => candidate.key === key);
    if (!knob || !knob.options.some((option) => option.value === value)) return;
    if (knobs[key] === value) return;

    const next = { ...knobs, [key]: value };
    if (!knobAllows(lesson, knobs, key, value)) return;

    set({ knobs: next, lastKnob: key });
  },

  /* The first answer stands. Predict-then-reveal turns on having committed to
     something before being shown; a learner who can keep choosing after the
     reveal has not predicted anything. */
  answer: (value) => {
    const { lesson, predict } = get();
    if (!lesson?.predict || predict.answered) return;
    if (!lesson.predict.options.some((option) => option.value === value)) return;

    set({ predict: { answered: true, chosen: value, correct: value === lesson.predict.answer } });
  },

  reset: () => {
    set({ lesson: null, knobs: {}, predict: UNANSWERED, lastKnob: null });
  },
}));

/* ---- knobs ↔ scene -----------------------------------------
   A knob is a field of the scene spec under another name, so
   these two tables are inverses: one reads the opening value out
   of the scene, the other writes a turned value back in.
   ------------------------------------------------------------ */

/** Nothing chosen. `adjective`, `ground2` and `patient` are all fields whose
 *  absence means something, so the empty string is how a knob says "none". */
const NONE = '';

const asString = (value: unknown): string =>
  value === null || value === undefined ? NONE : String(value);

/** The lesson's own scene, read as knob values. This is what makes the picture
 *  and the sentence agree the moment a lesson opens: the controls start where
 *  the scene already is, rather than at whatever their first option happens to
 *  be. */
export function seedKnobs(lesson: Lesson): KnobValues {
  const scene = lesson.scene as unknown as Record<string, unknown>;
  const seeded: Record<string, string> = {};

  for (const knob of lesson.knobs) {
    seeded[knob.key] = asString(scene[knob.key]);
  }
  return seeded;
}

const asCount = (value: string, fallback: FigureCount): FigureCount => {
  const count = Number(value);
  return count === 1 || count === 2 || count === 3 ? count : fallback;
};

const asProp = (value: string): PropId | null => (value === NONE ? null : (value as PropId));

const asFlag = (value: string, fallback: boolean): boolean =>
  value === 'true' ? true : value === 'false' ? false : fallback;

function derivePlace(spec: PlaceSpec, knobs: KnobValues): PlaceSpec {
  const at = (key: string): string | undefined => knobs[key];

  return {
    ...spec,
    figure: at('figure') ? ((at('figure') as string) as PropId) : spec.figure,
    ground: at('ground') === undefined ? spec.ground : asProp(at('ground') as string),
    ground2: at('ground2') === undefined ? spec.ground2 : asProp(at('ground2') as string),
    relation: (at('relation') as PlaceSpec['relation']) ?? spec.relation,
    determiner: (at('determiner') as PlaceSpec['determiner']) ?? spec.determiner,
    count: at('count') === undefined ? spec.count : asCount(at('count') as string, spec.count),
    adjective: at('adjective') === undefined ? spec.adjective : (at('adjective') as string) || null,
  };
}

/** The arrow is not a knob of its own: it is what the preposition *is*. Left
 *  to a stale value, turning `to` into `over` would leave the picture drawing a
 *  straight line that arrives, which is a different preposition from the one
 *  the sentence now says. */
function derivePath(spec: PathSpec, knobs: KnobValues): PathSpec {
  const relation = (knobs.relation as PathSpec['relation']) ?? spec.relation;
  const shape = PATH_ARROWS[relation];

  return {
    ...spec,
    mover: knobs.mover ? (knobs.mover as PropId) : spec.mover,
    landmark: (knobs.landmark as PathSpec['landmark']) ?? spec.landmark,
    relation,
    arrow: shape.arrow,
    arrives: shape.arrives,
  };
}

function deriveTimeline(spec: TimelineSpec, knobs: KnobValues): TimelineSpec {
  return {
    ...spec,
    tense: (knobs.tense as TimelineSpec['tense']) ?? spec.tense,
    relation:
      knobs.relation === undefined
        ? spec.relation
        : knobs.relation === NONE
          ? null
          : (knobs.relation as NonNullable<TimelineSpec['relation']>),
  };
}

/** The cue follows the verb, for the same reason the arrow follows the
 *  preposition: `eat` is a chomp and `throw` is an arc, and a cue left behind
 *  by a knob is the picture showing one action while the word says another. */
function deriveActor(spec: ActorSpec, knobs: KnobValues): ActorSpec {
  const verb = (knobs.verb as ActorSpec['verb']) ?? spec.verb;
  const drawn = verbFor(verb);

  return {
    ...spec,
    actor: knobs.actor ? (knobs.actor as PropId) : spec.actor,
    verb,
    patient: knobs.patient === undefined ? spec.patient : asProp(knobs.patient),
    cue: drawn ? drawn.cue : spec.cue,
    voice: (knobs.voice as ActorSpec['voice']) ?? spec.voice,
    mood: (knobs.mood as ActorSpec['mood']) ?? spec.mood,
    negated: knobs.negated === undefined ? spec.negated : asFlag(knobs.negated, spec.negated),
  };
}

function deriveRelation(spec: RelationSpec, knobs: KnobValues): RelationSpec {
  const connective = (knobs.connective as RelationSpec['connective']) ?? spec.connective;

  return {
    ...spec,
    left: knobs.left ? (knobs.left as PropId) : spec.left,
    right: knobs.right ? (knobs.right as PropId) : spec.right,
    connective,
    glyph: glyphFor(connective),
  };
}

/* One entry, keyed on identity. Machinery rather than state, like the in-flight
   promise in `content.store.ts`: `deriveScene` is a pure function and this only
   stops it handing back a new object for an input it has already answered.
   Without it every render is a new spec, `Stage`'s memo never hits, and the
   scene is rebuilt for a knob nobody turned. */
let lastLesson: Lesson | null = null;
let lastKnobs: KnobValues | null = null;
let lastScene: SceneSpec | null = null;

/**
 * The scene the open lesson is currently showing.
 *
 * Derived, never stored — the specific mistake `codebase-guide.md` names. The
 * fields a knob does not own are the lesson's own, and the fields that follow
 * another field are recomputed rather than carried: a stale arrow or cue is a
 * picture contradicting its own sentence.
 */
export function deriveScene(lesson: Lesson, knobs: KnobValues): SceneSpec {
  if (lesson === lastLesson && knobs === lastKnobs && lastScene) return lastScene;

  const derived = buildScene(lesson, knobs);

  lastLesson = lesson;
  lastKnobs = knobs;
  lastScene = derived;
  return derived;
}

/** The same derivation, without touching the cache. What the controls ask when
 *  they are trying every option in turn: a hundred hypothetical scenes must not
 *  evict the one actually on the stage. */
function buildScene(lesson: Lesson, knobs: KnobValues): SceneSpec {
  const scene = lesson.scene;

  return (
    scene.kind === 'place'
      ? derivePlace(scene, knobs)
      : scene.kind === 'path'
        ? derivePath(scene, knobs)
        : scene.kind === 'timeline'
          ? deriveTimeline(scene, knobs)
          : scene.kind === 'actor'
            ? deriveActor(scene, knobs)
            : deriveRelation(scene, knobs)
  );
}

/** The scene for whatever is open, or null. */
export const selectScene = (state: LessonState): SceneSpec | null =>
  state.lesson ? deriveScene(state.lesson, state.knobs) : null;

/** Whether a knob option would make a scene that can be drawn. The controls
 *  ask this to disable the impossible option rather than offer it and refuse
 *  the turn. */
export function knobAllows(lesson: Lesson, knobs: KnobValues, key: string, value: string): boolean {
  return sceneProblem(buildScene(lesson, { ...knobs, [key]: value })) === null;
}
