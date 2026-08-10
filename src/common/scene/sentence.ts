import { propFor } from 'common/scene/props/index';
import { verbFor } from 'common/scene/renderers/actor.renderer';
import type {
  ActorSpec,
  PlaceSpec,
  Prop,
  PropId,
  SceneSpec,
  SentenceSlot,
  SentenceTemplates,
  TamilCase,
} from 'common/scene/types';
import {
  ADJECTIVE_TA,
  DETERMINER_TA,
  NUMBER_TA,
  beTa,
  placeIn,
  pluralOf,
} from 'common/utils/tamil';

/* ============================================================
   sentence.ts — the two lines under the picture.

   Built separately, never translated. English puts a word
   between the figure and the ground; Tamil puts an ending on the
   ground and the verb at the end. A slot-by-slot mapping of one
   onto the other produces sentences that are individually
   plausible and wrong the moment a knob moves — which is the
   failure this engine exists to prevent, and the reason it is an
   engine of its own.

   The order comes from the lesson, which carries a template per
   language; the words come from the scene. Ported from
   `ui-prototypes/assets/js/scene.js`, where the place sentence
   was checked in both languages against every preposition.
   ============================================================ */

/**
 * One word, and the knob that produced it.
 *
 * A token rather than a string, so engine 19 can flash the word that changed —
 * in both lines at once, which is the whole trick: a learner sees `in` become
 * `on` in one line and `-இல்` stay put in the other.
 *
 * `knob` is null for the words no knob owns: `the`, `is`, a full stop.
 */
export type Token = {
  readonly text: string;
  readonly knob: string | null;
};

export type Sentence = {
  readonly en: readonly Token[];
  readonly ta: readonly Token[];
};

/**
 * Tokens as text.
 *
 * With real spaces in it. A sentence spaced by CSS alone is one unbroken word
 * to a screen reader and to anything that reads `textContent` — found in the
 * prototype, fixed there, and kept fixed by a test here.
 */
export const sentenceText = (tokens: readonly Token[]): string =>
  tokens
    .map((token, index) => (index > 0 && spaceBefore(token) ? ` ${token.text}` : token.text))
    .join('')
    .trim();

/**
 * Whether a space goes in front of this token.
 *
 * A full stop is a token like any other — the template puts it there — and it
 * is the one that does not get a space. Written here rather than in each
 * component that lays tokens out, because a rule about the shape of a sentence
 * belongs with the thing that builds sentences, and two copies of it is one
 * copy that will be forgotten.
 */
export const spaceBefore = (token: Token): boolean => !/^[.,?!;:]+$/.test(token.text);

/* ---- English ------------------------------------------------ */

/** Words that begin with a vowel *sound* and not a vowel letter, and the
 *  reverse. The rule is about how the word is said — an hour, a university —
 *  so a check on the first letter gets both of these wrong. */
const AN_ANYWAY: ReadonlySet<string> = new Set(['hour', 'honest', 'honour', 'honor', 'heir']);
const A_ANYWAY: ReadonlySet<string> = new Set([
  'university', 'unicorn', 'uniform', 'union', 'unique', 'useful', 'user', 'one', 'once', 'euro',
]);

/**
 * `a` or `an`, decided by the word that actually follows it.
 *
 * Which is the adjective when there is one: *a red apple*, never *an red
 * apple*. The article agrees with the next word, not with the noun it belongs
 * to.
 */
export function articleFor(next: string): 'a' | 'an' {
  const word = next.trim().toLowerCase();
  if (AN_ANYWAY.has(word)) return 'an';
  if (A_ANYWAY.has(word)) return 'a';
  return /^[aeiou]/.test(word) ? 'an' : 'a';
}

const NUMBER_EN: Readonly<Record<number, string>> = { 1: 'one', 2: 'two', 3: 'three' };

/** *is* or *are*. The only agreement a place sentence has, and it agrees with
 *  the count of the figure. */
const beEn = (plural: boolean): string => (plural ? 'are' : 'is');

/* ---- what a slot is filled from ---------------------------- */

/** The scene, read as the slots name it. A template says `figure`; only a
 *  place scene has one, and only an actor scene has an `actor` — so a template
 *  naming a slot its own scene does not have fills nothing, and says so. */
type Filling = {
  readonly prop: (name: 'figure' | 'ground' | 'ground2' | 'actor' | 'patient') => Prop | undefined;
  readonly count: number;
  readonly determiner: 'a' | 'the';
  readonly adjective: string | null;
  /** The relation as English says it, and as Tamil declines it. */
  readonly relationEn: string;
  readonly relationTa: (ground: Prop | undefined, second: Prop | undefined) => string;
  readonly verbEn: string;
  readonly verbTa: string;
  /** Which knob owns the relation word, for the tag on that token. */
  readonly relationKnob: string;
};

