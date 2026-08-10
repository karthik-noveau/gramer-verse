import { create } from 'zustand';

import { PATH_ARROWS, pathAllows } from 'common/scene/renderers/path.renderer';
import { TIME_RELATIONS } from 'common/scene/renderers/timeline.renderer';
import { glyphFor } from 'common/scene/renderers/relation.renderer';
import { placeAllows } from 'common/scene/renderers/place.renderer';
import { propFor } from 'common/scene/props/index';
import type {
  Connective,
  Determiner,
  FigureCount,
  LandmarkKind,
  PathRelation,
  PlaceRelation,
  PropId,
  SceneSpec,
  TimeRelation,
  TimelineMark,
} from 'common/scene/types';
import { resolve } from 'pages/visualizer/utils/resolver';
import type { Resolved } from 'pages/visualizer/utils/resolver';

/* ============================================================
   visualizer.store.ts — the typed sentence, the chosen
   preposition, and the knobs under the picture.

   The scene is derived from all three and stored nowhere. Two
   ways in — typing a sentence and pressing a word — have to
   agree about what is on the stage, and they only can if there
   is one answer to ask for.

   The typed text is the learner's. Turning a knob changes the
   picture and never rewrites what they wrote.
   ============================================================ */

/** How a preposition is drawn. The place ones are a scene the knobs move; the
 *  rest have a picture of their own that the place knobs cannot touch, and the
 *  page says so rather than showing controls that do nothing. */
export type Mode = 'scene' | 'diagram';

export type PlaceKnobs = {
  readonly figure: PropId;
  readonly ground: PropId | null;
  readonly ground2: PropId | null;
  readonly determiner: Determiner;
  readonly count: FigureCount;
  readonly adjective: string | null;
};

const OPENING: PlaceKnobs = {
  figure: 'ball' as PropId,
  ground: 'box' as PropId,
  ground2: 'chair' as PropId,
  determiner: 'the',
  count: 1,
  adjective: null,
};

export type VisualizerState = {
  /** What is in the field. Never written to by anything but the learner and
   *  the two buttons that fill it on purpose. */
  readonly typed: string;
  /** The last thing that was submitted and could not be drawn. Cleared the
   *  moment the picture becomes something else. */
  readonly cannot: Extract<Resolved, { status: 'cannot' }> | null;
  /** Which of the source's five tables the picker is showing. */
  readonly group: string;
  readonly word: string;
  readonly place: PlaceKnobs;

  readonly setTyped: (text: string) => void;
  readonly submit: (text?: string) => void;
  readonly choose: (word: string, group?: string) => void;
  readonly setGroup: (group: string) => void;
  readonly setKnob: (key: keyof PlaceKnobs, value: string) => void;
  readonly reset: () => void;
};

const START = {
  typed: 'the ball is in the box',
  cannot: null,
  group: 'prep-place',
  word: 'in',
  place: OPENING,
} as const;

export const useVisualizerStore = create<VisualizerState>((set, get) => ({
  ...START,

  setTyped: (text) => set({ typed: text }),

  /**
   * Draw what was typed.
   *
   * A sentence that resolves moves the picker and every knob to match it, so
   * the controls under the picture describe the picture — type "a red apple is
   * under the chair" and the chair is what the ground knob says.
   */
  submit: (text) => {
    const typed = text ?? get().typed;
    const result = resolve(typed);

    if (result.status !== 'drawn') {
      set({ typed, cannot: result.status === 'cannot' ? result : null });
      return;
    }

    const { spec } = result;
    set({
      typed,
      cannot: null,
      word: spec.relation,
      group: groupOf(spec.relation),
      place: {
        figure: spec.figure,
        ground: spec.ground,
        ground2: spec.ground2 ?? get().place.ground2,
        determiner: spec.determiner,
        count: spec.count,
        adjective: spec.adjective,
      },
    });
  },

  /**
   * Press a word and it is drawn.
   *
   * If the ground currently on the stage cannot hold the new relation — a box
   * has nothing beneath it — the ground is swapped for one that can, rather
   * than the picture going blank. Every chip in the picker draws something;
   * one that did not would be a control that appears broken.
   *
   * It does not rewrite the field: the sentence there is the learner's, and
   * having it silently replaced each time a chip is pressed is the page taking
   * their work away.
   */
  choose: (word, group) => {
    const state = get();
    const place = fitGround(word, group ?? state.group, state.place);
    set({ word, cannot: null, place, ...(group === undefined ? {} : { group }) });
  },

  setGroup: (group) => {
    const words = WORDS[group] ?? [];
    const first = words[0];
    if (first === undefined) {
      set({ group, cannot: null });
      return;
    }
    set({ group, cannot: null, word: first, place: fitGround(first, group, get().place) });
  },

  setKnob: (key, value) => {
    const place = get().place;
    const next: PlaceKnobs = {
      ...place,
      ...(key === 'count'
        ? { count: (Number(value) || 1) as FigureCount }
        : key === 'determiner'
          ? { determiner: value === 'a' ? 'a' : ('the' as Determiner) }
          : key === 'adjective'
            ? { adjective: value === '' ? null : value }
            : { [key]: value === '' ? null : (value as PropId) }),
    };

    if (!propFor(next.figure)) return;
    set({ place: next, cannot: null });
  },

  reset: () => set({ ...START }),
}));

/** The knobs, with a ground the relation can actually hold. Asked of the
 *  renderer: there is no second list here of what fits under what. */
