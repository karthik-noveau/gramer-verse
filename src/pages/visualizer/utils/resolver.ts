import { PLACE_ADJECTIVES, placeAllows } from 'common/scene/renderers/place.renderer';
import { ACTOR_VERBS } from 'common/scene/renderers/actor.renderer';
import { PROPS, propFor } from 'common/scene/props/index';
import type { Determiner, FigureCount, PlaceRelation, PlaceSpec, PropId } from 'common/scene/types';

/* ============================================================
   resolver.ts — a typed sentence to a picture, or an honest
   account of why not.

   A lexicon lookup, not a parser. There is no NLP library in
   this product and none is needed: the scene has six fields, and
   every one of them is a word the app already draws. Anything
   else is either a word nobody drew or a hole in the sentence,
   and those are two different problems that used to be reported
   as one list.
   ============================================================ */

/** Words that carry no part of the picture. Dropped rather than reported: a
 *  learner told that "very" is not in the drawing library learns nothing, and
 *  the real problem — a word that *should* have been drawable — is buried. */
const STOP: ReadonlySet<string> = new Set([
  'is', 'are', 'was', 'were', 'be', 'been', 'am',
  'and', 'of', 'to', 'it', 'its', 'there', 'here', 'this', 'that',
  'very', 'quite', 'really', 'just', 'so', 'now',
]);

const NUMBERS: Readonly<Record<string, FigureCount>> = { one: 1, two: 2, three: 3 };

/** The relations, longest first, so *in front of* is matched before *in*. The
 *  prototype dropped `front` and `of` as stop words and matched the `in`,
 *  which drew a ball inside the box for a sentence that said it was in front
 *  of it. */
const RELATIONS: readonly PlaceRelation[] = [
  'in front of', 'in', 'on', 'at', 'under', 'above', 'below',
  'behind', 'between', 'near', 'beside', 'here', 'there',
];

const RELATION_WORDS: readonly (readonly string[])[] = RELATIONS.map((relation) =>
  relation.split(' '),
);

export type ResolveOptions = {
  /** What the lexicon knows about verbs, so an action can be named as an
   *  action. Engine 14's decision is that an undrawable verb is refused by
   *  name; without this the resolver could only call it an unknown word. */
  readonly verbs?: readonly { readonly id: string; readonly drawable: boolean }[];
};

export type Resolved =
  | { readonly status: 'empty' }
  | {
      readonly status: 'drawn';
      readonly spec: PlaceSpec;
      /** The sentence as the resolver read it, which is not always the
       *  sentence that was typed — it is what the picture is of. */
      readonly sentence: string;
    }
  | {
      readonly status: 'cannot';
      /** Words nobody drew, each named. */
      readonly unknown: readonly string[];
      /** What the sentence left out. A different problem from an unknown word,
       *  and reported apart from it. */
      readonly gaps: readonly string[];
      /** An action, where one was named. The visualizer draws where things
       *  are; what they do is a lesson, and an undrawable verb is not either. */
      readonly verb: { readonly word: string; readonly drawable: boolean } | null;
      /** Always offered, and always drawable. */
      readonly suggestion: string;
    };

/* ---- reading the words ------------------------------------- */