const EMPTY_FILLING: Omit<Filling, 'prop'> = {
  count: 1,
  determiner: 'the',
  adjective: null,
  relationEn: '',
  relationTa: () => '',
  verbEn: '',
  verbTa: '',
  relationKnob: 'relation',
};

const propsOf = (
  spec: SceneSpec,
): ((name: 'figure' | 'ground' | 'ground2' | 'actor' | 'patient') => Prop | undefined) => {
  const at = (id: PropId | null | undefined): Prop | undefined => propFor(id ?? null);

  return (name) => {
    switch (spec.kind) {
      case 'place':
        return name === 'figure' ? at(spec.figure) : name === 'ground' ? at(spec.ground) : name === 'ground2' ? at(spec.ground2) : undefined;
      case 'actor':
        return name === 'actor' ? at(spec.actor) : name === 'patient' ? at(spec.patient) : undefined;
      case 'relation':
        return name === 'figure' ? at(spec.left) : name === 'ground' ? at(spec.right) : undefined;
      default:
        return undefined;
    }
  };
};

/** The ground, declined for the relation and followed by whatever the relation
 *  puts after it. This is the whole of the Tamil preposition: an ending, not a
 *  word — *பெட்டியில்*, and there is nothing else to say. */
function groundTa(spec: PlaceSpec, ground: Prop | undefined, second: Prop | undefined): string {
  const shape = placeIn(spec.relation);
  const grammaticalCase = shape.case;
  if (grammaticalCase === null || !ground) return shape.after;

  /* Two grounds join the way the notes join them: the first plain, மற்றும்,
     then the second in the case the postposition asks for. */
  const head =
    spec.relation === 'between' && second
      ? `${ground.word.ta.nominative} மற்றும் ${second.word.ta[grammaticalCase]}`
      : ground.word.ta[grammaticalCase];

  return shape.after ? `${head} ${shape.after}` : head;
}

function fillingFor(spec: SceneSpec): Filling {
  const prop = propsOf(spec);

  if (spec.kind === 'place') {
    const place: PlaceSpec = spec;
    return {
      ...EMPTY_FILLING,
      prop,
      count: place.count,
      determiner: place.determiner,
      adjective: place.adjective,
      relationEn: place.relation,
      relationTa: (ground, second) => groundTa(place, ground, second),
    };
  }

  if (spec.kind === 'actor') {
    const actor: ActorSpec = spec;
    const verb = verbFor(actor.verb);
    return {
      ...EMPTY_FILLING,
      prop,
      /* Third person singular: one actor, doing it now. The other forms are in
         the lexicon and are reached by a template that asks for them. */
      verbEn: verb ? verb.word.en.third : String(actor.verb),
      /* The adjectival participle, which makes the Tamil line a phrase about
         the actor — ஆப்பிளை சாப்பிடும் மனிதன் — rather than an order to eat.
         Conjugating for person and gender needs facts an `ActorSpec` does not
         carry, and inventing them would be the silent wrongness this engine
         exists to avoid. */
      verbTa: verb ? verb.word.ta.adjectival : String(actor.verb),
      relationKnob: 'verb',
    };
  }

  return { ...EMPTY_FILLING, prop };
}

/* ---- building ---------------------------------------------- */

type Line = 'en' | 'ta';

const NOUN_SLOTS: ReadonlySet<string> = new Set(['figure', 'ground', 'ground2', 'actor', 'patient']);

/** The knob a token belongs to. `figure` and `ground` are knobs in their own
 *  right; the determiner's tag depends on whether it is saying which one or
 *  how many. */
function knobFor(slot: SentenceSlot, filling: Filling): string | null {
  switch (slot.slot) {
    case 'text':
      return null;
    case 'be':
      return null;
    case 'det':
      return filling.count > 1 ? 'count' : 'determiner';
    case 'adj':
      return 'adjective';
    case 'relation':
      return filling.relationKnob;
    case 'verb':
      return 'verb';
    default:
      return slot.slot;
  }
}

function nounEn(prop: Prop, slot: SentenceSlot, filling: Filling): string {
  /* Only the figure is counted. Two balls on one table is not two tables. */
  const counted = slot.slot === 'figure' && filling.count > 1;
  return counted ? prop.word.en.plural : prop.word.en.singular;
}

function nounTa(prop: Prop, slot: SentenceSlot, filling: Filling): string {
  const declined: TamilCase = ('case' in slot && slot.case) || 'nominative';
  const counted = slot.slot === 'figure' && filling.count > 1;

  /* A plural in any case but the nominative would need the case ending on the
     plural stem; the figure is the subject and is the only thing counted, so
     the nominative is the only place a plural can turn up. */
  return counted && declined === 'nominative'
    ? pluralOf(prop.word.ta.nominative)
    : prop.word.ta[declined];
}

