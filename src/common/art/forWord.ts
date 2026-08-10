import type { Family } from 'common/art/families';

/* ============================================================
   forWord.ts — one answer to "does this word have a picture?"

   The drawings live in families.tsx, split into families (prep,
   pronoun, tense, adv, …). Nothing there says which family a bare
   word belongs to, so every caller would have to guess, and each
   would guess slightly differently. This is the single lookup:
   give it a word, get its family and the spelling the drawing was
   written for, or nothing.

   Nothing means nothing. A word with no drawing gets no cell, not
   a letter tile — a big grey "B" is decoration pretending to be a
   picture, and a learner who cannot read Latin gets nothing from
   it.
   ============================================================ */

/** Family, then the words that family actually draws.
 *
 *  Listing the words is the point: several family functions fall through to a
 *  generic glyph for anything handed to them, so asking the family alone would
 *  report a picture for every word in the source. */
const FAMILIES: readonly (readonly [Family, readonly string[]])[] = [
  [
    'prep',
    [
      'in', 'on', 'at', 'under', 'above', 'below', 'behind', 'beside',
      'between', 'near', 'in front of', 'there', 'here',
      'before', 'after', 'by', 'since', 'during', 'until', 'till',
      'until / till',
      'to', 'into', 'towards', 'along', 'across', 'over', 'past',
      'from',
      'about', 'for', 'with', 'as', 'like', 'per',
    ],
  ],
  ['thing', ['table', 'box', 'chair', 'ball', 'apple', 'cup', 'cat']],
  ['pronoun', ['I', 'we', 'you', 'he', 'she', 'it', 'they']],
  ['article', ['a', 'an', 'the']],
  ['noun', ['person', 'place', 'thing', 'animal']],
  ['conj', ['and', 'but', 'or', 'because', 'so']],
  [
    'adv',
    [
      'quickly', 'slowly', 'loudly', 'softly', 'always', 'usually', 'often',
      'sometimes', 'never', 'yesterday', 'today', 'tomorrow', 'well', 'badly',
    ],
  ],
  [
    'adj2',
    [
      'big', 'small', 'tall', 'short', 'happy', 'sad', 'beautiful', 'good',
      'bad', 'strong', 'weak', 'fast', 'slow', 'clever', 'kind', 'brave',
      'honest',
    ],
  ],
  [
    'wh',
    [
      'what', 'when', 'where', 'why', 'who', 'whose', 'which', 'how',
      'how much', 'how many', 'how long', 'how far', 'how old', 'how often',
    ],
  ],
  [
    'verb',
    [
      'be form', 'have form', 'can', 'could', 'will', 'would', 'may', 'might',
      'must', 'shall', 'should', 'ought to',
    ],
  ],
  [
    'tense',
    [
      'simple present', 'present continuous', 'present perfect',
      'present perfect continuous', 'simple past', 'past continuous',
      'past perfect', 'past perfect continuous', 'simple future',
      'future continuous', 'future perfect', 'future perfect continuous',
    ],
  ],
  ['sent', ['positive', 'negative', 'question', 'yes / no question', 'imperative', 'exclamatory']],
];

export type ArtHit = {
  readonly family: Family;
  /** The spelling the drawing was written for — sometimes capitalised
   *  ("What", "Simple present"). */
  readonly value: string;
  /** The cell as the source wrote it, for the label. */
  readonly raw: string;
};

/** "in front of" and "How much" are several words but one entry, so keys are
 *  always matched whole. */
const INDEX: Map<string, { readonly family: Family; readonly value: string }> = new Map();

for (const [family, words] of FAMILIES) {
  for (const word of words) {
    const key = word.toLowerCase();
    if (!INDEX.has(key)) INDEX.set(key, { family, value: word });
  }
}

/** The family functions are keyed by the value the drawing was written for,
 *  which is sometimes capitalised. Title-casing the stored spelling is enough
 *  for every family that cares, and the families that do not are keyed
 *  lowercase anyway. */
const CASED: Readonly<Record<string, string>> = Object.freeze({
  'simple present': 'Simple present',
  'present continuous': 'Present continuous',
  'present perfect': 'Present perfect',
  'present perfect continuous': 'Present perfect continuous',
  'simple past': 'Simple past',
  'past continuous': 'Past continuous',
  'past perfect': 'Past perfect',
  'past perfect continuous': 'Past perfect continuous',
  'simple future': 'Simple future',
  'future continuous': 'Future continuous',
  'future perfect': 'Future perfect',
  'future perfect continuous': 'Future perfect continuous',
  what: 'What',
  when: 'When',
  where: 'Where',
  why: 'Why',
  who: 'Who',
  whose: 'Whose',
  which: 'Which',
  how: 'How',
  'how much': 'How much',
  'how many': 'How many',
  'how long': 'How long',
  'how far': 'How far',
  'how old': 'How old',
  'how often': 'How often',
  positive: 'Positive',
  negative: 'Negative',
  question: 'Question',
  'yes / no question': 'Yes / No question',
  imperative: 'Imperative',
  exclamatory: 'Exclamatory',
});

/**
 * The word a cell teaches, if it teaches one.
 *
 * The whole cell has to be the word — never its first word. A source row
 * carries example sentences as well as the word it teaches, and "I do my work"
 * starts with a pronoun; matching loosely put a picture of "I" beside the verb
 * "do" on all forty-seven rows of the main-verbs table. A cell is the word or
 * it is not.
 */
export const lookup = (word: string | null | undefined): ArtHit | null => {
  const raw = String(word ?? '').split('\n')[0]?.trim() ?? '';
  if (!raw) return null;

  const whole = raw.toLowerCase().replace(/[.,!?]+$/, '');
  /* the source writes some entries as alternatives in one cell */
  const hit = INDEX.get(whole) ?? INDEX.get(whole.split('/')[0]?.trim() ?? '');
  if (!hit) return null;

  /* Pronouns are the one place where case is meaning: "I" is a word, "i" is
     not. Prefer the exact source spelling when the family knows it. */
  return {
    family: hit.family,
    value: CASED[hit.value.toLowerCase()] ?? hit.value,
    raw,
  };
};
