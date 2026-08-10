import { propFor } from 'common/scene/props/index';
import { actorProblem, renderActor, verbFor } from 'common/scene/renderers/actor.renderer';
import { pathProblem, renderPath } from 'common/scene/renderers/path.renderer';
import { placeProblem, renderPlace } from 'common/scene/renderers/place.renderer';
import { RELATIONS, relationProblem, renderRelation } from 'common/scene/renderers/relation.renderer';
import { renderTimeline, timelineProblem } from 'common/scene/renderers/timeline.renderer';
import { articleFor } from 'common/scene/sentence';
import { assertNever } from 'common/utils/assertNever';
import { placeIn } from 'common/utils/tamil';
import type {
  ActorSpec,
  Connective,
  LandmarkKind,
  PathRelation,
  PathSpec,
  PlaceSpec,
  Prop,
  PropId,
  RelationSpec,
  SceneNode,
  SceneSpec,
  TenseId,
  TimeRelation,
  TimelineSpec,
  VerbId,
} from 'common/scene/types';

/* ============================================================
   registry.ts — one way in.

   Five renderers, one function. The switch ends in
   `assertNever`, so a sixth arm added to `SceneSpec` without a
   renderer is a compile error rather than a lesson that draws
   nothing — which is the whole point of the file.

   It also carries the descriptions. A scene a screen reader
   cannot describe is an incomplete scene (architecture §11.1),
   and the description is the same dispatch: five kinds, both
   languages, one switch that cannot be left short.
   ============================================================ */

/**
 * A scene, as a node tree.
 *
 * Every renderer returns nothing for a spec it refuses, so an empty array here
 * means "this spec cannot be drawn" and `sceneProblem` says why. It is not an
 * error: `<CannotDraw>` is a state of this product, not a failure of it.
 */
export function renderScene(spec: SceneSpec): readonly SceneNode[] {
  switch (spec.kind) {
    case 'place':
      return renderPlace(spec);
    case 'path':
      return renderPath(spec);
    case 'timeline':
      return renderTimeline(spec);
    case 'actor':
      return renderActor(spec);
    case 'relation':
      return renderRelation(spec);
    default:
      return assertNever(spec, 'scene kind');
  }
}

/** Why this scene cannot be drawn, or null when it can. */
export function sceneProblem(spec: SceneSpec): string | null {
  switch (spec.kind) {
    case 'place':
      return placeProblem(spec);
    case 'path':
      return pathProblem(spec);
    case 'timeline':
      return timelineProblem(spec);
    case 'actor':
      return actorProblem(spec);
    case 'relation':
      return relationProblem(spec);
    default:
      return assertNever(spec, 'scene kind');
  }
}

/* ---- the words a description needs -------------------------
   Not content: content is what a lesson teaches, and none of
   this is ever taught. It is the vocabulary the pictures have to
   be spoken in, and it lives here for the same reason a prop's
   word lives in the prop library — the scene engine may not read
   `content/`, and a scene nobody can describe is unfinished.

   The Tamil is the source notes' own, from the preposition
   tables, except where a form has to be declined.
   ------------------------------------------------------------ */

/** A landmark is not a prop, so it carries its own three forms. Declined here
 *  rather than assembled from an ending: Tamil case endings change the stem,
 *  and *கட்டிடம் + க்கு* is not a word. */
type LandmarkWord = {
  readonly en: string;
  readonly ta: string;
  readonly dative: string;
  readonly ablative: string;
};

const LANDMARK_WORDS: Readonly<Record<LandmarkKind, LandmarkWord>> = {
  building: { en: 'building', ta: 'கட்டிடம்', dative: 'கட்டிடத்திற்கு', ablative: 'கட்டிடத்திலிருந்து' },
  container: { en: 'box', ta: 'பெட்டி', dative: 'பெட்டிக்கு', ablative: 'பெட்டியிலிருந்து' },
  road: { en: 'road', ta: 'சாலை', dative: 'சாலைக்கு', ablative: 'சாலையிலிருந்து' },
  river: { en: 'river', ta: 'ஆறு', dative: 'ஆற்றுக்கு', ablative: 'ஆற்றிலிருந்து' },
  city: { en: 'city', ta: 'நகரம்', dative: 'நகரத்திற்கு', ablative: 'நகரத்திலிருந்து' },
};

