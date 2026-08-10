/* ============================================================
   translit.ts — English written in Tamil script.

   So a learner who cannot read the Latin alphabet can still
   pronounce the sentence. This is the bridge between "I understand
   the picture" and "I can say it", and it is the third of the four
   steps the lesson page layers on: pictures, then Tamil, then
   pronunciation, then English.

   Ported from the prototype's map unchanged. It covers the words
   this app actually puts on screen and nothing else — a
   transliteration guessed by rule would be a pronunciation the
   learner would then have to unlearn.
   ============================================================ */

const TRANSLIT: Readonly<Record<string, string>> = Object.freeze({
  the: 'த', a: 'அ', an: 'அன்', is: 'இஸ்', are: 'ஆர்',
  ball: 'பால்', balls: 'பால்ஸ்', apple: 'ஆப்பிள்', apples: 'ஆப்பிள்ஸ்',
  cup: 'கப்', cups: 'கப்ஸ்', cat: 'கேட்', cats: 'கேட்ஸ்',
  box: 'பாக்ஸ்', table: 'டேபிள்', chair: 'செயர்',
  in: 'இன்', on: 'ஆன்', under: 'அண்டர்', above: 'அபவ்',
  behind: 'பிஹைண்ட்', beside: 'பிசைட்',
  red: 'ரெட்', green: 'கிரீன்', big: 'பிக்', small: 'ஸ்மால்',
  '1': 'ஒன்', '2': 'டூ', '3': 'த்ரீ',
  one: 'ஒன்', two: 'டூ', three: 'த்ரீ',

  /* verbs */
  be: 'பீ', have: 'ஹேவ்', can: 'கேன்', could: 'குட்', will: 'வில்', would: 'வுட்',
  may: 'மே', might: 'மைட்', must: 'மஸ்ட்', shall: 'ஷல்', should: 'ஷுட்',
  ought: 'ஆட்', to: 'டு',

  /* WH words */
  what: 'வாட்', when: 'வென்', where: 'வேர்', why: 'வை', who: 'ஹூ', whose: 'ஹூஸ்',
  which: 'விச்', how: 'ஹவ்', much: 'மச்', many: 'மெனி', long: 'லாங்', far: 'ஃபார்',
  old: 'ஓல்ட்',

  /* adjectives */
  tall: 'டால்', short: 'ஷார்ட்', happy: 'ஹேப்பி', sad: 'சேட்', beautiful: 'பியூட்டிஃபுல்',
  good: 'குட்', bad: 'பேட்', strong: 'ஸ்ட்ராங்', weak: 'வீக்', fast: 'ஃபாஸ்ட்',
  slow: 'ஸ்லோ', clever: 'க்ளெவர்', kind: 'கைண்ட்', brave: 'பிரேவ்', honest: 'ஆனெஸ்ட்',

  /* adverbs */
  quickly: 'க்விக்லி', slowly: 'ஸ்லோலி', loudly: 'லவுட்லி', softly: 'சாஃப்ட்லி',
  always: 'ஆல்வேஸ்', usually: 'யூஷுவலி', often: 'ஆஃபன்', sometimes: 'சம்டைம்ஸ்',
  never: 'நெவர்', yesterday: 'யெஸ்டர்டே', today: 'டுடே', tomorrow: 'டுமாரோ',
  well: 'வெல்', badly: 'பேட்லி',

  /* nouns and pronouns */
  person: 'பர்சன்', place: 'ப்ளேஸ்', thing: 'திங்', animal: 'அனிமல்',
  i: 'ஐ', we: 'வீ', you: 'யூ', he: 'ஹீ', she: 'ஷீ', it: 'இட்', they: 'தே',

  /* conjunctions */
  and: 'அண்ட்', but: 'பட்', or: 'ஆர்', because: 'பிகாஸ்', so: 'சோ',
});

/** Without the punctuation the template put on the end. */
const key = (word: string): string => word.replace(/[.,?!]+$/, '');

/** One word, in Tamil script. Falls back to the word itself, which is fine
 *  mid-sentence and a lie in a row tagged `lang="ta"` — see `canTranslit`. */
export const translit = (word: string): string => {
  const k = key(word);
  return TRANSLIT[k] ?? TRANSLIT[k.toLowerCase()] ?? k;
};

/**
 * Whether every word of a phrase has a transliteration.
 *
 * `translit` falls back to the Latin word, which is fine mid-sentence but a
 * lie in a row tagged `lang="ta"` — that renders English and calls it Tamil.
 * Callers that tag their output ask first and drop the row if the answer is
 * no; a half-transliterated line is worse than none.
 */
export const canTranslit = (text: string): boolean =>
  text
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => {
      const k = key(word);
      return TRANSLIT[k] !== undefined || TRANSLIT[k.toLowerCase()] !== undefined;
    });

/** A phrase, in Tamil script. */
export const translitPhrase = (text: string): string =>
  text.split(/\s+/).filter(Boolean).map(translit).join(' ');
