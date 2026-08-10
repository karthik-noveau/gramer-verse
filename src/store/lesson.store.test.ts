import type {
  Lesson,
  LessonId,
  NonEmptyString,
  PlaceSpec,
  PropId,
  TopicId,
  VerbId,
} from 'common/scene/types';
import {
  deriveScene,
  knobAllows,
  seedKnobs,
  selectScene,
  useLessonStore,
} from 'store/lesson.store';

/* ============================================================
   lesson.store.test.ts

   Two rules, and everything here is one of them: the knobs are
   the only state, and the scene is worked out from them every
   time it is asked for.
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
      key: 'ground',
      label: bi('The place', 'இடம்'),
      options: [
        { value: 'box', label: bi('box', 'பெட்டி') },
        { value: 'table', label: bi('table', 'மேசை') },
        { value: 'tree', label: bi('tree', 'மரம்') },
      ],
    },
    {
      key: 'count',
      label: bi('How many', 'எத்தனை'),
      options: [
        { value: '1', label: bi('one', 'ஒன்று') },
        { value: '2', label: bi('two', 'இரண்டு') },
      ],
    },
    {
      key: 'determiner',
      label: bi('Which one', 'எது'),
      options: [
        { value: 'a', label: bi('a', 'ஒரு') },
        { value: 'the', label: bi('the', 'அந்த') },
      ],
    },
  ],
  predict: {
    question: bi('Where does it sit?', 'அது எங்கே இருக்கும்?'),
    options: [
      { value: 'inside', label: bi('Inside', 'உள்ளே') },
      { value: 'on-top', label: bi('On top', 'மேலே') },
    ],
    answer: 'inside',
    explain: bi('The box has sides.', 'பெட்டிக்குப் பக்கங்கள் உள்ளன.'),
    knob: null,
  },
  why: bi('The box has sides.', 'பெட்டிக்குப் பக்கங்கள் உள்ளன.'),
  sentence: { en: [{ slot: 'figure' }], ta: [{ slot: 'figure', case: 'nominative' }] },
};

const OTHER: Lesson = {
  ...LESSON,
  id: 'prep-place-on' as LessonId,
  scene: { ...SCENE, figure: id('book'), ground: id('table'), relation: 'on' },
};

const store = (): ReturnType<typeof useLessonStore.getState> => useLessonStore.getState();

beforeEach(() => {
  store().reset();
});

/* ---- opening and closing ----------------------------------- */

describe('open', () => {
  it('seeds every knob from the lesson’s own scene', () => {
    store().open(LESSON);

    expect(store().knobs).toEqual({ ground: 'box', count: '1', determiner: 'the' });
  });

  it('makes the scene and the sentence agree the moment it opens', () => {
    /* The seeded scene is the lesson's scene, not a scene assembled from
       whatever each knob's first option happened to be. */
    store().open(LESSON);

    expect(selectScene(store())).toEqual(SCENE);
  });

  it('turns nothing on arrival', () => {
    store().open(LESSON);

    expect(store().lastKnob).toBeNull();
    expect(store().predict.answered).toBe(false);
  });

  it('starts the same lesson again rather than resuming it', () => {
    store().open(LESSON);
    store().setKnob('count', '2');
    store().answer('inside');
    store().open(LESSON);

    expect(store().knobs.count).toBe('1');
    expect(store().predict.answered).toBe(false);
    expect(store().lastKnob).toBeNull();
  });

  it('leaks nothing into the next lesson', () => {
    store().open(LESSON);
    store().setKnob('ground', 'table');
    store().open(OTHER);

    expect(store().knobs.ground).toBe('table');
    expect(selectScene(store())).toMatchObject({ figure: id('book'), relation: 'on' });
  });
});

describe('close', () => {
  it('clears the lesson, the knobs and the predict step', () => {
    store().open(LESSON);
    store().setKnob('count', '2');
    store().close();

    expect(store().lesson).toBeNull();
    expect(store().knobs).toEqual({});
    expect(store().lastKnob).toBeNull();
    expect(selectScene(store())).toBeNull();
  });
});

/* ---- turning a knob ---------------------------------------- */

describe('setKnob', () => {
  it('takes a value the knob offers', () => {
    store().open(LESSON);
    store().setKnob('count', '2');

    expect(store().knobs.count).toBe('2');
    expect(selectScene(store())).toMatchObject({ count: 2 });
  });

  it('refuses a value the knob does not offer', () => {
    store().open(LESSON);
    store().setKnob('count', '9');

    expect(store().knobs.count).toBe('1');
    expect(store().lastKnob).toBeNull();
  });

  it('refuses a knob the lesson does not have', () => {
    store().open(LESSON);
    store().setKnob('adjective', 'red');

    expect(store().knobs.adjective).toBeUndefined();
  });

  it('refuses a value that would make a picture nobody can draw', () => {
    /* Nothing goes inside a tree, and the option is offered because the same
       knob is right for `on`. Refused here rather than drawn as a blank
       stage. */
    store().open(LESSON);
    store().setKnob('ground', 'tree');

    expect(store().knobs.ground).toBe('box');
    expect(knobAllows(LESSON, store().knobs, 'ground', 'tree')).toBe(false);
    expect(knobAllows(LESSON, store().knobs, 'ground', 'table')).toBe(false);
  });

  it('does nothing when the value is already set', () => {
    store().open(LESSON);
    store().setKnob('count', '1');

    expect(store().lastKnob).toBeNull();
  });

  it('records which knob moved last', () => {
    store().open(LESSON);
    store().setKnob('count', '2');
    expect(store().lastKnob).toBe('count');

    store().setKnob('determiner', 'a');
    expect(store().lastKnob).toBe('determiner');
  });

  it('does nothing at all when no lesson is open', () => {
    store().setKnob('count', '2');

    expect(store().knobs).toEqual({});
  });
});