function fitGround(word: string, group: string, place: PlaceKnobs): PlaceKnobs {
  if (modeOf(word, group) !== 'scene') return place;

  const relation = word as PlaceRelation;
  if (placeAllows(relation, place.ground, place.ground2)) return place;

  const ground = GROUNDS.find((candidate) => placeAllows(relation, candidate, place.ground2));
  return ground === undefined ? place : { ...place, ground };
}

/** The grounds this page offers, in the order it tries them. */
const GROUNDS: readonly PropId[] = ['table', 'box', 'chair', 'tree'] as PropId[];

/* ---- which table a word belongs to -------------------------
   The source's own five, which is the grouping the picker uses
   and the grouping every drawing here is keyed to.
   ------------------------------------------------------------ */

export const WORDS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  'prep-common': ['in', 'on', 'at'],
  'prep-place': [
    'in', 'on', 'at', 'under', 'above', 'below',
    'behind', 'in front of', 'between', 'near', 'beside', 'here', 'there',
  ],
  'prep-dir': ['to', 'into', 'towards', 'along', 'across', 'over', 'past', 'from'],
  'prep-time': ['in', 'on', 'at', 'before', 'after', 'by', 'since', 'during', 'until'],
  'prep-other': ['about', 'for', 'with', 'as', 'like', 'per'],
});

const PLACE_WORDS = new Set(WORDS['prep-place']);
const PATH_WORDS = new Set(WORDS['prep-dir']);
const OTHER_WORDS = new Set(WORDS['prep-other']);

const groupOf = (word: string): string => (PLACE_WORDS.has(word) ? 'prep-place' : 'prep-dir');

/** Which picture a word gets. A place word is a scene the knobs move; the rest
 *  are drawn by the renderer that owns them and cannot be knobbed from here. */
export function modeOf(word: string, group: string): Mode {
  if (group === 'prep-time') return 'diagram';
  if (group === 'prep-dir' || group === 'prep-other') return 'diagram';
  return PLACE_WORDS.has(word) ? 'scene' : 'diagram';
}

/* ---- the pictures for the words the knobs do not move -------
   Built from each renderer's own table rather than written out
   again here: the marks a time preposition needs are the marks
   `TIME_RELATIONS` says it needs, and the landmark a direction
   can use is whichever one `pathAllows` accepts. A second copy
   of either would be a second thing to keep in step.
   ------------------------------------------------------------ */

const LANDMARKS: readonly LandmarkKind[] = ['container', 'road', 'river', 'city', 'building'];

function pathFor(relation: PathRelation): SceneSpec {
  const shape = PATH_ARROWS[relation];
  const landmark = LANDMARKS.find((candidate) => pathAllows(relation, candidate)) ?? 'building';

  return {
    kind: 'path',
    mover: 'man' as PropId,
    landmark,
    relation,
    arrives: shape.arrives,
    arrow: shape.arrow,
  };
}

/** Marks of the kinds the relation is drawn out of, at readable places on the
 *  axis. Unlabelled: a label here would be authored content, and what this
 *  page is showing is the shape. */
function marksFor(relation: TimeRelation): readonly TimelineMark[] {
  const mark = (id: string, kind: TimelineMark['kind'], at: number, to: number | null): TimelineMark => ({
    id,
    kind,
    at,
    to,
    label: null,
  });

  return TIME_RELATIONS[relation].marks.map((kind, index) => {
    if (kind === 'band') return mark(`mark-${index}`, 'band', 0.18, 0.52);
    if (kind === 'container') return mark(`mark-${index}`, 'container', 0.18, 0.42);
    if (kind === 'boundary') return mark(`mark-${index}`, 'boundary', 0.52, null);
    return mark(`mark-${index}`, 'point', relation === 'during' ? 0.34 : 0.3, null);
  });
}

/** The scene for whatever is chosen. Derived on read: two ways in, one answer
 *  to what is on the stage. */
export function selectScene(state: VisualizerState): SceneSpec | null {
  const { word, group, place } = state;

  if (modeOf(word, group) === 'scene') {
    const relation = word as PlaceRelation;
    const free = relation === 'here' || relation === 'there';
    const spec: SceneSpec = {
      kind: 'place',
      figure: place.figure,
      ground: free ? null : place.ground,
      ground2: relation === 'between' ? place.ground2 : null,
      relation,
      determiner: place.determiner,
      count: place.count,
      adjective: place.adjective,
    };
    return placeAllows(relation, spec.ground, spec.ground2) ? spec : null;
  }

  if (group === 'prep-dir' && PATH_WORDS.has(word)) return pathFor(word as PathRelation);

  if (group === 'prep-other' && OTHER_WORDS.has(word)) {
    return {
      kind: 'relation',
      left: 'cup' as PropId,
      right: 'book' as PropId,
      connective: word as Connective,
      glyph: glyphFor(word as Connective),
    };
  }

  if (group === 'prep-time' && Object.prototype.hasOwnProperty.call(TIME_RELATIONS, word)) {
    return {
      kind: 'timeline',
      tense: 'present-simple',
      marks: marksFor(word as TimeRelation),
      relation: word as TimeRelation,
    };
  }

  return null;
}

/** Whether a knob value would leave a picture that can be drawn — the same
 *  question the lesson's knobs ask, asked of this page's own state. */
export const knobAllows = (state: VisualizerState, key: keyof PlaceKnobs, value: string): boolean => {
  if (modeOf(state.word, state.group) !== 'scene') return false;
  const relation = state.word as PlaceRelation;

  if (key === 'ground') return placeAllows(relation, value, state.place.ground2);
  if (key === 'ground2') return placeAllows(relation, state.place.ground, value);
  return true;
};