type PathTamil = { readonly form: 'ta' | 'dative' | 'ablative'; readonly after: string };

const PATH_TA: Readonly<Record<PathRelation, PathTamil>> = {
  to: { form: 'dative', after: '' },
  into: { form: 'dative', after: 'உள்ளே' },
  towards: { form: 'ta', after: 'நோக்கி' },
  along: { form: 'ta', after: 'ஓரமாக' },
  across: { form: 'ta', after: 'கடந்து' },
  over: { form: 'ta', after: 'மேலாக' },
  past: { form: 'ta', after: 'கடந்து' },
  from: { form: 'ablative', after: '' },
};

const TENSE_TA: Readonly<Record<TenseId, string>> = {
  'present-simple': 'நிகழ்காலம்',
  'present-continuous': 'நிகழ்காலத் தொடர்',
  'present-perfect': 'நிகழ்கால நிறைவு',
  'present-perfect-continuous': 'நிகழ்கால நிறைவுத் தொடர்',
  'past-simple': 'இறந்த காலம்',
  'past-continuous': 'இறந்தகாலத் தொடர்',
  'past-perfect': 'இறந்தகால நிறைவு',
  'past-perfect-continuous': 'இறந்தகால நிறைவுத் தொடர்',
  'future-simple': 'எதிர்காலம்',
  'future-continuous': 'எதிர்காலத் தொடர்',
  'future-perfect': 'எதிர்கால நிறைவு',
  'future-perfect-continuous': 'எதிர்கால நிறைவுத் தொடர்',
};

const TIME_TA: Readonly<Record<TimeRelation, string>> = {
  in: 'இல்',
  on: 'அன்று',
  at: 'மணிக்கு',
  before: 'முன்பு',
  after: 'பிறகு',
  by: 'அதற்குள்',
  since: 'முதல்',
  during: 'போது',
  until: 'வரை',
};

/** The five that join two clauses take the middle; the six that mark a role
 *  follow the thing they mark, because Tamil puts them last. */
const CONJUNCTIONS: ReadonlySet<Connective> = new Set<Connective>([
  'and', 'but', 'or', 'because', 'so',
]);

/* ---- describing -------------------------------------------- */

/** What a scene says, in both languages. Not `Bilingual`: that type is minted
 *  by `validate.ts` out of checked content, and this is assembled here. */
export type SceneDescription = { readonly en: string; readonly ta: string };

const words = (...parts: readonly string[]): string =>
  parts.filter((part) => part.trim().length > 0).join(' ').replace(/\s+/g, ' ').trim();

const propOr = (id: PropId | null): Prop | undefined => propFor(id);

/** "a ball", "two balls", "a red ball", "an apple". The article follows the
 *  sound of the word after it, by the same rule the sentence builder uses —
 *  the app teaches that rule in the articles topic, so a description breaking
 *  it would be the product contradicting itself out loud. */
function noun(prop: Prop, count = 1, adjective: string | null = null, determiner = 'a'): string {
  const NUMBERS: readonly string[] = ['', 'a', 'two', 'three'];
  const head = count === 1 ? prop.word.en.singular : prop.word.en.plural;
  const article = determiner === 'a' ? articleFor(adjective ?? head) : determiner;

  return words(count === 1 ? article : (NUMBERS[count] ?? String(count)), adjective ?? '', head);
}

function describePlace(spec: PlaceSpec): SceneDescription {
  const figure = propOr(spec.figure);
  if (!figure) return { en: 'a picture that cannot be drawn', ta: 'வரைய முடியாத படம்' };

  const ground = propOr(spec.ground);
  const ground2 = propOr(spec.ground2);
  const ta = placeIn(spec.relation);

  const en = words(
    noun(figure, spec.count, spec.adjective, spec.determiner),
    spec.relation,
    ground ? `the ${ground.word.en.singular}` : '',
    ground2 ? `and the ${ground2.word.en.singular}` : '',
  );

  const declined = (prop: Prop | undefined): string =>
    !prop || ta.case === null ? '' : prop.word.ta[ta.case];

  return {
    en,
    ta: words(declined(ground), declined(ground2), ta.after, figure.word.ta.nominative),
  };
}

