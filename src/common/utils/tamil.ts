import type { PlaceRelation, TamilCase } from 'common/scene/types';

/* ============================================================
   tamil.ts — the morphology the sentence builder needs.

   English says "in the box" with a word. Tamil says பெட்டியில்
   with an ending, and which ending depends on the preposition:
   `in` and `at` take the locative and nothing else, `under` takes
   the dative and a postposition after it. There is no Tamil word
   for "in" to put in a slot, which is why the two sentences are
   built separately and why this table exists at all.

   Every form here is the source notes' own, from the
   prepositions-of-place table, with one exception recorded in
   `content/README.md`: the notes write *மேசையின் மீது* for `on`,
   a genitive the five cases in architecture §3.2 do not include.
   `மேசையில்` is correct Tamil for the same picture.
   ============================================================ */

/** What the ground noun does for a relation: which case it takes, and what
 *  word — if any — follows it. */
export type TamilPlace = {
  /** Null for `here` and `there`, which have no ground to decline. */
  readonly case: TamilCase | null;
  readonly after: string;
};

const PLACE: Readonly<Record<PlaceRelation, TamilPlace>> = Object.freeze({
  in: { case: 'locative', after: '' },
  at: { case: 'locative', after: '' },
  on: { case: 'locative', after: '' },
  under: { case: 'dative', after: 'கீழ்' },
  below: { case: 'dative', after: 'கீழே' },
  above: { case: 'dative', after: 'மேலே' },
  behind: { case: 'dative', after: 'பின்னால்' },
  'in front of': { case: 'dative', after: 'முன்னால்' },
  between: { case: 'dative', after: 'இடையில்' },
  near: { case: 'dative', after: 'அருகில்' },
  beside: { case: 'dative', after: 'பக்கத்தில்' },
  here: { case: null, after: 'இங்கே' },
  there: { case: null, after: 'அங்கே' },
});

export const placeIn = (relation: PlaceRelation): TamilPlace => PLACE[relation];

/** Which case the ground takes. The one function engine 17's step 4 names, and
 *  the reason a lesson's template cannot hard-code the case: a knob that moves
 *  the relation has to move the ending with it. */
export const caseFor = (relation: PlaceRelation): TamilCase | null => PLACE[relation].case;

/** What follows the declined ground, or an empty string. */
export const postpositionFor = (relation: PlaceRelation): string => PLACE[relation].after;

/**
 * The plural of a Tamil noun.
 *
 * Regular: `-கள்`, with the two changes the ending forces. A noun ending in ம்
 * loses it — மரம் → மரங்கள் — and an animate noun ending in ன் takes the
 * personal plural — மனிதன் → மனிதர்கள், not மனிதன்கள். Every prop in the
 * library is checked against this in the tests rather than trusted to it.
 *
 * A rule and not a table because the plural is only ever needed in the
 * nominative: the figure is what gets counted, and the figure is the subject.
 */
export function pluralOf(nominative: string): string {
  if (nominative.endsWith('ம்')) return `${nominative.slice(0, -2)}ங்கள்`;
  if (nominative.endsWith('ன்')) return `${nominative.slice(0, -2)}ர்கள்`;
  return `${nominative}கள்`;
}

/** Tamil has no articles. ஒரு and அந்த are the gloss the source notes
 *  themselves use — and they carry more weight than `a` and `the`, which is a
 *  point the lesson text makes rather than something this table can. */
export const DETERMINER_TA: Readonly<Record<'a' | 'the', string>> = Object.freeze({
  a: 'ஒரு',
  the: 'அந்த',
});

/** One, two, three. More than three is a crowd, not a number. */
export const NUMBER_TA: Readonly<Record<number, string>> = Object.freeze({
  1: 'ஒரு',
  2: 'இரண்டு',
  3: 'மூன்று',
});

/** The adjectives the place renderer can actually draw, in Tamil. An adjective
 *  it cannot draw is refused by the renderer, so nothing else can reach here. */
export const ADJECTIVE_TA: Readonly<Record<string, string>> = Object.freeze({
  red: 'சிவப்பு',
  green: 'பச்சை',
  blue: 'நீல',
  yellow: 'மஞ்சள்',
  big: 'பெரிய',
  small: 'சிறிய',
});

/** *is* and *are*, which Tamil puts last. */
export const beTa = (plural: boolean): string => (plural ? 'உள்ளன' : 'உள்ளது');
