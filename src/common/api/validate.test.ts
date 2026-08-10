import type { RawLesson, RawTopic } from 'common/api/content.types';
import {
  ContentError,
  TAMIL_CASES,
  validateLessons,
  validateProps,
  validateTopics,
  validateVerbs,
} from 'common/api/validate';
import type { Lexicon } from 'common/api/validate';

/* One broken fixture per rule. Each starts from something valid and breaks
   exactly one thing, so a failure names the rule it is about. */

const bi = (en: string, ta: string): { en: string; ta: string } => ({ en, ta });

const TOPIC: RawTopic = {
  id: 'prepositions',
  order: 5,
  title: bi('Prepositions', 'இடைச்சொல்'),
  summary: bi('Where things are.', 'பொருள்கள் எங்கே இருக்கின்றன.'),
  lessonIds: ['prep-place-in'],
};

const LEXICON: Lexicon = {
  propIds: new Set(['ball', 'box', 'chair', 'man', 'apple']),
  verbIds: new Set(['eat', 'laugh', 'remember']),
  verbs: [
    { id: 'eat', drawable: true, transitive: true },
    { id: 'laugh', drawable: true, transitive: false },
    { id: 'remember', drawable: false, transitive: true },
  ],
};

const LESSON: RawLesson = {
  id: 'prep-place-in',
  topicId: 'prepositions',
  order: 1,
  title: bi('in', 'உள்ளே'),
  idea: bi('Inside something.', 'ஒன்றின் உள்ளே.'),
  scene: {
    kind: 'place',
    figure: 'ball',
    ground: 'box',
    ground2: null,
    relation: 'in',
    determiner: 'the',
    count: 1,
    adjective: null,
  },
  knobs: [
    {
      key: 'count',
      label: bi('How many', 'எத்தனை'),
      options: [
        { value: '1', label: bi('one', 'ஒன்று') },
        { value: '2', label: bi('two', 'இரண்டு') },
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
    explain: bi('It is held by the sides.', 'பக்கங்களால் தாங்கப்படுகிறது.'),
  },
  why: bi('The box has sides.', 'பெட்டிக்குப் பக்கங்கள் உள்ளன.'),
  sentence: { en: [{ slot: 'figure' }], ta: [{ slot: 'figure', case: 'nominative' }] },
};

const withLesson = (patch: Partial<RawLesson>): readonly RawLesson[] => [{ ...LESSON, ...patch }];

const validate = (lessons: readonly RawLesson[], topics: readonly RawTopic[] = [TOPIC]): unknown =>
  validateLessons(lessons, {
    topics: validateTopics(topics),
    lexicon: LEXICON,
    file: 'lessons/prepositions-place.json',
  });

const issuesOf = (run: () => unknown): readonly string[] => {
  try {
    run();
  } catch (error) {
    if (error instanceof ContentError) return error.issues.map((i) => `${i.path} → ${i.rule}`);
    throw error;
  }
  throw new Error('expected validation to fail, and it passed');
};

describe('validate', () => {
  it('accepts content that is complete', () => {
    expect(() => validate(withLesson({}))).not.toThrow();
  });

  describe('rule 1 — Tamil is never missing or empty', () => {
    it('rejects an absent Tamil string', () => {
      const issues = issuesOf(() =>
        validate(withLesson({ why: { en: 'The box has sides.' } as RawLesson['why'] })),
      );

      expect(issues).toContain('lessons[0].why.ta → Tamil text is missing or empty');
    });

    it('rejects Tamil that is only whitespace', () => {
      const issues = issuesOf(() => validate(withLesson({ idea: bi('Inside.', '   ') })));

      expect(issues).toContain('lessons[0].idea.ta → Tamil text is missing or empty');
    });

    it('reaches the Tamil inside a knob option', () => {
      const issues = issuesOf(() =>
        validate(
          withLesson({
            knobs: [
              {
                key: 'count',
                label: bi('How many', 'எத்தனை'),
                options: [{ value: '1', label: bi('one', '') }],
              },
            ],
          }),
        ),
      );

      expect(issues).toContain('lessons[0].knobs[0].options[0].label.ta → Tamil text is missing or empty');
    });
  });

  describe('rule 2 — every prop and verb is in the lexicon', () => {
    it('rejects a figure nobody drew', () => {
      const issues = issuesOf(() =>
        validate(withLesson({ scene: { ...LESSON.scene, figure: 'rocket' } })),
      );

      expect(issues).toContain('lessons[0].scene.figure → "rocket" is not a prop in the lexicon');
    });

    it('accepts a null ground — here and there have none', () => {
      expect(() =>
        validate(
          withLesson({ scene: { ...LESSON.scene, ground: null, relation: 'here' } }),
        ),
      ).not.toThrow();
    });

    it('rejects a verb nobody drew', () => {
      const issues = issuesOf(() =>
        validate(
          withLesson({
            scene: { kind: 'actor', actor: 'ball', verb: 'juggle', patient: null },
            knobs: [],
          }),
        ),
      );

      expect(issues).toContain('lessons[0].scene.verb → "juggle" is not a verb in the lexicon');
    });

    /* Engine 14's answer to open question 2: a verb with no drawable action is
       carried in the lexicon with its words and refused here, so an author
       finds out by file and path rather than by a blank stage. */
    it('rejects a scene built on a verb with no drawable action', () => {
      const issues = issuesOf(() =>
        validate(
          withLesson({
            scene: { kind: 'actor', actor: 'man', verb: 'remember', patient: 'apple' },
            knobs: [],
          }),
        ),
      );

      expect(issues).toContain(
        'lessons[0].scene.verb → "remember" has no drawable action, so no scene can be built on it',
      );
    });

    it('rejects a patient given to an intransitive verb', () => {
      const issues = issuesOf(() =>
        validate(
          withLesson({
            scene: { kind: 'actor', actor: 'man', verb: 'laugh', patient: 'apple' },
            knobs: [],
          }),
        ),
      );

      expect(issues).toContain('lessons[0].scene.patient → "laugh" takes no patient');
    });

    it('accepts an intransitive verb with no patient', () => {
      expect(() =>
        validate(
          withLesson({
            scene: { kind: 'actor', actor: 'man', verb: 'laugh', patient: null },
            knobs: [],
          }),
        ),
      ).not.toThrow();
    });

    it('rejects a scene kind that has no renderer', () => {
      const issues = issuesOf(() =>
        validate(withLesson({ scene: { kind: 'sculpture' }, knobs: [] })),
      );

      expect(issues[0]).toContain('scene kind must be one of place, path, timeline, actor, relation');
    });
  });

  describe('rule 3 — a knob the scene cannot accept', () => {
    it('rejects a knob no renderer of that kind reads', () => {
      const issues = issuesOf(() =>
        validate(
          withLesson({
            knobs: [
              {
                key: 'tense',
                label: bi('When', 'எப்போது'),
                options: [{ value: 'past-simple', label: bi('past', 'இறந்த காலம்') }],
              },
            ],
          }),
        ),
      );

      expect(issues).toContain('lessons[0].knobs.tense → the place scene cannot accept "tense"');
    });

    it('rejects a knob with no options, which cannot be moved', () => {
      const issues = issuesOf(() =>
        validate(withLesson({ knobs: [{ key: 'count', label: bi('How many', 'எத்தனை'), options: [] }] })),
      );

      expect(issues).toContain('lessons[0].knobs.count → a knob with no options cannot be moved');
    });

    it('rejects a duplicated option value, one of which could never be chosen', () => {
      const issues = issuesOf(() =>
        validate(
          withLesson({
            knobs: [
              {
                key: 'count',
                label: bi('How many', 'எத்தனை'),
                options: [
                  { value: '1', label: bi('one', 'ஒன்று') },
                  { value: '1', label: bi('one again', 'மீண்டும் ஒன்று') },
                ],
              },
            ],
          }),
        ),
      );

      expect(issues.join('\n')).toContain('duplicate option value "1"');
    });
  });

  describe('rule 4 — predict.answer is one of its own options', () => {
    it('rejects an answer that was never offered', () => {
      const issues = issuesOf(() =>
        validate(
          withLesson({ predict: { ...(LESSON.predict as NonNullable<RawLesson['predict']>), answer: 'beside' } }),
        ),
      );

      expect(issues).toContain('lessons[0].predict.answer → "beside" is not one of the options offered');
    });

    it('accepts a lesson with no predict step at all', () => {
      expect(() => validate(withLesson({ predict: null }))).not.toThrow();
    });
  });

  describe('rule 5 — the lesson belongs to a topic that exists', () => {
    it('rejects a lesson whose topic was never written', () => {
      const issues = issuesOf(() => validate(withLesson({ topicId: 'punctuation' })));

      expect(issues).toContain('lessons[0].topicId → "punctuation" is not a topic in topics.json');
    });
  });

  describe('rule 6 — no duplicate ids', () => {
    it('rejects two lessons with the same id', () => {
      const issues = issuesOf(() => validate([LESSON, { ...LESSON, order: 2 }]));

      expect(issues).toContain('lessons[1].id → duplicate lesson id "prep-place-in"');
    });

    it('rejects two topics with the same id', () => {
      const issues = issuesOf(() => validateTopics([TOPIC, { ...TOPIC, order: 6 }]));

      expect(issues).toContain('topics[1].id → duplicate topic id "prepositions"');
    });
  });

  describe('the error itself', () => {
    it('names the file, the path and the rule', () => {
      try {
        validate(withLesson({ topicId: 'punctuation' }));
        throw new Error('expected a failure');
      } catch (error) {
        expect(error).toBeInstanceOf(ContentError);
        const issue = (error as ContentError).issues[0];
        expect(issue?.file).toBe('lessons/prepositions-place.json');
        expect((error as ContentError).message).toContain('lessons/prepositions-place.json');
      }
    });

    it('collects every problem rather than stopping at the first', () => {
      const issues = issuesOf(() =>
        validate(withLesson({ topicId: 'punctuation', why: bi('why', '') })),
      );

      expect(issues.length).toBeGreaterThan(1);
    });

    it('rejects a lesson file with nothing in it', () => {
      const issues = issuesOf(() => validate([]));

      expect(issues[0]).toContain('a lesson file with no lessons in it');
    });
  });

  describe('the lexicon', () => {
    const prop = (id: string, ta: Partial<Record<string, string>> = {}): unknown => ({
      id,
      word: {
        en: { singular: id, plural: `${id}s` },
        ta: { nominative: 'x', accusative: 'x', dative: 'x', locative: 'x', ablative: 'x', ...ta },
      },
    });

    it('accepts props that decline in all five cases', () => {
      expect(() => validateProps([prop('ball'), prop('box')])).not.toThrow();
      expect(TAMIL_CASES).toHaveLength(5);
    });

    it('rejects a prop missing a case', () => {
      const issues = issuesOf(() => validateProps([prop('ball', { ablative: '' })]));

      expect(issues).toContain('props[0].word.ta.ablative → "ball" is missing its ablative');
    });

    it('rejects duplicate prop ids', () => {
      const issues = issuesOf(() => validateProps([prop('ball'), prop('ball')]));

      expect(issues).toContain('props[1].id → duplicate prop id "ball"');
    });

    const verb = (over: Record<string, unknown> = {}): unknown => ({
      id: 'eat',
      ta: 'சாப்பிடு',
      drawable: true,
      anchor: 'mouth',
      cue: 'chomp',
      transitive: true,
      ...over,
    });

    it('rejects a verb with no Tamil', () => {
      const issues = issuesOf(() => validateVerbs([verb({ ta: '  ' })]));

      expect(issues).toContain('verbs[0].ta → "eat" is missing its Tamil');
    });

    it('accepts a drawable verb with an anchor and a cue, and an undrawable one with neither', () => {
      expect(() =>
        validateVerbs([
          verb(),
          verb({ id: 'remember', drawable: false, anchor: null, cue: null }),
        ]),
      ).not.toThrow();
    });

    it('rejects a drawable verb that names no anchor', () => {
      const issues = issuesOf(() => validateVerbs([verb({ anchor: 'elbow' })]));

      expect(issues).toContain(
        'verbs[0].anchor → "eat" is drawable and must name one of mouth, hand, foot, eye',
      );
    });

    it('rejects a drawable verb that names no cue', () => {
      const issues = issuesOf(() => validateVerbs([verb({ cue: null })]));

      expect(issues).toContain(
        'verbs[0].cue → "eat" is drawable and must name one of chomp, gaze, arc, impact',
      );
    });

    it('rejects an undrawable verb that still carries a drawing', () => {
      const issues = issuesOf(() => validateVerbs([verb({ drawable: false, cue: null })]));

      expect(issues).toContain(
        'verbs[0].drawable → "eat" cannot be drawn, so it has no anchor and no cue',
      );
    });

    it('rejects a verb that does not say whether it can be drawn', () => {
      const issues = issuesOf(() => validateVerbs([verb({ drawable: undefined })]));

      expect(issues).toContain('verbs[0].drawable → "eat" must say whether it can be drawn');
    });
  });
});