function describePath(spec: PathSpec): SceneDescription {
  const mover = propOr(spec.mover);
  if (!mover) return { en: 'a picture that cannot be drawn', ta: 'வரைய முடியாத படம்' };

  const landmark = LANDMARK_WORDS[spec.landmark];
  const ta = PATH_TA[spec.relation];

  return {
    en: words('a', mover.word.en.singular, 'moving', spec.relation, `the ${landmark.en}`),
    ta: words(landmark[ta.form], ta.after, mover.word.ta.nominative),
  };
}

function describeTimeline(spec: TimelineSpec): SceneDescription {
  const marks = spec.marks.filter((mark) => mark.label !== null);
  const marked = marks.map((mark) => String(mark.label?.en)).join(', ');
  const markedTa = marks.map((mark) => String(mark.label?.ta)).join(', ');
  const relation = spec.relation;

  return {
    en: words(
      'a timeline:',
      spec.tense.replace(/-/g, ' '),
      relation ? `with "${relation}"` : '',
      marked ? `marking ${marked}` : '',
    ),
    ta: words(
      'கால நேர்கோடு:',
      TENSE_TA[spec.tense],
      relation ? `"${TIME_TA[relation]}"` : '',
      markedTa,
    ),
  };
}

function describeActor(spec: ActorSpec): SceneDescription {
  const actor = propOr(spec.actor);
  const said = saidFor(spec.verb);
  if (!actor || !said) return { en: 'a picture that cannot be drawn', ta: 'வரைய முடியாத படம்' };

  const patient = propOr(spec.patient);
  const about = spec.voice === 'passive' ? patient : actor;

  const en = words(
    noun(actor, 1, null, 'a'),
    spec.negated ? `not ${said.en}` : said.en,
    patient ? noun(patient) : '',
    spec.mood === 'question' ? '— a question' : '',
    spec.mood === 'imperative' ? '— an order' : '',
    about ? `— the sentence is about the ${about.word.en.singular}` : '',
  );

  /* ஆப்பிளை சாப்பிடும் மனிதன் — the patient in the accusative, the verb as an
     adjectival participle, the actor last. Negation is marked rather than
     conjugated: a description is not a sentence the learner is being taught. */
  const ta = words(
    patient ? patient.word.ta.accusative : '',
    said.ta,
    actor.word.ta.nominative,
    spec.negated ? '(இல்லை)' : '',
    spec.mood === 'question' ? '(கேள்வி)' : '',
    spec.mood === 'imperative' ? '(கட்டளை)' : '',
  );

  return { en, ta };
}

/** The verb as it is spoken *about* rather than used: the English participle
 *  and the Tamil adjectival participle, which is what lets the description be
 *  a phrase — ஆப்பிளை சாப்பிடும் மனிதன் — instead of a list of words. Both
 *  forms are on the verb itself; nothing is kept here. */
const saidFor = (verb: VerbId | string): { readonly en: string; readonly ta: string } | undefined => {
  const drawn = verbFor(verb);
  return drawn ? { en: drawn.word.en.ing, ta: drawn.word.ta.adjectival } : undefined;
};

function describeRelation(spec: RelationSpec): SceneDescription {
  const left = propOr(spec.left);
  const right = propOr(spec.right);
  if (!left || !right) return { en: 'a picture that cannot be drawn', ta: 'வரைய முடியாத படம்' };

  const word = RELATIONS[spec.connective].word;
  const joins = CONJUNCTIONS.has(spec.connective);

  return {
    en: words(noun(left), word.en, noun(right)),
    /* A conjunction sits between the two; a role marker follows the thing it
       marks, and in Tamil that puts it before the head noun. */
    ta: joins
      ? words(left.word.ta.nominative, word.ta, right.word.ta.nominative)
      : words(right.word.ta.accusative, word.ta, left.word.ta.nominative),
  };
}

/**
 * What the picture shows, in both languages.
 *
 * English goes on the `aria-label` and Tamil into a hidden line beside it, so
 * a scene is available to a screen reader in either language rather than in
 * neither.
 */
export function describeScene(spec: SceneSpec): SceneDescription {
  switch (spec.kind) {
    case 'place':
      return describePlace(spec);
    case 'path':
      return describePath(spec);
    case 'timeline':
      return describeTimeline(spec);
    case 'actor':
      return describeActor(spec);
    case 'relation':
      return describeRelation(spec);
    default:
      return assertNever(spec, 'scene kind');
  }
}
