/* ============================================================
   types.test-d.ts — type-level tests. Nothing here runs; `tsc`
   is the assertion.

   The negative cases use @ts-expect-error, which fails the build
   if the error it expects does NOT happen. That is what makes
   "a missing switch arm is a compile error" a checked claim
   rather than a hope.

   Not named *.test.ts on purpose: Jest would try to run it, and
   there is nothing to run.
   ============================================================ */
import type {
  RawBilingual,
  RawKnob,
  RawLesson,
  RawPredict,
  RawTopic,
} from 'common/api/content.types';
import type {
  Bilingual,
  Knob,
  Lesson,
  LessonId,
  NonEmptyString,
  Predict,
  PropId,
  SceneSpec,
  TamilCase,
  Topic,
  TopicId,
} from 'common/scene/types';
import { assertNever } from 'common/utils/assertNever';

/* ---- branded ids are not interchangeable ------------------- */
const topicId = 'prepositions' as TopicId;
const lessonId = 'in' as LessonId;

const takesTopic = (_id: TopicId): void => undefined;
const takesLesson = (_id: LessonId): void => undefined;

takesTopic(topicId);
takesLesson(lessonId);

// @ts-expect-error a LessonId is not a TopicId
takesTopic(lessonId);

// @ts-expect-error a TopicId is not a LessonId
takesLesson(topicId);

// @ts-expect-error a bare string is neither
takesTopic('prepositions');

/* ---- Tamil cannot be forgotten or left empty --------------- */
const words: Bilingual = {
  en: 'the box' as NonEmptyString,
  ta: 'பெட்டி' as NonEmptyString,
};
void words;

// @ts-expect-error ta is required — it is not an optional extra
const missingTamil: Bilingual = { en: 'the box' as NonEmptyString };
void missingTamil;

// @ts-expect-error a plain string has not been checked for emptiness
const uncheckedTamil: Bilingual = { en: 'the box' as NonEmptyString, ta: 'பெட்டி' };
void uncheckedTamil;

/* ---- the five arms, and only the five ---------------------- */
export const describeScene = (spec: SceneSpec): string => {
  switch (spec.kind) {
    case 'place':
      return `${spec.relation} the ${spec.ground}`;
    case 'path':
      return spec.arrives ? 'arrives' : 'does not arrive';
    case 'timeline':
      return spec.tense;
    case 'actor':
      return spec.voice;
    case 'relation':
      return spec.connective;
    default:
      return assertNever(spec, 'scene kind');
  }
};

export const missesAnArm = (spec: SceneSpec): string => {
  switch (spec.kind) {
    case 'place':
      return 'place';
    case 'path':
      return 'path';
    case 'timeline':
      return 'timeline';
    case 'actor':
      return 'actor';
    /* `relation` is deliberately absent. */
    default:
      // @ts-expect-error a scene kind that is not handled must not compile
      return assertNever(spec, 'scene kind');
  }
};

/* ---- a spec carries only what its own renderer needs ------- */
export const placeOnly = (spec: SceneSpec): void => {
  if (spec.kind !== 'place') return;
  void spec.figure;
  // @ts-expect-error `tense` belongs to the timeline scene, not to this one
  void spec.tense;
};

/* ---- the Tamil cases are the five the props decline for ---- */
const cases: readonly TamilCase[] = [
  'nominative',
  'accusative',
  'dative',
  'locative',
  'ablative',
];
void cases;

// @ts-expect-error Tamil has no vocative in this model
const notACase: TamilCase = 'vocative';
void notACase;

/* ---- ids are strings underneath, and stay separate --------- */
const props: readonly PropId[] = ['ball' as PropId, 'box' as PropId];
void props;

/* ---- the raw shapes and the checked ones stay in step ------
   `content.types.ts` describes the JSON as authored and
   `types.ts` describes it after validation. They are allowed to
   differ in what they guarantee, and not in what they contain: a
   field added to one and forgotten in the other is content that
   loads and then cannot be read. */
type SameKeys<A, B> = [keyof A] extends [keyof B]
  ? [keyof B] extends [keyof A]
    ? true
    : false
  : false;

const lessonFieldsMatch: SameKeys<RawLesson, Lesson> = true;
const topicFieldsMatch: SameKeys<RawTopic, Topic> = true;
const predictFieldsMatch: SameKeys<RawPredict, Predict> = true;
const knobFieldsMatch: SameKeys<RawKnob, Knob> = true;
const bilingualFieldsMatch: SameKeys<RawBilingual, Bilingual> = true;
void [
  lessonFieldsMatch,
  topicFieldsMatch,
  predictFieldsMatch,
  knobFieldsMatch,
  bilingualFieldsMatch,
];

/* And they are not the same type: raw Tamil is any string, which
   is the whole reason validate.ts exists. */
const rawWords: RawBilingual = { en: 'the box', ta: '' };
// @ts-expect-error unchecked content cannot stand in for checked content
const checked: Bilingual = rawWords;
void checked;