/* ---- deriving ---------------------------------------------- */

describe('deriveScene', () => {
  it('is the lesson’s scene with the knob values written into it', () => {
    expect(deriveScene(LESSON, { ground: 'box', count: '2', determiner: 'a' })).toEqual({
      ...SCENE,
      count: 2,
      determiner: 'a',
    });
  });

  it('leaves the fields no knob owns alone', () => {
    const derived = deriveScene(LESSON, { count: '2' });

    expect(derived).toMatchObject({ figure: id('ball'), relation: 'in', adjective: null });
  });

  it('gives back the same object for the same input', () => {
    /* Stage is memoised on the spec's identity: a new object every render is a
       picture rebuilt for a knob nobody turned. */
    const knobs = { ground: 'box', count: '1', determiner: 'the' };

    expect(deriveScene(LESSON, knobs)).toBe(deriveScene(LESSON, knobs));
  });

  it('gives back an equal object for an equal input, and a new one for a new lesson', () => {
    expect(deriveScene(LESSON, { count: '2' })).toEqual(deriveScene(LESSON, { count: '2' }));
    expect(deriveScene(OTHER, { count: '2' })).not.toEqual(deriveScene(LESSON, { count: '2' }));
  });

  it('is not disturbed by the controls asking about options they did not take', () => {
    const knobs = { ground: 'box', count: '1', determiner: 'the' };
    const scene = deriveScene(LESSON, knobs);

    knobAllows(LESSON, knobs, 'ground', 'tree');
    knobAllows(LESSON, knobs, 'ground', 'table');

    expect(deriveScene(LESSON, knobs)).toBe(scene);
  });

  it('turns an empty knob value into nothing rather than into an empty id', () => {
    const withAdjective: Lesson = {
      ...LESSON,
      scene: { ...SCENE, adjective: 'red' },
    };

    expect(deriveScene(withAdjective, { adjective: '' })).toMatchObject({ adjective: null });
    expect(deriveScene(withAdjective, { adjective: 'big' })).toMatchObject({ adjective: 'big' });
  });

  it('keeps the fields that follow another field in step with it', () => {
    /* The arrow is what the preposition *is*, and the cue is what the verb is.
       A knob that moved one and left the other would draw one preposition
       while the sentence said another — and the renderer would refuse it. */
    const path: Lesson = {
      ...LESSON,
      scene: {
        kind: 'path',
        mover: id('man'),
        landmark: 'building',
        relation: 'to',
        arrives: true,
        arrow: 'straight',
      },
    };

    expect(deriveScene(path, { relation: 'towards' })).toMatchObject({
      relation: 'towards',
      arrow: 'solid-then-dashed',
      arrives: false,
    });

    const actor: Lesson = {
      ...LESSON,
      scene: {
        kind: 'actor',
        actor: id('man'),
        verb: 'eat' as VerbId,
        patient: id('apple'),
        cue: 'chomp',
        voice: 'active',
        mood: 'statement',
        negated: false,
      },
    };

    expect(deriveScene(actor, { verb: 'kick', patient: 'ball' })).toMatchObject({
      verb: 'kick',
      cue: 'impact',
    });
  });
});

describe('seedKnobs', () => {
  it('reads the scene, and writes nothing for a field that is absent', () => {
    const noAdjective: Lesson = {
      ...LESSON,
      knobs: [
        ...LESSON.knobs,
        {
          key: 'adjective',
          label: bi('What kind', 'எப்படி'),
          options: [
            { value: '', label: bi('—', '—') },
            { value: 'red', label: bi('red', 'சிவப்பு') },
          ],
        },
      ],
    };

    expect(seedKnobs(noAdjective).adjective).toBe('');
  });

  it('writes numbers as the strings a control puts on the wire', () => {
    expect(seedKnobs(LESSON).count).toBe('1');
  });
});

/* ---- the predict step -------------------------------------- */

describe('answer', () => {
  it('records the choice and whether it was right', () => {
    store().open(LESSON);
    store().answer('inside');

    expect(store().predict).toEqual({ answered: true, chosen: 'inside', correct: true });
  });

  it('records a wrong answer as an answer', () => {
    store().open(LESSON);
    store().answer('on-top');

    expect(store().predict).toEqual({ answered: true, chosen: 'on-top', correct: false });
  });

  it('lets the first answer stand', () => {
    /* A learner who can keep choosing after the reveal has not predicted
       anything. */
    store().open(LESSON);
    store().answer('on-top');
    store().answer('inside');

    expect(store().predict.chosen).toBe('on-top');
  });

  it('ignores a choice that was never offered', () => {
    store().open(LESSON);
    store().answer('underneath');

    expect(store().predict.answered).toBe(false);
  });

  it('restarts the predict step when the lesson is left and come back to', () => {
    store().open(LESSON);
    store().answer('inside');
    store().close();
    store().open(LESSON);

    expect(store().predict).toEqual({ answered: false, chosen: null, correct: false });
  });
});