export const tokenize = (text: string): readonly string[] =>
  text
    .toLowerCase()
    .replace(/[.,!?;:"']/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0);

const singular = (word: string): string => (word.endsWith('s') ? word.slice(0, -1) : word);

const isProp = (word: string): boolean => propFor(word) !== undefined;

const isAdjective = (word: string): boolean =>
  Object.prototype.hasOwnProperty.call(PLACE_ADJECTIVES, word);

/**
 * Which a word is, when it could be either.
 *
 * `orange` is both a colour and a fruit, and English tells them apart by
 * position: an adjective has a noun after it. No word in this lexicon is
 * currently both — a test asserts that — but the rule is here rather than the
 * assumption, because the first ambiguous prop added would otherwise resolve
 * silently as whichever branch happened to run first.
 */
export function readsAs(
  word: string,
  rest: readonly string[],
): 'adjective' | 'prop' | 'either' | 'neither' {
  const adjective = isAdjective(word);
  const prop = isProp(word) || isProp(singular(word));
  if (adjective && !prop) return 'adjective';
  if (prop && !adjective) return 'prop';
  if (!adjective && !prop) return 'neither';

  /* Both. An adjective is followed by the thing it describes. */
  return rest.some((next) => isProp(next) || isProp(singular(next))) ? 'adjective' : 'prop';
}

/* ---- resolving --------------------------------------------- */

type Draft = {
  determiner: Determiner;
  count: FigureCount;
  adjective: string | null;
  figure: PropId | null;
  relation: PlaceRelation | null;
  grounds: PropId[];
};

/** The relation starting at this position, and how many words it took. */
function relationAt(words: readonly string[], index: number): { relation: PlaceRelation; length: number } | null {
  for (let candidate = 0; candidate < RELATION_WORDS.length; candidate += 1) {
    const phrase = RELATION_WORDS[candidate];
    const relation = RELATIONS[candidate];
    if (!phrase || !relation) continue;
    if (phrase.every((part, offset) => words[index + offset] === part)) {
      return { relation, length: phrase.length };
    }
  }
  return null;
}

export function resolve(text: string, options: ResolveOptions = {}): Resolved {
  const words = tokenize(text);
  if (words.length === 0) return { status: 'empty' };

  const draft: Draft = {
    determiner: 'the',
    count: 1,
    adjective: null,
    figure: null,
    relation: null,
    grounds: [],
  };
  const unknown: string[] = [];
  let verb: { word: string; drawable: boolean } | null = null;

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    if (word === undefined) continue;

    /* Longest first, and before anything else: `in front of` is three words
       and two of them mean something else on their own. */
    const phrase = relationAt(words, index);
    if (phrase) {
      draft.relation = phrase.relation;
      index += phrase.length - 1;
      continue;
    }

    /* The article belongs to the thing being placed. "A ball is on the table"
       has two of them, and the second is the table's — read as the figure's it
       would turn every indefinite sentence definite. */
    if (word === 'a' || word === 'an' || word === 'the') {
      if (draft.figure === null) draft.determiner = word === 'the' ? 'the' : 'a';
      continue;
    }
    if (NUMBERS[word] !== undefined) {
      draft.count = NUMBERS[word] as FigureCount;
      continue;
    }

    const reads = readsAs(word, words.slice(index + 1));
    if (reads === 'adjective') {
      draft.adjective = word;
      continue;
    }
    if (reads === 'prop') {
      /* A plural raises the count and resolves the singular: "three cups" and
         "cups" are both a cup, drawn more than once. */
      const root = isProp(word) ? word : singular(word);
      if (root !== word) draft.count = Math.max(draft.count, 2) as FigureCount;

      /* Before the relation it is what is being placed; after it, what it is
         being placed against. "Between the table and the box" names two. */
      if (draft.relation === null && draft.figure === null) draft.figure = root as PropId;
      else draft.grounds.push(root as PropId);
      continue;
    }

    const known = knownVerb(word, options.verbs);
    if (known) {
      verb = known;
      continue;
    }

    if (STOP.has(word)) continue;
    unknown.push(word);
  }

  /* Structural gaps: what the sentence left out. Kept apart from the unknown
     words, because "rocket, and nowhere to put it" reported as one list is two
     different problems wearing one label. */
  const gaps: string[] = [];
  const free = draft.relation === 'here' || draft.relation === 'there';
  if (!draft.figure) gaps.push('nothing to place');
  if (!free && draft.grounds.length === 0) gaps.push('nowhere to put it');
  if (draft.relation === 'between' && draft.grounds.length < 2) {
    gaps.push('only one thing to be between');
  }

  const spec = specOf(draft);

  if (unknown.length > 0 || gaps.length > 0 || verb !== null || spec === null) {
    return {
      status: 'cannot',
      unknown,
      gaps,
      verb,
      suggestion: suggest(draft),
    };
  }

  return { status: 'drawn', spec, sentence: said(spec) };
}

/**
 * A verb the lexicon knows, in any of its forms.
 *
 * "Eats" is `eat`, and a sentence is far more likely to carry the inflected
 * form than the root. Drawable or not it is an action, and a sentence about
 * where something is is not one — so it is named as a verb rather than
 * reported as a word nobody drew.
 */
function knownVerb(
  word: string,
  verbs: ResolveOptions['verbs'],
): { word: string; drawable: boolean } | null {
  const root = singular(word);
  const listed = verbs?.find((entry) => entry.id === word || entry.id === root);
  if (listed) return { word, drawable: listed.drawable };

  for (const [id, verb] of Object.entries(ACTOR_VERBS)) {
    const forms = [id, verb.word.en.base, verb.word.en.third, verb.word.en.past, verb.word.en.ing];
    if (forms.includes(word)) return { word, drawable: true };
  }
  return null;
}

/** The spec, when the draft is complete enough to draw and the renderer will
 *  take it. Null otherwise — a relation its ground cannot hold is not a
 *  picture, and this is where that is found. */
function specOf(draft: Draft): PlaceSpec | null {
  const free = draft.relation === 'here' || draft.relation === 'there';
  if (!draft.figure) return null;
  if (!free && draft.grounds.length === 0) return null;

  const spec: PlaceSpec = {
    kind: 'place',
    figure: draft.figure,
    ground: free ? null : (draft.grounds[0] ?? null),
    ground2: draft.grounds[1] ?? null,
    /* No preposition at all is `on`: the commonest one, and the one the
       prototype fell back to. A sentence with two nouns and no relation is
       still a sentence somebody meant something by. */
    relation: draft.relation ?? 'on',
    determiner: draft.determiner,
    count: draft.count,
    adjective: draft.adjective,
  };

  return placeAllows(spec.relation, spec.ground, spec.ground2) ? spec : null;
}

/** The sentence as the resolver read it. Not the one that was typed: what is
 *  shown under the picture has to be what the picture is of. */
export function said(spec: PlaceSpec): string {
  const figure = propFor(spec.figure);
  const ground = propFor(spec.ground);
  const ground2 = propFor(spec.ground2);
  const NUMBER_WORDS: readonly string[] = ['', 'one', 'two', 'three'];

  const head =
    spec.count > 1
      ? `${NUMBER_WORDS[spec.count] ?? spec.count} ${figure?.word.en.plural ?? ''}`
      : `${spec.determiner} ${spec.adjective ? `${spec.adjective} ` : ''}${figure?.word.en.singular ?? ''}`;

  const tail = ground
    ? ` the ${ground.word.en.singular}${ground2 ? ` and the ${ground2.word.en.singular}` : ''}`
    : '';

  return `${head} ${spec.count > 1 ? 'are' : 'is'} ${spec.relation}${tail}`.replace(/\s+/g, ' ').trim();
}

/**
 * A sentence this app can draw, as close to what was typed as possible.
 *
 * Always offered, and always drawable: it keeps whatever resolved and fills in
 * the rest from the library. Offering something the picker itself would grey
 * out — *the ball is in the table* — would be suggesting the one thing that
 * cannot happen.
 */
export function suggest(draft: Draft): string {
  const figure = draft.figure ?? ('ball' as PropId);
  const relation = draft.relation ?? 'on';
  const free = relation === 'here' || relation === 'there';

  if (free) return `the ${propFor(figure)?.word.en.singular ?? 'ball'} is ${relation}`;

  /* `between` needs two grounds before either of them is allowed, so the
     second is chosen first and the pair is checked together. */
  const second =
    relation === 'between'
      ? (draft.grounds[1] ?? (Object.keys(PROPS)[0] as PropId | undefined))
      : undefined;

  const wanted = draft.grounds[0];
  const ground =
    wanted && placeAllows(relation, wanted, second ?? null)
      ? wanted
      : (Object.keys(PROPS).find(
          (id) => id !== String(second) && placeAllows(relation, id, second ?? null),
        ) as PropId | undefined);

  return said({
    kind: 'place',
    figure,
    ground: ground ?? null,
    ground2: second ?? null,
    relation,
    determiner: 'the',
    count: 1,
    adjective: null,
  });
}