/** One slot, in one language, as the text that goes in it. Empty means the
 *  slot names something this scene does not have, and the token is dropped
 *  rather than written as a hole. */
function textFor(slot: SentenceSlot, filling: Filling, line: Line, spec: SceneSpec): string {
  const plural = filling.count > 1;

  if (slot.slot === 'text') return slot.text;

  if (NOUN_SLOTS.has(slot.slot)) {
    const prop = filling.prop(slot.slot as 'figure' | 'ground' | 'ground2' | 'actor' | 'patient');
    if (!prop) return '';

    /* The Tamil ground is not a noun in a slot: it is the noun and the
       preposition together, because Tamil has no separate word for one. */
    if (line === 'ta' && slot.slot === 'ground' && spec.kind === 'place') {
      return filling.relationTa(prop, filling.prop('ground2'));
    }
    /* …and `between` says both of them in that one word, so the second ground
       has already been spoken. */
    if (line === 'ta' && slot.slot === 'ground2' && spec.kind === 'place') return '';

    return line === 'en' ? nounEn(prop, slot, filling) : nounTa(prop, slot, filling);
  }

  switch (slot.slot) {
    case 'det':
      if (line === 'en') {
        if (plural) return NUMBER_EN[filling.count] ?? String(filling.count);
        if (filling.determiner === 'the') return 'the';
        return articleFor(filling.adjective ?? firstNoun(filling));
      }
      return plural
        ? (NUMBER_TA[filling.count] ?? String(filling.count))
        : DETERMINER_TA[filling.determiner];

    case 'adj': {
      const adjective = filling.adjective;
      if (adjective === null) return '';
      return line === 'en' ? adjective : (ADJECTIVE_TA[adjective] ?? adjective);
    }

    case 'relation':
      /* English says the preposition here; Tamil said it on the ground, so
         this slot is silent in that line. A template that puts it anyway does
         not repeat it. */
      return line === 'en' ? filling.relationEn : '';

    case 'verb':
      return line === 'en' ? filling.verbEn : filling.verbTa;

    case 'be':
      return line === 'en' ? beEn(plural) : beTa(plural);

    default:
      return '';
  }
}

/** The English figure, for deciding between `a` and `an` when there is no
 *  adjective in front of it. */
const firstNoun = (filling: Filling): string => {
  const figure = filling.prop('figure');
  return figure ? figure.word.en.singular : '';
};

/**
 * Both sentences for a scene, as tokens.
 *
 * The template gives the order and the scene gives the words. A slot the scene
 * cannot fill is left out — a template asking a place scene for its verb
 * writes nothing rather than a gap or the word "undefined".
 */
export function buildSentence(spec: SceneSpec, templates: SentenceTemplates): Sentence {
  const filling = fillingFor(spec);

  const line = (slots: readonly SentenceSlot[], which: Line): readonly Token[] => {
    const filled = slots.map((slot) => ({
      slot,
      text: textFor(slot, filling, which, spec),
      knob: knobFor(slot, filling),
    }));

    return dropOrphans(filled).map(({ text, knob }) => ({ text, knob }));
  };

  return { en: capitalise(line(templates.en, 'en')), ta: line(templates.ta, 'ta') };
}

type Filled = { readonly slot: SentenceSlot; readonly text: string; readonly knob: string | null };

/**
 * Empty slots, and the words left holding nothing.
 *
 * `here` has no ground, and an intransitive verb has no patient — so a
 * template written as `… relation the ground` says *the ball is here the* the
 * moment a knob turns the ground off. The article belongs to the noun, so it
 * goes when the noun does, and so does the `and` in front of a second ground
 * that is not there.
 *
 * Only fixed words are dropped this way, and only immediately before a noun
 * that failed to fill: nothing the scene actually said is ever removed.
 */
function dropOrphans(filled: readonly Filled[]): readonly Filled[] {
  const keep = filled.map((token) => token.text.trim().length > 0);

  filled.forEach((token, index) => {
    if (!NOUN_SLOTS.has(token.slot.slot) || keep[index]) return;

    /* Walk back over the fixed words in front of it — "and", "the" — and take
       them with it. A slot the scene filled stops the walk. */
    for (let back = index - 1; back >= 0; back -= 1) {
      const previous = filled[back];
      if (!previous || previous.slot.slot !== 'text') break;
      keep[back] = false;
    }
  });

  return filled.filter((_, index) => keep[index]);
}

/** A sentence starts with a capital. Only the English one: Tamil has no
 *  letter case, and upper-casing a Tamil string is a no-op that would still
 *  look like the code believed otherwise. */
function capitalise(tokens: readonly Token[]): readonly Token[] {
  const [first, ...rest] = tokens;
  if (!first) return tokens;

  return [{ ...first, text: first.text.charAt(0).toUpperCase() + first.text.slice(1) }, ...rest];
}
